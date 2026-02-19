import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EmotionResult, EmotionType } from "@/components/EmotionDisplay";

export type RecordingState = "idle" | "recording" | "analyzing" | "done" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSpeechRecognition = (): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export function useAudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<EmotionResult | null>(null);
  const [history, setHistory] = useState<EmotionResult[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  const analyzeEmotion = useCallback(async (transcript: string) => {
    const text = transcript.trim().length < 2
      ? "I am speaking but the audio could not be transcribed clearly."
      : transcript;

    try {
      const { data, error: fnError } = await supabase.functions.invoke("detect-emotion", {
        body: { transcript: text },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const result: EmotionResult = {
        emotion: data.emotion as EmotionType,
        confidence: data.confidence,
        transcript: data.transcript,
        all_emotions: data.all_emotions,
        timestamp: new Date(),
      };

      setCurrentResult(result);
      setHistory((prev) => [result, ...prev].slice(0, 10));
      setRecordingState("done");
    } catch (err) {
      console.error("Emotion analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setRecordingState("error");
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setLiveTranscript("");
      transcriptRef.current = "";

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio context for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.85;
      source.connect(analyserNode);
      audioContextRef.current = audioContext;
      setAnalyser(analyserNode);

      // Speech recognition for live transcript
      const SR = getSpeechRecognition();
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          let final = transcriptRef.current;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + " ";
            } else {
              interim = event.results[i][0].transcript;
            }
          }
          transcriptRef.current = final;
          setLiveTranscript(final + interim);
        };

        recognition.onerror = () => { /* ignore */ };

        try { recognition.start(); } catch { /* ignore */ }
        recognitionRef.current = recognition;
      }

      // Media recorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
        setAnalyser(null);
        const finalTranscript = transcriptRef.current.trim();
        await analyzeEmotion(finalTranscript);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setRecordingState("recording");
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError("Could not access microphone. Please grant microphone permission and try again.");
      setRecordingState("error");
    }
  }, [analyzeEmotion]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecordingState("analyzing");
  }, []);

  const reset = useCallback(() => {
    setRecordingState("idle");
    setCurrentResult(null);
    setError(null);
    setRecordingDuration(0);
    setLiveTranscript("");
    transcriptRef.current = "";
  }, []);

  const analyzeFile = useCallback(async (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 10MB.");
      setRecordingState("error");
      return;
    }

    setError(null);
    setCurrentResult(null);
    setLiveTranscript("");
    setRecordingState("analyzing");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const { data, error: fnError } = await supabase.functions.invoke("analyze-audio", {
        body: { audioBase64: base64, mimeType: file.type },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const result: EmotionResult = {
        emotion: data.emotion as EmotionType,
        confidence: data.confidence,
        transcript: data.transcript || "Audio file analyzed",
        all_emotions: data.all_emotions,
        timestamp: new Date(),
      };

      setCurrentResult(result);
      setHistory((prev) => [result, ...prev].slice(0, 10));
      setRecordingState("done");
    } catch (err) {
      console.error("File analysis error:", err);
      setError(err instanceof Error ? err.message : "File analysis failed. Please try again.");
      setRecordingState("error");
    }
  }, []);

  return {
    recordingState,
    analyser,
    recordingDuration,
    error,
    currentResult,
    history,
    liveTranscript,
    startRecording,
    stopRecording,
    reset,
    analyzeFile,
  };
}
