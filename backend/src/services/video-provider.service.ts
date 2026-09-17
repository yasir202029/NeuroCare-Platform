import { randomUUID } from 'node:crypto';
import { VideoProvider } from '@prisma/client';
import { config } from '../shared/config.js';
import { badRequest } from '../shared/errors.js';

export type VideoMeeting = { provider: VideoProvider; providerSessionId: string; joinUrl: string; clinicianJoinUrl: string };

export class VideoProviderService {
  async createMeeting(provider: VideoProvider, input: { subject: string; startsAt: Date; durationMinutes: number }): Promise<VideoMeeting> {
    const providerSessionId = `${provider.toLowerCase()}-${randomUUID()}`;
    if (provider === VideoProvider.TEAMS && (!config.TEAMS_TENANT_ID || !config.TEAMS_CLIENT_ID || !config.TEAMS_CLIENT_SECRET)) {
      if (config.NODE_ENV === 'production') throw badRequest('Microsoft Teams is not configured');
    }
    if (provider === VideoProvider.ZOOM && (!config.ZOOM_ACCOUNT_ID || !config.ZOOM_CLIENT_ID || !config.ZOOM_CLIENT_SECRET)) {
      if (config.NODE_ENV === 'production') throw badRequest('Zoom is not configured');
    }
    const joinUrl = provider === VideoProvider.TEAMS
      ? `https://teams.microsoft.com/l/meetup-join/${providerSessionId}`
      : `https://zoom.us/j/${providerSessionId}`;
    return { provider, providerSessionId, joinUrl, clinicianJoinUrl: `${joinUrl}?role=host` };
  }

  async startRecording(_sessionId: string) { return { providerRecordingId: `recording-${randomUUID()}` }; }
  async stopRecording(providerRecordingId: string) { return { providerRecordingId, recordingUrl: `https://storage.neurocare.local/recordings/${providerRecordingId}` }; }
}
