import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  isRecording: boolean;
  analyser: AnalyserNode | null;
}

export function WaveformVisualizer({ isRecording, analyser }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!isRecording || !analyser) {
        // Idle flat line with subtle noise
        ctx.beginPath();
        ctx.strokeStyle = "hsl(195, 100%, 60%)";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.moveTo(0, H / 2);
        for (let x = 0; x < W; x++) {
          const y = H / 2 + Math.sin(x * 0.05 + Date.now() * 0.001) * 3;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Draw waveform
      const gradient = ctx.createLinearGradient(0, 0, W, 0);
      gradient.addColorStop(0, "hsl(220, 100%, 65%)");
      gradient.addColorStop(0.5, "hsl(195, 100%, 60%)");
      gradient.addColorStop(1, "hsl(170, 100%, 55%)");

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const sliceWidth = W / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * H) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();

      // Draw mirror with opacity
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      const mirrorGradient = ctx.createLinearGradient(0, 0, W, 0);
      mirrorGradient.addColorStop(0, "hsl(220, 100%, 65%)");
      mirrorGradient.addColorStop(0.5, "hsl(195, 100%, 60%)");
      mirrorGradient.addColorStop(1, "hsl(170, 100%, 55%)");
      ctx.strokeStyle = mirrorGradient;

      x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = H - (v * H) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording, analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={120}
      className="w-full h-full"
    />
  );
}
