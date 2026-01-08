import { useState, useRef, useEffect, useCallback } from 'react';
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

/**
 * Hook to manage audio player controls and state
 * Responsibility: Handle playback events, controls, and UI state
 */
export function useAudioPlayer(options: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const { wavesurferRef, audioUrl, initialPosition = 0, onPlay, onPause, onEnded } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);

  // Store callbacks in refs to avoid effect dependencies
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onEndedRef = useRef(onEnded);

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
      if (initialPosition > 0) {
        const maxTime = ws.getDuration() - 0.1;
        const seekTime = Math.min(initialPosition, maxTime);
        ws.seekTo(seekTime / ws.getDuration());
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
  }, [wavesurferRef, initialPosition]);

  // Load audio when URL changes
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !audioUrl) return;

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
