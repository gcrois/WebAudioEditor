import React, { useRef, useEffect, useState } from 'react';
import { useAudioEditor } from './AudioEditorContext';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

const AudioEditorComponent: React.FC = () => {
  const { 
    isLoaded, 
    isAudioLoaded, 
    message, 
    loadAudio, 
    cutAudio 
  } = useAudioEditor();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const [zoom, setZoom] = useState<number>(50);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    if (waveformRef.current && isLoaded && !wavesurferRef.current) {
      const regions = RegionsPlugin.create();
      regionsRef.current = regions;

      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        plugins: [regions],
      });

      const ws = wavesurferRef.current;

      regions.on('region-created', (region) => {
        // Remove all other regions
        regions.getRegions().forEach(r => {
          if (r !== region) {
            r.remove();
          }
        });
        region.setOptions({ color: 'rgba(255, 0, 0, 0.3)' });
        setSelectedRegion({ start: region.start, end: region.end });
      });

      regions.on('region-updated', (region) => {
        setSelectedRegion({ start: region.start, end: region.end });
      });

      ws.on('interaction', () => {
        // Allow clicking outside of the region to remove it
        if (regions.getRegions().length > 0) {
          regions.getRegions()[0].remove();
          setSelectedRegion(null);
        }
      });

      regions.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)',
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [isLoaded]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && wavesurferRef.current) {
      await loadAudio(file);
      wavesurferRef.current.loadBlob(file);
      setSelectedRegion(null);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minPxPerSec = Number(e.target.value);
    setZoom(minPxPerSec);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(minPxPerSec);
    }
  };

  const handleCut = async () => {
    if (fileInputRef.current?.files?.[0] && selectedRegion) {
      const inputFileName = fileInputRef.current.files[0].name;
      const { start, end } = selectedRegion;
      const outputFileName = 'output.mp3';
      await cutAudio(inputFileName, start, end - start, outputFileName);
    }
  };

  if (!isLoaded) {
    return <div>Loading FFmpeg...</div>;
  }

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" />
      <div ref={waveformRef} style={{ width: '100%', marginTop: '20px', marginBottom: '20px' }}></div>
      <div>
        <label>
          Zoom:
          <input type="range" min="10" max="1000" value={zoom} onChange={handleZoomChange} />
        </label>
      </div>
      <button onClick={handleCut} disabled={!isAudioLoaded || !selectedRegion}>
        Cut Selected Region and Download
      </button>
      {selectedRegion && (
        <p>
          Selected Region: {selectedRegion.start.toFixed(2)}s to {selectedRegion.end.toFixed(2)}s
        </p>
      )}
      <p>{message}</p>
    </div>
  );
};

export default AudioEditorComponent;