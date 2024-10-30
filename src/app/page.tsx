'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('Click to start recording');
  const [result, setResult] = useState<string>()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    setResult(undefined)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const base64Audio = await convertBlobToBase64(audioBlob);
        const res = await onTranscript(base64Audio);
      };

      mediaRecorder.start();
      setRecording(true);
      setStatus('Recording...');
    } catch (error) {
      setStatus('Permission denied or error occurred.');
      console.error(error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setStatus('Recording stopped.');
  };

  const handleRecordButton = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const onTranscript = async (base64Audio: string) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (response.ok) {
        setStatus('Audio uploaded successfully!');
      } else {
        setStatus('Failed to upload audio.');
      }

      const res = await response.json()
      setResult(res.result)
    } catch (error) {
      setStatus('Error uploading audio.');
      console.error(error);
    }
  };

  return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-400 to-purple-600">
        <div className="p-8 flex flex-col w-[500px] h-[400px] bg-white rounded-lg shadow-lg text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">Audio Recorder</h1>
          <div className="flex flex-col flex-1">
            <span className="text-xs text-gray-500">{status}</span>
            <div className="flex-1 pt-1 overflow-y-scroll no-scrollbar">
              <p className="text-center flex-1 text-gray-900 text-lg">{result ?? "Waiting for Transcript"}</p>
            </div>
          </div>
          <button
              onClick={handleRecordButton}
              className={`px-6 py-2 text-white rounded-lg font-medium transition ${
                  recording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
          >
            {recording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      </div>
  );
}