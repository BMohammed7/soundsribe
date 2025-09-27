// Minimal browser-only translator using OpenAI Responses API
const OPENAI_KEY =
  (typeof window !== "undefined" && localStorage.getItem("OPENAI_KEY")) ||
  (typeof window !== "undefined" && (window as any).ENV?.PUBLIC_OPENAI_API_KEY) ||
  (typeof process !== "undefined" && (process as any).env?.PUBLIC_OPENAI_API_KEY) ||
  ""; // fallback if you injected it some other way

type TranslateOpts = {
  targetLang?: string;          // e.g., "French"
  model?: string;               // e.g., "gpt-4.1-mini"
  apiKey?: string;              // override if you don't use env/localStorage
};

export async function translateWithOpenAI(
  text: string,
  opts: TranslateOpts = {}
): Promise<string> {
  if (!text?.trim()) return "";
  const apiKey = opts.apiKey || OPENAI_KEY;
  if (!apiKey) throw new Error("Missing OpenAI API key");

  const model = opts.model || "gpt-4.1-mini";
  const target = opts.targetLang || "French";

  // Instruction keeps output clean: just the translation
  const systemPrompt =
    `You are a translation engine. Translate the user's text into ${target}.` +
    ` Keep meaning, tone, and formatting. Return ONLY the translated text.`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      // We want plain text back, NOT JSON, since we only need the translation string
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      // temperature low for faithful translation
      temperature: 0.2
    }),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errTxt}`);
  }

  // Responses API gives a convenience string:
  const data = await res.json();
  // Most SDKs expose output_text; raw REST returns the same field
  const out = data.output_text ?? "";
  return String(out).trim();
}
