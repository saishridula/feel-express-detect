import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: "No audio data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert speech emotion analysis AI. You will receive an audio file. First transcribe the speech, then analyze its emotional content.

You must return ONLY a valid JSON object with this exact structure:
{
  "emotion": "<primary emotion>",
  "confidence": <number 0-1>,
  "reasoning": "<brief explanation>",
  "transcript": "<transcription of the audio>",
  "all_emotions": {
    "happy": <number 0-1>,
    "sad": <number 0-1>,
    "angry": <number 0-1>,
    "fearful": <number 0-1>,
    "disgusted": <number 0-1>,
    "surprised": <number 0-1>,
    "neutral": <number 0-1>
  }
}

Rules:
- "emotion" must be exactly one of: happy, sad, angry, fearful, disgusted, surprised, neutral
- "confidence" is the confidence for the primary emotion (0-1)
- All emotion scores in "all_emotions" must sum to approximately 1.0
- "transcript" should be the transcription of the spoken words
- If audio is unclear, do your best and note it in reasoning
- Return ONLY the JSON object, no markdown, no explanation outside the JSON`;

    const resolvedMime = mimeType || "audio/webm";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze the emotion in this audio recording." },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: resolvedMime.includes("wav") ? "wav" : resolvedMime.includes("mp3") ? "mp3" : "wav",
                },
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up your workspace usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const result = JSON.parse(cleaned);

    const validEmotions = ["happy", "sad", "angry", "fearful", "disgusted", "surprised", "neutral"];
    if (!validEmotions.includes(result.emotion)) {
      result.emotion = "neutral";
    }
    if (typeof result.confidence !== "number") {
      result.confidence = 0.5;
    }
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    for (const e of validEmotions) {
      if (typeof result.all_emotions?.[e] !== "number") {
        result.all_emotions = result.all_emotions || {};
        result.all_emotions[e] = e === result.emotion ? result.confidence : 0.05;
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-audio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
