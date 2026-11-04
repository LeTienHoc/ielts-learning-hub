/** Liveness probe for hosting/monitoring. Returns no configuration or secrets. */
export function GET() {
  return Response.json({ status: "ok" })
}
