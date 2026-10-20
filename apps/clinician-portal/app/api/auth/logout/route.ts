import { NextResponse } from "next/server";
import { clearSessionCookies, forwardAuthRequest } from "../../../../lib/server-auth";

export async function POST() {
  const { response: upstream, payload } = await forwardAuthRequest("logout");
  const result = upstream.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json(payload, { status: upstream.status });
  clearSessionCookies(result);
  return result;
}
