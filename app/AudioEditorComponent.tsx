import React, { useRef } from "react";
import { useAudioEditor } from "./AudioEditorContext";

const AudioEditorComponent: React.FC = () => {
	const {
		isLoaded,
		isAudioLoaded,
		message,
		loadAudio,
		playAudio,
		stopAudio,
		cutAudio,
	} = useAudioEditor();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			await loadAudio(file);
		}
	};

	const handlePlay = () => {
		playAudio();
	};

	const handleStop = () => {
		stopAudio();
	};

	const handleCut = async () => {
		if (fileInputRef.current?.files?.[0]) {
			const inputFileName = fileInputRef.current.files[0].name;
			const startTime = 5; // Start at 5 seconds
			const duration = 10; // Cut for 10 seconds
			const outputFileName = "output.mp3";

			await cutAudio(inputFileName, startTime, duration, outputFileName);
		}
	};

	if (!isLoaded) {
		return <div>Loading FFmpeg...</div>;
	}

	return (
		<div>
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="audio/*"
			/>
			<button onClick={handlePlay} disabled={!isAudioLoaded}>
				Play
			</button>
			<button onClick={handleStop} disabled={!isAudioLoaded}>
				Stop
			</button>
			<button onClick={handleCut} disabled={!isAudioLoaded}>
				Cut and Download
			</button>
			<p>{message}</p>
		</div>
	);
};

export default AudioEditorComponent;
