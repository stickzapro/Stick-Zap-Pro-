export async function handler(event) {
  const key = process.env.GEMINI_API_KEY;
  const fail = (statusCode, message) => ({ statusCode, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, body: message });
  if (!key) return fail(503, "Video download is not configured: GEMINI_API_KEY is missing.");
  let uri;
  try { uri = new URL(event.queryStringParameters?.uri || ""); } catch { return fail(400, "Invalid video URL."); }
  if (uri.protocol !== "https:" || uri.hostname !== "generativelanguage.googleapis.com") return fail(400, "Only provider video URLs are allowed.");
  try {
    const range = event.headers?.range || event.headers?.Range;
    const headers = { "x-goog-api-key": key };
    if (range && /^bytes=\d+-\d*$/.test(range)) headers.Range = range;
    const response = await fetch(uri.toString(), { headers, redirect: "follow" });
    if (!response.ok && response.status !== 206) return fail(response.status, "The provider video could not be downloaded. It may have expired; generate a new video.");
    const bytes = Buffer.from(await response.arrayBuffer());
    // Each proxied response stays below the buffered Netlify Functions response limit.
    if (bytes.byteLength > 4_500_000) return fail(413, "The provider did not honor the requested byte range and the video is too large for this download route.");
    const outHeaders = { "Content-Type": response.headers.get("content-type") || "video/mp4", "Cache-Control": "private, max-age=300", "Accept-Ranges": response.headers.get("accept-ranges") || "bytes" };
    const contentRange = response.headers.get("content-range");
    if (contentRange) outHeaders["Content-Range"] = contentRange;
    const contentLength = response.headers.get("content-length");
    if (contentLength) outHeaders["Content-Length"] = contentLength;
    if (response.status === 206) return { statusCode: 206, isBase64Encoded: true, headers: outHeaders, body: bytes.toString("base64") };
    outHeaders["Content-Disposition"] = "attachment; filename=stickzap-generated-video.mp4";
    return { statusCode: 200, isBase64Encoded: true, headers: outHeaders, body: bytes.toString("base64") };
  } catch { return fail(502, "Video download failed. The provider URL may have expired or the network request failed."); }
}
