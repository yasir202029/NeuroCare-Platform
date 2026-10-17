import { NextResponse } from "next/server";
import {
  forwardAuthRequest,
  refreshTokenFromRequest,
  setSessionCookies,
} from "../../../../lib/server-auth";

export async function POST(request: Request) {
  const refreshToken = refreshTokenFromRequest(request);
  if (!refreshToken)
    return NextResponse.json(
      { message: "Session expired. Sign in again." },
      { status: 401 },
    );

  const { response: upstream, payload } = await forwardAuthRequest("refresh", {
    refreshToken,
  });
  if (!upstream.ok)
    return NextResponse.json(payload, { status: upstream.status });

  const result = NextResponse.json({
    user: payload.user,
    session: payload.session,
  });
  setSessionCookies(result, payload.tokens);
  return result;
}
