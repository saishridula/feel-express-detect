import { cn } from "@/lib/utils";

export type EmotionType = "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";

export interface EmotionResult {
  emotion: EmotionType;
  confidence: number;
  transcript: string;
  all_emotions: Record<EmotionType, number>;
  timestamp: Date;
}

const EMOTION_CONFIG: Record<EmotionType, {
  emoji: string;
  label: string;
  color: string;
  bg: string;
  glow: string;
  description: string;
}> = {
  happy: {
    emoji: "😄",
    label: "Happy",
    color: "hsl(45, 100%, 58%)",
    bg: "hsl(45, 100%, 58% / 0.1)",
    glow: "glow-emotion-happy",
    description: "Joy & positivity detected",
  },
  sad: {
    emoji: "😢",
    label: "Sad",
    color: "hsl(210, 80%, 55%)",
    bg: "hsl(210, 80%, 55% / 0.1)",
    glow: "glow-emotion-sad",
    description: "Melancholy & sorrow detected",
  },
  angry: {
    emoji: "😠",
    label: "Angry",
    color: "hsl(0, 85%, 58%)",
    bg: "hsl(0, 85%, 58% / 0.1)",
    glow: "glow-emotion-angry",
    description: "Frustration & intensity detected",
  },
  fearful: {
    emoji: "😨",
    label: "Fearful",
    color: "hsl(280, 70%, 60%)",
    bg: "hsl(280, 70%, 60% / 0.1)",
    glow: "glow-emotion-fearful",
    description: "Anxiety & apprehension detected",
  },
  disgusted: {
    emoji: "🤢",
    label: "Disgusted",
    color: "hsl(140, 60%, 45%)",
    bg: "hsl(140, 60%, 45% / 0.1)",
    glow: "glow-emotion-disgusted",
    description: "Aversion & displeasure detected",
  },
  surprised: {
    emoji: "😲",
    label: "Surprised",
    color: "hsl(25, 100%, 58%)",
    bg: "hsl(25, 100%, 58% / 0.1)",
    glow: "glow-emotion-surprised",
    description: "Shock & astonishment detected",
  },
  neutral: {
    emoji: "😐",
    label: "Neutral",
    color: "hsl(195, 30%, 55%)",
    bg: "hsl(195, 30%, 55% / 0.1)",
    glow: "glow-emotion-neutral",
    description: "Calm & balanced tone detected",
  },
};

interface EmotionDisplayProps {
  result: EmotionResult;
  className?: string;
}

export function EmotionDisplay({ result, className }: EmotionDisplayProps) {
  const config = EMOTION_CONFIG[result.emotion];
  const emotions = Object.entries(result.all_emotions) as [EmotionType, number][];

  return (
    <div
      className={cn(
        "emotion-appear rounded-2xl border p-6",
        config.glow,
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(232 35% 9%), ${config.bg})`,
        borderColor: `${config.color}40`,
      }}
    >
      {/* Primary Emotion */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="text-6xl w-20 h-20 flex items-center justify-center rounded-2xl"
          style={{ background: config.bg }}
        >
          {config.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest mono" style={{ color: config.color }}>
              Primary Emotion
            </span>
          </div>
          <h2 className="text-4xl font-bold" style={{ color: config.color }}>
            {config.label}
          </h2>
          <p className="text-sm" style={{ color: `${config.color}99` }}>
            {config.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold mono" style={{ color: config.color }}>
            {Math.round(result.confidence * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">confidence</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-6">
        <div className="h-2 rounded-full bg-muted overflow-hidden progress-shimmer">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${result.confidence * 100}%`,
              background: `linear-gradient(90deg, ${config.color}99, ${config.color})`,
            }}
          />
        </div>
      </div>

      {/* Transcript */}
      {result.transcript && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "hsl(232 40% 7%)" }}>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 mono">
            Transcript
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(220 20% 80%)" }}>
            "{result.transcript}"
          </p>
        </div>
      )}

      {/* All emotion breakdown */}
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 mono">
          Emotion Breakdown
        </div>
        <div className="space-y-2">
          {emotions
            .sort((a, b) => b[1] - a[1])
            .map(([emotion, score]) => {
              const cfg = EMOTION_CONFIG[emotion];
              return (
                <div key={emotion} className="flex items-center gap-3">
                  <span className="text-base w-6">{cfg.emoji}</span>
                  <span className="text-xs w-16" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${score * 100}%`,
                        background: cfg.color,
                        opacity: emotion === result.emotion ? 1 : 0.5,
                      }}
                    />
                  </div>
                  <span className="text-xs mono w-8 text-right text-muted-foreground">
                    {Math.round(score * 100)}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

interface EmotionBadgeProps {
  emotion: EmotionType;
  size?: "sm" | "md";
}

export function EmotionBadge({ emotion, size = "md" }: EmotionBadgeProps) {
  const config = EMOTION_CONFIG[emotion];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}40`,
      }}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}

export function EmotionHistoryItem({ result }: { result: EmotionResult }) {
  const config = EMOTION_CONFIG[result.emotion];
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]"
      style={{
        borderColor: `${config.color}25`,
        background: `${config.bg}`,
      }}
    >
      <span className="text-2xl">{config.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: config.color }}>
            {config.label}
          </span>
          <span className="text-xs mono text-muted-foreground">
            {Math.round(result.confidence * 100)}%
          </span>
        </div>
        {result.transcript && (
          <p className="text-xs text-muted-foreground truncate">
            "{result.transcript}"
          </p>
        )}
      </div>
      <span className="text-xs text-muted-foreground mono whitespace-nowrap">
        {result.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
