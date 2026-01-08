import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseAudioPlayerOptions {
  wavesurferRef: React.RefObject<WaveSurfer | null>;
  audioUrl: string;
  initialPosition?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
}

// Detect iOS devices
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Hook to manage audio player controls and state
 * Responsibility: Handle playback events, controls, and UI state
 */
export function useAudioPlayer(options: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const { wavesurferRef, audioUrl, initialPosition = 0, onPlay, onPause, onEnded } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition); // Initialize with saved position
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);

  // Store callbacks in refs to avoid effect dependencies
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onEndedRef = useRef(onEnded);
  const hasRestoredPositionRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);

  // Detect iOS once and memoize the result
  const iOS = useMemo(() => isIOS(), []);

  // Keep refs updated
  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onEndedRef.current = onEnded;
  }, [onPlay, onPause, onEnded]);

  // Setup event listeners
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;

    const handlePlay = () => {
      setIsPlaying(true);

      // iOS Safari fix: restore position on first play (only on iOS)
      if (iOS && !hasRestoredPositionRef.current && pendingSeekRef.current !== null) {
        const seekTime = pendingSeekRef.current;
        setTimeout(() => {
          if (ws.getDuration() > 0) {
            ws.seekTo(seekTime / ws.getDuration());
            hasRestoredPositionRef.current = true;
            pendingSeekRef.current = null;
          }
        }, 100);
      }

      onPlayRef.current?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPauseRef.current?.();
    };

    const handleTimeUpdate = (time: number) => {
      setCurrentTime(time);
    };

    const handleReady = () => {
      setDuration(ws.getDuration());

      // Restore initial position
      if (initialPosition > 0 && !hasRestoredPositionRef.current) {
        const maxTime = ws.getDuration() - 0.1;
        const seekTime = Math.min(initialPosition, maxTime);

        if (iOS) {
          // iOS: Store position to restore on first play (requires user interaction)
          pendingSeekRef.current = seekTime;

          // Update UI to show the initial position (clock display only)
          setCurrentTime(seekTime);
          // Note: Cannot seekTo before user interaction on iOS - it will reset to 0
          // The actual seek happens in handlePlay after user clicks play
        } else {
          // Desktop/Android: Restore immediately
          setTimeout(() => {
            if (ws.getDuration() > 0) {
              ws.seekTo(seekTime / ws.getDuration());
              hasRestoredPositionRef.current = true;
            }
          }, 150);
        }
      }
    };

    const handleFinish = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const handleError = (err: string) => {
      console.error('[useAudioPlayer] Error:', err);
    };

    // Register event listeners
    ws.on('play', handlePlay);
    ws.on('pause', handlePause);
    ws.on('timeupdate', handleTimeUpdate);
    ws.on('ready', handleReady);
    ws.on('finish', handleFinish);
    ws.on('error', handleError);

    // Cleanup
    return () => {
      ws.un('play', handlePlay);
      ws.un('pause', handlePause);
      ws.un('timeupdate', handleTimeUpdate);
      ws.un('ready', handleReady);
      ws.un('finish', handleFinish);
      ws.un('error', handleError);
    };
  }, [wavesurferRef, initialPosition, iOS]);

  // Load audio when URL changes
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !audioUrl) return;

    // Reset position restoration flags when loading new audio
    hasRestoredPositionRef.current = false;
    pendingSeekRef.current = null;

    ws.load(audioUrl);
  }, [wavesurferRef, audioUrl]);

  // Control methods
  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, [wavesurferRef]);

  const setPlaybackRate = useCallback((rate: number) => {
    const ws = wavesurferRef.current;
    if (!ws) return;

    ws.setPlaybackRate(rate);
    setPlaybackRateState(rate);
  }, [wavesurferRef]);

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    togglePlay,
    setPlaybackRate,
  };
}
