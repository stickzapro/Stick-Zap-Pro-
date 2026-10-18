const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
export async function handler(event) {
  if (event.httpMethod !== "GET") return json(405, { error: "Use GET to check a video job." });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(503, { error: "GEMINI_API_KEY is not configured in Netlify." });
  const operation = event.queryStringParameters?.operation || "";
  if (!/^models\/veo-[\w.-]+\/operations\/[\w.-]+$/.test(operation) && !/^operations\/[\w.-]+$/.test(operation)) return json(400, { error: "Invalid video job identifier." });
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_BASE}/${operation}`, { headers: { "x-goog-api-key": key }, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json(response.status, { error: data.error?.message || `Could not read job status (HTTP ${response.status}).` });
    if (!data.done) return json(200, { done: false, state: "processing" });
    if (data.error) return json(200, { done: true, error: data.error.message || "The video provider reported a generation failure." });
    const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri || data.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return json(502, { done: true, error: "The provider completed the job but returned no video URL." });
    return json(200, { done: true, videoUrl: `/.netlify/functions/video-file?uri=${encodeURIComponent(videoUri)}` });
  } catch (error) { return json(error.name === "AbortError" ? 504 : 502, { error: error.name === "AbortError" ? "Status request timed out." : "Could not reach the video provider." }); }
  finally { clearTimeout(timer); }
}
