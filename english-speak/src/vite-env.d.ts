/// <reference types="vite/client" />
/// <reference types="@types/dom-speech-recognition" />

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
