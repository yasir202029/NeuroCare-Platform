import { logger } from '../infrastructure/logger.js';

export class NotificationsService {
  async email(to: string, subject: string, body: string) { logger.info({ to, subject }, 'Email notification queued'); return { channel: 'email', accepted: true }; }
  async sms(to: string, body: string) { logger.info({ to }, 'SMS notification queued'); return { channel: 'sms', accepted: true }; }
  async inApp(userId: string, title: string, body: string) { logger.info({ userId, title }, 'In-app notification queued'); return { channel: 'in_app', accepted: true }; }
}
