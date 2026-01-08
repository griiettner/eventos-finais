import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseWaveSurferReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  wavesurferRef: React.RefObject<WaveSurfer | null>;
  isLoading: boolean;
  isReady: boolean;
}

/**
 * Hook to create and manage a WaveSurfer instance
 * Responsibility: ONLY create/destroy WaveSurfer
 * Does NOT manage playback state or events
 */
export function useWaveSurfer(): UseWaveSurferReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only create once when container is ready
    if (!containerRef.current || wavesurferRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4a5568',
      progressColor: '#3182ce',
      cursorColor: '#3182ce',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      backend: 'MediaElement',
      mediaControls: false,
    });

    // Only handle loading/ready states
    ws.on('loading', () => setIsLoading(true));
    ws.on('ready', () => {
      setIsLoading(false);
      setIsReady(true);
    });

    wavesurferRef.current = ws;

    // Cleanup on unmount only
    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, []); // Empty deps - create only once

  return {
    containerRef,
    wavesurferRef,
    isLoading,
    isReady,
  };
}
