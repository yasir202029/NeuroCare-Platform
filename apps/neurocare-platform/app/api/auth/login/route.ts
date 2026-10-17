import { NextResponse } from "next/server";
import {
  forwardAuthRequest,
  setSessionCookies,
} from "../../../../lib/server-auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { response: upstream, payload } = await forwardAuthRequest(
    "login",
    body,
  );
  if (!upstream.ok || payload.mfaRequired) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const result = NextResponse.json({
    user: payload.user,
    session: payload.session,
  });
  setSessionCookies(result, payload.tokens);
  return result;
}
