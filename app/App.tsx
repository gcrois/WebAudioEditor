import { AudioEditorProvider } from "./AudioEditorContext";
import { AudioEditorComponent } from "./AudioEditorComponent";

import "./style.scss";

function App() {
	return (
		<AudioEditorProvider>
			<div className="App">
				<h1>Audio Editor</h1>
				<AudioEditorComponent />
			</div>
		</AudioEditorProvider>
	);
}

export default App;
