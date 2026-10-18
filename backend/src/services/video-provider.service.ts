import { VideoProvider } from "@prisma/client";
import { config } from "../shared/config.js";
import { badRequest, unavailable } from "../shared/errors.js";

export type VideoMeeting = {
  provider: VideoProvider;
  providerSessionId: string;
  joinUrl: string;
  clinicianJoinUrl: string;
};

export class VideoProviderService {
  async createMeeting(
    provider: VideoProvider,
    input: { subject: string; startsAt: Date; durationMinutes: number },
  ): Promise<VideoMeeting> {
    if (provider !== VideoProvider.ZOOM) {
      throw badRequest(
        "Microsoft Teams meeting creation is not configured. Select Zoom or configure the Teams integration.",
      );
    }
    if (config.VIDEO_DEV_MODE || !this.hasZoomCredentials()) {
      const sessionId = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const base = (config.API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
      return {
        provider,
        providerSessionId: sessionId,
        joinUrl: `${base}/api/v1/video/dev/session/${sessionId}`,
        clinicianJoinUrl: `${base}/api/v1/video/dev/session/${sessionId}?role=host`,
      };
    }
    const accessToken = await this.zoomAccessToken();
    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: input.subject,
        type: 2,
        start_time: input.startsAt.toISOString(),
        duration: input.durationMinutes,
        timezone: "UTC",
        settings: { waiting_room: true, join_before_host: false },
      }),
    });
    if (!response.ok)
      throw badRequest(
        "Zoom could not create the meeting. Verify the Zoom app permissions and account configuration.",
      );
    const meeting = (await response.json()) as {
      id: number | string;
      join_url: string;
      start_url: string;
    };
    return {
      provider,
      providerSessionId: String(meeting.id),
      joinUrl: meeting.join_url,
      clinicianJoinUrl: meeting.start_url,
    };
  }

  async clinicianJoinUrl(provider: VideoProvider, providerSessionId: string) {
    if (provider !== VideoProvider.ZOOM)
      throw badRequest("Host links are not configured for this video provider");
    if (config.VIDEO_DEV_MODE || !this.hasZoomCredentials()) {
      const base = (config.API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
      return `${base}/api/v1/video/dev/session/${encodeURIComponent(providerSessionId)}?role=host`;
    }
    const accessToken = await this.zoomAccessToken();
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(providerSessionId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!response.ok)
      throw badRequest(
        "Zoom could not retrieve the host link for this meeting",
      );
    const meeting = (await response.json()) as { start_url?: string };
    if (!meeting.start_url) throw badRequest("Zoom did not return a host link");
    return meeting.start_url;
  }

  async startRecording(sessionId: string): Promise<never> {
    if (!this.hasZoomCredentials())
      throw unavailable("Zoom cloud recording is not configured for this clinic");
    throw badRequest("Zoom cloud recording is not configured for this clinic");
  }

  async stopRecording(providerRecordingId: string): Promise<never> {
    if (!this.hasZoomCredentials())
      throw unavailable("Zoom cloud recording is not configured for this clinic");
    throw badRequest("Zoom cloud recording is not configured for this clinic");
  }

  /** True when real Zoom Server-to-Server OAuth credentials are configured. */
  private hasZoomCredentials(): boolean {
    const accountId = config.ZOOM_ACCOUNT_ID;
    const clientId = config.ZOOM_CLIENT_ID;
    const clientSecret = config.ZOOM_CLIENT_SECRET;
    return Boolean(
      accountId &&
        clientId &&
        clientSecret &&
        ![accountId, clientId, clientSecret].some((value) =>
          value.toLowerCase().includes("replace"),
        ),
    );
  }

  private async zoomAccessToken() {
    const accountId = config.ZOOM_ACCOUNT_ID;
    const clientId = config.ZOOM_CLIENT_ID;
    const clientSecret = config.ZOOM_CLIENT_SECRET;
    if (
      !accountId ||
      !clientId ||
      !clientSecret ||
      [accountId, clientId, clientSecret].some((value) =>
        value.toLowerCase().includes("replace"),
      )
    ) {
      throw badRequest(
        "Zoom is not configured. Add the Zoom account ID, client ID and client secret on the backend.",
      );
    }
    const basicAuthorization = Buffer.from(
      `${clientId}:${clientSecret}`,
    ).toString("base64");
    const response = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuthorization}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    if (!response.ok)
      throw badRequest(
        "Zoom authentication failed. Check the server-side Zoom app credentials and scopes.",
      );
    const result = (await response.json()) as { access_token?: string };
    if (!result.access_token)
      throw badRequest("Zoom did not return an access token");
    return result.access_token;
  }
}
