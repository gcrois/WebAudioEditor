import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";

const baseURL = import.meta.env.VITE_BASE_URL;

export class AudioEditor {
	private ffmpeg: FFmpeg;
	private audioContext: AudioContext;
	private audioBuffer: AudioBuffer | null = null;
	private sourceNode: AudioBufferSourceNode | null = null;

	constructor() {
		this.ffmpeg = new FFmpeg();

		this.audioContext = new (window.AudioContext ||
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).webkitAudioContext)();
	}

	on(
		eventName: "log" | "progress",
		listener: (event: unknown) => void,
	): void {
		this.ffmpeg.on(eventName as "log", listener);
	}

	off(
		eventName: "log" | "progress",
		listener: (event: unknown) => void,
	): void {
		this.ffmpeg.off(eventName as "log", listener);
	}

	async init(): Promise<void> {
		await this.ffmpeg.load({
			coreURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.js`,
				"text/javascript",
			),
			wasmURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.wasm`,
				"application/wasm",
			),
			workerURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.worker.js`,
				"text/javascript",
			),
		});
	}

	createDownloadableFile(blob: Blob, fileName: string): void {
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.style.display = "none";
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async loadAudio(file: File): Promise<void> {
		const arrayBuffer = await file.arrayBuffer();
		this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
		await this.ffmpeg.writeFile(file.name, await fetchFile(file));
	}

	playAudio(startTime: number = 0, duration?: number): void {
		if (!this.audioBuffer) return;

		this.sourceNode = this.audioContext.createBufferSource();
		this.sourceNode.buffer = this.audioBuffer;
		this.sourceNode.connect(this.audioContext.destination);
		this.sourceNode.start(0, startTime, duration);
	}

	stopAudio(): void {
		if (this.sourceNode) {
			this.sourceNode.stop();
		}
	}

	async cutAudio(
		inputFileName: string,
		startTime: number,
		duration: number,
		outputFileName: string,
	): Promise<Blob> {
		await this.ffmpeg.exec([
			"-i",
			inputFileName,
			"-ss",
			`${startTime}`,
			"-t",
			`${duration}`,
			"-c",
			"copy",
			outputFileName,
		]);

		const fileData = await this.ffmpeg.readFile(outputFileName);
		const data = new Uint8Array(fileData as ArrayBuffer);
		return new Blob([data.buffer], { type: "audio/mp3" });
	}
}
