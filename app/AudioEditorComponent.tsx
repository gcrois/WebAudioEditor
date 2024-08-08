import React, { useRef, useEffect, useState } from "react";
import { useAudioEditor } from "./AudioEditorContext";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

export const AudioEditorComponent: React.FC = () => {
	const { isLoaded, isAudioLoaded, message, loadAudio, cutAudio } =
		useAudioEditor();

	const fileInputRef = useRef<HTMLInputElement>(null);
	const waveformRef = useRef<HTMLDivElement>(null);
	const wavesurferRef = useRef<WaveSurfer | null>(null);
	const regionsRef = useRef<RegionsPlugin | null>(null);
	const [zoom, setZoom] = useState<number>(50);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [currentTime, setCurrentTime] = useState<number>(0);
	const [duration, setDuration] = useState<number>(0);
	const [selectedRegion, setSelectedRegion] = useState<{
		start: number;
		end: number;
	} | null>(null);
	const [currentFileName, setCurrentFileName] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		if (waveformRef.current && isLoaded && !wavesurferRef.current) {
			const regions = RegionsPlugin.create();
			regionsRef.current = regions;

			wavesurferRef.current = WaveSurfer.create({
				container: waveformRef.current,
				waveColor: "rgb(200, 0, 200)",
				progressColor: "rgb(100, 0, 100)",
				plugins: [regions],
			});

			const ws = wavesurferRef.current;

			ws.on("ready", () => {
				setDuration(ws.getDuration());
				setIsLoading(false);
			});

			ws.on("audioprocess", () => {
				setCurrentTime(ws.getCurrentTime());
			});

			ws.on("seek", () => {
				setCurrentTime(ws.getCurrentTime());
			});

			ws.on("play", () => setIsPlaying(true));
			ws.on("pause", () => setIsPlaying(false));

			regions.on("region-created", (region) => {
				regions.getRegions().forEach((r) => {
					if (r !== region) {
						r.remove();
					}
				});
				region.setOptions({ color: "rgba(255, 0, 0, 0.3)" });
				setSelectedRegion({ start: region.start, end: region.end });
			});

			regions.on("region-updated", (region) => {
				setSelectedRegion({ start: region.start, end: region.end });
			});

			ws.on("interaction", () => {
				if (regions.getRegions().length > 0) {
					regions.getRegions()[0].remove();
					setSelectedRegion(null);
				}
			});

			regions.enableDragSelection({
				color: "rgba(255, 0, 0, 0.1)",
			});
		}

		return () => {
			if (wavesurferRef.current) {
				wavesurferRef.current.destroy();
			}
		};
	}, [isLoaded]);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file && wavesurferRef.current) {
			setIsLoading(true);
			await loadAudio(file);
			wavesurferRef.current.loadBlob(file);
			setSelectedRegion(null);
			setCurrentTime(0);
			setCurrentFileName(file.name);
		}
	};

	const handleLoadExample = async () => {
		setIsLoading(true);
		const exampleUrl = `${import.meta.env.VITE_BASE_URL}/Vivaldi-Dmin-double.mp3`;
		const response = await fetch(exampleUrl);
		const blob = await response.blob();
		const file = new File([blob], "Vivaldi-Dmin-double.mp3", {
			type: "audio/mpeg",
		});

		if (wavesurferRef.current) {
			await loadAudio(file);
			wavesurferRef.current.load(exampleUrl);
			setSelectedRegion(null);
			setCurrentTime(0);
			setCurrentFileName("Vivaldi-Dmin-double.mp3");
		}
	};

	const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const minPxPerSec = Number(e.target.value);
		setZoom(minPxPerSec);
		if (wavesurferRef.current) {
			wavesurferRef.current.zoom(minPxPerSec);
		}
	};

	const handlePlayPause = () => {
		if (wavesurferRef.current) {
			wavesurferRef.current.playPause();
		}
	};

	const handleCut = async () => {
		if (selectedRegion && currentFileName) {
			const { start, end } = selectedRegion;
			const outputFileName = `${currentFileName.replace(/\.[^/.]+$/, "")}-${formatTime(start).replace(":", "-")}-${formatTime(end).replace(":", "-")}.mp3`;
			await cutAudio(currentFileName, start, end - start, outputFileName);
		}
	};

	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	if (!isLoaded) {
		return <div>Loading FFmpeg...</div>;
	}

	return (
		<div>
			Upload an mp3 or wav file:{" "}
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="audio/*"
			/>
			<button onClick={handleLoadExample}>Load Example Audio</button> from
			defunct <a href="https://www.ibiblio.org/pandora/HOMEPAGE.html">Pandora Records</a>
			{isLoading && <div>Loading audio file...</div>}
			<div
				ref={waveformRef}
				style={{
					width: "100%",
					marginTop: "20px",
					marginBottom: "20px",
				}}
			></div>
			<div>
				<button onClick={handlePlayPause}>
					{isPlaying ? "Pause" : "Play"}
				</button>
				<span>
					{formatTime(currentTime)} / {formatTime(duration)}
				</span>
			</div>
			<div>
				<label>
					Zoom:
					<input
						type="range"
						min="10"
						max="1000"
						value={zoom}
						onChange={handleZoomChange}
					/>
				</label>
			</div>
			<button
				onClick={handleCut}
				disabled={!selectedRegion || !currentFileName}
			>
				Cut Selected Region and Download
			</button>
			{selectedRegion && (
				<p>
					Selected Region: {formatTime(selectedRegion.start)} to{" "}
					{formatTime(selectedRegion.end)}
				</p>
			)}
			<p>{message}</p>
		</div>
	);
};
