import { NextResponse } from "next/server";
import {
  clearSessionCookies,
  forwardAuthRequest,
  refreshTokenFromRequest,
} from "../../../../lib/server-auth";

export async function POST(request: Request) {
  const refreshToken = refreshTokenFromRequest(request);
  if (refreshToken) {
    try {
      await forwardAuthRequest("logout", { refreshToken });
    } catch {
      // Clear the browser session even if the API is offline.
    }
  }

  const result = NextResponse.json({ loggedOut: true });
  clearSessionCookies(result);
  return result;
}
