import React from 'react';
import { CheckCircle2, Pause, Play } from 'lucide-react';
import { AdminService } from '../services/admin-service';
import { useWaveSurfer } from '../hooks/useWaveSurfer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAudioProgressSync } from '../hooks/useAudioProgressSync';

interface AudioPlayerProps {
  chapterId: string;
  audioUrl: string;
  initialPosition: number;
  isAudioFinished: boolean;
  onAudioFinishedChange: (finished: boolean) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  chapterId,
  audioUrl,
  initialPosition,
  isAudioFinished,
  onAudioFinishedChange
}) => {
  // Hook 1: Create WaveSurfer instance
  const { containerRef, wavesurferRef, isLoading, isReady } = useWaveSurfer();

  // Hook 2: Manage player controls and state
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    togglePlay,
    setPlaybackRate: changePlaybackRate,
  } = useAudioPlayer({
    wavesurferRef,
    audioUrl,
    initialPosition,
    onEnded: () => {
      onAudioFinishedChange(true);
      if (wavesurferRef.current) {
        AdminService.updateAudioProgress(chapterId, true, wavesurferRef.current.getDuration());
      }
    },
  });

  // Hook 3: Sync progress to backend
  useAudioProgressSync({
    chapterId,
    wavesurferRef,
    isPlaying,
    isAudioFinished,
  });

  // Format time helper
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className='audio-player-section card'>
      <div className='custom-audio-player'>
        <div className='waveform-container' ref={containerRef} />

        <div className='player-controls'>
          <button
            onClick={togglePlay}
            className='play-btn'
            disabled={isLoading || !isReady}
          >
            {isLoading ? (
              <span style={{ fontSize: '12px' }}>...</span>
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} />
            )}
          </button>

          <div className='progress-container'>
            <span className='time-display'>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className='speed-controls'>
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(Number(e.target.value))}
              className='speed-select'
              disabled={!isReady}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={1.75}>1.75x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>

        {isAudioFinished && (
          <div className="audio-finished-badge">
            <CheckCircle2 size={16} /> Áudio concluído
          </div>
        )}
      </div>
    </section>
  );
};

export default AudioPlayer;
