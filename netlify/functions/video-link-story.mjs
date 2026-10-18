const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
const allowed = new Set(["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com", "tiktok.com", "www.tiktok.com", "instagram.com", "www.instagram.com", "facebook.com", "www.facebook.com", "fb.watch"]);
export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Use POST to inspect a video link." });
  let body; try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Request body must be valid JSON." }); }
  let url; try { url = new URL(body.url || ""); } catch { return json(400, { error: "Enter a valid video URL." }); }
  const directVideo = /\.(mp4|webm|mov|m4v)$/i.test(url.pathname);
  if (url.protocol !== "https:" || (!allowed.has(url.hostname.toLowerCase()) && !directVideo)) return json(400, { error: "Use an HTTPS link from YouTube, TikTok, Facebook, Instagram, or a direct .mp4/.webm/.mov video URL." });
  let title = "";
  try {
    let oembed = "";
    if (directVideo) title = url.pathname.split("/").pop()?.slice(0, 250) || "Video link";
    if (["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"].includes(url.hostname)) oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url.toString())}&format=json`;
    else if (["tiktok.com", "www.tiktok.com"].includes(url.hostname)) oembed = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url.toString())}`;
    if (oembed) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 7000);
      try { const response = await fetch(oembed, { signal: controller.signal }); if (response.ok) { const data = await response.json(); title = typeof data.title === "string" ? data.title.slice(0, 250) : ""; } } finally { clearTimeout(timer); }
    }
  } catch { /* Metadata is optional; never attempt to bypass platform restrictions. */ }
  return json(200, { title, message: title ? "Public metadata was available, but captions/transcript were not available through this integration." : "The platform did not expose accessible title/caption metadata through this integration." });
}
