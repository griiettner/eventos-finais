import { useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { AdminService } from '../services/admin-service';

interface UseAudioProgressSyncOptions {
  chapterId: string | undefined;
  wavesurferRef: React.RefObject<WaveSurfer | null>;
  isPlaying: boolean;
  isAudioFinished: boolean;
  intervalMs?: number;
}

/**
 * Hook to sync audio progress with backend
 * Responsibility: Save progress periodically, on pause, and on unmount
 */
export function useAudioProgressSync(options: UseAudioProgressSyncOptions): void {
  const { chapterId, wavesurferRef, isPlaying, isAudioFinished, intervalMs = 3000 } = options;

  const lastSavedPosRef = useRef(0);
  const lastSavedTimeRef = useRef(0);

  // Save progress helper
  const saveProgress = useCallback((finished: boolean) => {
    const ws = wavesurferRef.current;
    if (!ws || !chapterId) return;

    const currentPos = ws.getCurrentTime();
    const duration = ws.getDuration();
    const percentage = duration > 0 ? Math.round((currentPos / duration) * 100) : 0;

    if (currentPos > 0) {
      AdminService.updateAudioProgress(chapterId, finished, currentPos, percentage);
      lastSavedPosRef.current = currentPos;
      lastSavedTimeRef.current = Date.now();
    }
  }, [chapterId, wavesurferRef]);

  // Auto-save while playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const ws = wavesurferRef.current;
      if (!ws) return;

      const now = Date.now();
      const currentPos = ws.getCurrentTime();
      const timeDiff = now - lastSavedTimeRef.current;
      const posDiff = Math.abs(currentPos - lastSavedPosRef.current);

      // Save if enough time has passed and position changed
      if (timeDiff >= intervalMs && posDiff >= 1 && currentPos > 0) {
        saveProgress(false);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isPlaying, intervalMs, saveProgress, wavesurferRef]);

  // Save on pause (handled by onPause callback in useAudioPlayer)
  // We still add this as a safety net
  useEffect(() => {
    if (!isPlaying && wavesurferRef.current) {
      const currentPos = wavesurferRef.current.getCurrentTime();
      const posDiff = Math.abs(currentPos - lastSavedPosRef.current);

      if (posDiff >= 0.5 && currentPos > 0) {
        saveProgress(false);
      }
    }
  }, [isPlaying, saveProgress, wavesurferRef]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (chapterId && wavesurferRef.current) {
        const finalPos = wavesurferRef.current.getCurrentTime();
        const duration = wavesurferRef.current.getDuration();
        const percentage = duration > 0 ? Math.round((finalPos / duration) * 100) : 0;

        if (finalPos > 0) {
          AdminService.updateAudioProgress(chapterId, isAudioFinished, finalPos, percentage);
        }
      }
    };
  }, [chapterId, wavesurferRef, isAudioFinished]);
}
