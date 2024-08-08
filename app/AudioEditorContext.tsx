import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { AudioEditor } from "@src/AudioEditor";

interface AudioEditorContextType {
	audioEditor: AudioEditor | null;
	isLoaded: boolean;
	isAudioLoaded: boolean;
	message: string;
	loadAudio: (file: File) => Promise<void>;
	playAudio: (startTime?: number, duration?: number) => void;
	stopAudio: () => void;
	cutAudio: (
		inputFileName: string,
		startTime: number,
		duration: number,
		outputFileName: string,
	) => Promise<void>;
}

const AudioEditorContext = createContext<AudioEditorContextType | undefined>(
	undefined,
);

export const useAudioEditor = () => {
	const context = useContext(AudioEditorContext);
	if (context === undefined) {
		throw new Error(
			"useAudioEditor must be used within an AudioEditorProvider",
		);
	}
	return context;
};

interface AudioEditorProviderProps {
	children: ReactNode;
}

export const AudioEditorProvider: React.FC<AudioEditorProviderProps> = ({
	children,
}) => {
	const [audioEditor, setAudioEditor] = useState<AudioEditor | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isAudioLoaded, setIsAudioLoaded] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => {
		const initAudioEditor = async () => {
			const editor = new AudioEditor();
			await editor.init();
			editor.on("log", (event: unknown) => {
				if (
					typeof event === "object" &&
					event !== null &&
					"message" in event
				) {
					setMessage(String(event.message));
				}
			});
			setAudioEditor(editor);
			setIsLoaded(true);
		};

		initAudioEditor();

		return () => {
			if (audioEditor) {
				audioEditor.off("log", () => {});
			}
		};
	}, []);

	const loadAudio = async (file: File) => {
		if (audioEditor) {
			await audioEditor.loadAudio(file);
			setIsAudioLoaded(true);
		}
	};

	const playAudio = (startTime?: number, duration?: number) => {
		audioEditor?.playAudio(startTime, duration);
	};

	const stopAudio = () => {
		audioEditor?.stopAudio();
	};

	const cutAudio = async (
		inputFileName: string,
		startTime: number,
		duration: number,
		outputFileName: string,
	) => {
		if (audioEditor) {
			const cutBlob = await audioEditor.cutAudio(
				inputFileName,
				startTime,
				duration,
				outputFileName,
			);
			audioEditor.createDownloadableFile(cutBlob, outputFileName);
		}
	};

	const value = {
		audioEditor,
		isLoaded,
		isAudioLoaded,
		message,
		loadAudio,
		playAudio,
		stopAudio,
		cutAudio,
	};

	return (
		<AudioEditorContext.Provider value={value}>
			{children}
		</AudioEditorContext.Provider>
	);
};
