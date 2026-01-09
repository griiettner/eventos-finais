import React from 'react';
import { CheckCircle2, Pause, Play, Volume2, VolumeX, Repeat } from 'lucide-react';
import { AdminService } from '../services/admin-service';
import { useWaveSurfer } from '../hooks/useWaveSurfer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAudioProgressSync } from '../hooks/useAudioProgressSync';

interface AudioPlayerProps {
  chapterId: string;
  audioUrl: string;
  initialPosition: number;
  audioPlayCount: number;
  onAudioPlayCountChange: (count: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  chapterId,
  audioUrl,
  initialPosition,
  audioPlayCount,
  onAudioPlayCountChange
}) => {
  // Hook 1: Create WaveSurfer instance
  const { containerRef, wavesurferRef, isLoading } = useWaveSurfer();

  // Hook 2: Manage player controls and state
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    togglePlay,
    setPlaybackRate: changePlaybackRate,
    setVolume,
    setMuted,
    seek,
  } = useAudioPlayer({
    wavesurferRef,
    audioUrl,
    initialPosition,
    onEnded: () => {
      if (wavesurferRef.current) {
        const duration = wavesurferRef.current.getDuration();
        // Increment play count when audio finishes
        AdminService.updateAudioProgress(chapterId, true, duration, 100, true);
        onAudioPlayCountChange(audioPlayCount + 1);
      }
    },
  });

  // Hook 3: Sync progress to backend
  useAudioProgressSync({
    chapterId,
    wavesurferRef,
    isPlaying,
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
        <div className='player-controls'>
          <div className='progress-container'>
            <button
              onClick={togglePlay}
              className='play-btn'
              disabled={isLoading}
            >
              {isLoading ? (
                <span className='loading-spinner'>...</span>
              ) : isPlaying ? (
                <Pause size={24} />
              ) : (
                <Play size={24} />
              )}
            </button>
            <div className='audio-status-badges'>
              {audioPlayCount > 0 && (
                <div className='audio-play-count-badge' title={`${audioPlayCount} reproduções concluídas`}>
                  <Repeat size={14} />
                  <span>{audioPlayCount}</span>
                </div>
              )}
              {audioPlayCount > 0 && (
                <div className='audio-finished-badge'>
                  <CheckCircle2 size={16} /> <span>Concluído</span>
                </div>
              )}
            </div>
            <div className='speed-controls-buttons'>
              {[1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`speed-btn ${playbackRate === rate ? 'active' : ''}`}
                >
                  {rate}x
                </button>
              ))}
            </div>
            <div className='volume-controls'>
              <button onClick={() => setMuted(!isMuted)} className='volume-btn'>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type='range'
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const vol = Number(e.target.value);
                  setVolume(vol);
                }}
                className='volume-slider'
              />
            </div>
          </div>
        </div>

        <span className='time-display'>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <input
          type='range'
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const time = Number(e.target.value);
            seek(time);
          }}
          className='progress-slider'
        />
        <div ref={containerRef} className="waveform-container"></div>
      </div>
    </section>
  );
};

export default AudioPlayer;
