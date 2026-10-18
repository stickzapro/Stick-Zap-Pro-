export default async () => new Response(JSON.stringify({
  ok: true,
  app: "StickZap Creator Studio",
  mode: "local-first",
  note: "This health check does not expose secrets or imply AI providers are configured."
}), {
  status: 200,
  headers: { "content-type": "application/json; charset=utf-8" }
});
