const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Use POST to start a video job." });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(503, { error: "Video generation is not configured yet. Add GEMINI_API_KEY in Netlify → Site configuration → Environment variables, then redeploy." });
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Request body must be valid JSON." }); }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 12 || prompt.length > 12000) return json(400, { error: "The story prompt must be between 12 and 12,000 characters." });
  const aspectRatio = ["9:16", "16:9"].includes(body.aspectRatio) ? body.aspectRatio : "9:16";
  // Accept numeric values (4/6/8) and defensive legacy labels such as "4 seconds",
  // but normalize to an integer before validating. Veo's REST schema expects the
  // durationSeconds parameter serialized as the string "4", "6", or "8".
  const rawDuration = body.durationSeconds;
  const parsedDuration = typeof rawDuration === "number"
    ? rawDuration
    : typeof rawDuration === "string"
      ? Number(rawDuration.trim().match(/^(4|6|8)(?:\s*seconds?)?$/i)?.[1])
      : NaN;
  if (!Number.isInteger(parsedDuration) || ![4, 6, 8].includes(parsedDuration)) {
    return json(400, { error: 'Invalid duration. Send 4, 6, or 8 (or labels such as "4 seconds").' });
  }
  const durationSeconds = parsedDuration;
  const resolution = ["720p", "1080p", "4k"].includes(body.resolution) ? body.resolution : "720p";
  if (resolution !== "720p" && durationSeconds !== 8) return json(400, { error: "1080p and 4K output require an 8-second clip. Choose 720p or set duration to 8 seconds." });
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE}/models/veo-3.1-generate-preview:predictLongRunning`, {
      method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt }], parameters: { aspectRatio, durationSeconds: String(durationSeconds), resolution, personGeneration: "allow_all", numberOfVideos: 1 } }), signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json(response.status, { error: data.error?.message || `Video provider returned HTTP ${response.status}. Check API access, billing, and model availability.` });
    if (!data.name) return json(502, { error: "The video provider did not return a job name." });
    return json(202, { operationName: data.name, provider: "google-veo-3.1" });
  } catch (error) { return json(error.name === "AbortError" ? 504 : 502, { error: error.name === "AbortError" ? "The provider request timed out. Please retry." : "Could not reach the video provider." }); }
  finally { clearTimeout(timer); }
}
