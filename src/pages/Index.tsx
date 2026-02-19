import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { EmotionDisplay, EmotionHistoryItem } from "@/components/EmotionDisplay";
import { Mic, MicOff, RotateCcw, Loader2, AlertCircle, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Index() {
  const {
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
  } = useAudioRecorder();

  const isRecording = recordingState === "recording";
  const isAnalyzing = recordingState === "analyzing";
  const isIdle = recordingState === "idle";
  const isDone = recordingState === "done";
  const isError = recordingState === "error";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(195 100% 60% / 0.2)", border: "1px solid hsl(195 100% 60% / 0.4)" }}>
              <Zap className="w-4 h-4" style={{ color: "hsl(195, 100%, 60%)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">EmotiSense</h1>
              <p className="text-xs text-muted-foreground">Speech Emotion Detector</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-muted")} />
            <span className="text-xs text-muted-foreground mono">
              {isRecording ? "LIVE" : isAnalyzing ? "ANALYZING" : "READY"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hero section */}
            {isIdle && !currentResult && (
              <div className="text-center py-8">
                <h2 className="text-5xl font-bold mb-3 text-gradient-primary">
                  Detect Your Emotion
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Record your voice and our AI will analyze the emotional content of your speech in real-time.
                </p>
              </div>
            )}

            {/* Waveform Card */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isRecording ? "bg-red-500 recording-pulse" : "bg-muted"
                  )} />
                  <span className="text-sm font-medium">
                    {isRecording ? "Recording..." : isAnalyzing ? "Processing..." : "Waveform"}
                  </span>
                </div>
                {isRecording && (
                  <span className="mono text-sm font-bold" style={{ color: "hsl(0, 85%, 60%)" }}>
                    {formatDuration(recordingDuration)}
                  </span>
                )}
              </div>

              <div className="h-28 rounded-xl overflow-hidden" style={{ background: "hsl(232 40% 7%)" }}>
                <WaveformVisualizer isRecording={isRecording} analyser={analyser} />
              </div>

              {/* Live transcript */}
              {isRecording && (
                <div className="mt-3 min-h-[40px]">
                  {liveTranscript ? (
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{liveTranscript}"
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      🎤 Speak now — transcript will appear here...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Record Button */}
            <div className="flex flex-col items-center gap-4">
              {(isIdle || isDone) && (
                <button
                  onClick={isDone ? reset : startRecording}
                  className={cn(
                    "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
                    "glow-primary"
                  )}
                  style={{
                    background: "linear-gradient(135deg, hsl(195 100% 50%), hsl(220 100% 60%))",
                  }}
                >
                  {isDone ? (
                    <RotateCcw className="w-8 h-8 text-background" />
                  ) : (
                    <Mic className="w-8 h-8 text-background" />
                  )}
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 recording-pulse"
                  style={{ background: "hsl(0, 85%, 58%)" }}
                >
                  <MicOff className="w-8 h-8 text-white" />
                </button>
              )}

              {isAnalyzing && (
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ border: "2px solid hsl(195 100% 60% / 0.4)" }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "hsl(195, 100%, 60%)" }} />
                </div>
              )}

              {isError && (
                <button
                  onClick={reset}
                  className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
                  style={{ background: "hsl(0 85% 58% / 0.2)", border: "2px solid hsl(0 85% 58% / 0.4)" }}
                >
                  <RotateCcw className="w-8 h-8" style={{ color: "hsl(0, 85%, 60%)" }} />
                </button>
              )}

              <div className="text-center">
                {isIdle && (
                  <p className="text-sm text-muted-foreground">
                    Click to start recording your voice
                  </p>
                )}
                {isRecording && (
                  <p className="text-sm" style={{ color: "hsl(0, 85%, 60%)" }}>
                    Click to stop and analyze
                  </p>
                )}
                {isAnalyzing && (
                  <p className="text-sm" style={{ color: "hsl(195, 100%, 60%)" }}>
                    AI is detecting your emotion...
                  </p>
                )}
                {isDone && (
                  <p className="text-sm text-muted-foreground">
                    Click to record again
                  </p>
                )}
                {isError && (
                  <p className="text-sm" style={{ color: "hsl(0, 85%, 60%)" }}>
                    Click to try again
                  </p>
                )}
              </div>
            </div>

            {/* Error */}
            {isError && error && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "hsl(0 85% 58% / 0.1)", border: "1px solid hsl(0 85% 58% / 0.3)" }}
              >
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "hsl(0, 85%, 60%)" }} />
                <p className="text-sm" style={{ color: "hsl(0, 85%, 70%)" }}>{error}</p>
              </div>
            )}

            {/* Emotion Result */}
            {currentResult && (
              <EmotionDisplay result={currentResult} />
            )}

            {/* How it works - only when idle */}
            {isIdle && !currentResult && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { step: "01", icon: "🎙️", title: "Record", desc: "Click the mic and speak naturally for a few seconds" },
                  { step: "02", icon: "🧠", title: "Analyze", desc: "AI transcribes your voice and detects emotional cues" },
                  { step: "03", icon: "✨", title: "Discover", desc: "See your primary emotion and full emotional breakdown" },
                ].map((item) => (
                  <div key={item.step} className="glass rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-xs mono text-muted-foreground mb-1">{item.step}</div>
                    <div className="text-sm font-semibold mb-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column — History */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent Results</h3>
                {history.length > 0 && (
                  <span className="ml-auto text-xs mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {history.length}
                  </span>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎭</div>
                  <p className="text-sm text-muted-foreground">
                    Your emotion history will appear here after each recording.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <EmotionHistoryItem key={idx} result={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Tips card */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-3">💡 Tips for better results</h3>
              <ul className="space-y-2">
                {[
                  "Speak in a quiet environment",
                  "Use complete sentences",
                  "Express yourself naturally",
                  "Record at least 3–5 seconds",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5" style={{ color: "hsl(195, 100%, 60%)" }}>›</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
