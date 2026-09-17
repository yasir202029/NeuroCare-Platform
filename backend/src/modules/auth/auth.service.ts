import { createHash, randomBytes, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { MfaChallengeType, MfaMethod, Role, type User } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { config } from '../../shared/config.js';
import { logger } from '../../infrastructure/logger.js';
import { NotificationsService } from '../../services/notifications.service.js';
import { badRequest, forbidden, notFound, unauthorized } from '../../shared/errors.js';

type RequestMeta = { ipAddress?: string; userAgent?: string; deviceId?: string };
type TokenUser = Pick<User, 'id' | 'email' | 'roles'>;
type Claims = { sub: string; email: string; roles: Role[]; type: 'access' | 'refresh' };

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const codeHash = (value: string) => sha256(value);
const code = () => randomInt(100000, 1000000).toString();
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const deviceFingerprint = (meta: RequestMeta) => sha256(meta.deviceId ?? `${meta.userAgent ?? 'unknown'}:${meta.ipAddress ?? 'unknown'}`);

const ttlSeconds = (ttl: string) => {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${ttl}`);
  return Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 } as const)[match[2] as 's' | 'm' | 'h' | 'd'];
};

export class AuthService {
  private readonly notifications = new NotificationsService();

  async register(input: { email: string; password: string; firstName: string; lastName: string; phone?: string }, meta: RequestMeta) {
    const email = normalizeEmail(input.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest('An account with this email already exists');
    const passwordHash = await bcrypt.hash(input.password, config.PASSWORD_HASH_ROUNDS);
    const user = await prisma.user.create({ data: { email, passwordHash, firstName: input.firstName.trim(), lastName: input.lastName.trim(), phone: input.phone, roles: [Role.PATIENT], roleAssignments: { create: { role: Role.PATIENT } }, patient: { create: {} } } });
    const verificationToken = await this.createVerificationToken(user.id);
    await this.sendVerificationEmail(user.email, verificationToken);
    await this.recordLogin(user, false, 'ACCOUNT_CREATED', meta);
    return { user: this.publicUser(user), verificationRequired: true };
  }

  async login(emailInput: string, password: string, mfaCode: string | undefined, mfaMethod: MfaMethod | undefined, meta: RequestMeta) {
    const email = normalizeEmail(emailInput);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(password, user.passwordHash))) {
      await this.recordLogin(user, false, 'INVALID_CREDENTIALS', meta, email);
      throw unauthorized('Invalid email or password');
    }
    if (!user.emailVerifiedAt) throw forbidden('Please verify your email address before signing in');
    if (user.mfaEnabled) {
      if (!mfaCode) return { mfaRequired: true, methods: await this.mfaMethods(user.id) };
      await this.verifyLoginMfa(user.id, mfaCode, mfaMethod ?? MfaMethod.EMAIL, meta);
    }
    const result = await this.issueSession(user, meta);
    await this.recordLogin(user, true, 'LOGIN_SUCCESS', meta, email, result.device.id);
    return { ...result, mfaRequired: false };
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    let claims: Claims;
    try {
      claims = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET, { issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE }) as Claims;
    } catch { throw unauthorized('Invalid or expired refresh token'); }
    if (claims.type !== 'refresh') throw unauthorized('Invalid refresh token');
    const stored = await prisma.refreshToken.findFirst({ where: { userId: claims.sub, tokenHash: sha256(refreshToken), revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: true, session: true } });
    if (!stored) throw unauthorized('Refresh token has been revoked');
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    if (stored.session) await prisma.userSession.update({ where: { id: stored.session.id }, data: { revokedAt: new Date() } });
    return this.issueSession(stored.user, meta);
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({ where: { tokenHash: sha256(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    return { loggedOut: true };
  }

  async logoutAll(userId: string) {
    const now = new Date();
    await prisma.$transaction([prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }), prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } })]);
    return { loggedOut: true };
  }

  async requestVerification(emailInput: string) {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(emailInput) } });
    if (!user || user.emailVerifiedAt) return { accepted: true };
    const token = await this.createVerificationToken(user.id);
    await this.sendVerificationEmail(user.email, token);
    return { accepted: true };
  }

  async verifyEmail(token: string) {
    const record = await prisma.emailVerificationToken.findFirst({ where: { tokenHash: sha256(token), usedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) throw badRequest('Invalid or expired verification token');
    await prisma.$transaction([prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }), prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })]);
    return { verified: true };
  }

  async requestPasswordReset(emailInput: string) {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(emailInput) } });
    if (!user) return { accepted: true };
    const token = randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + config.PASSWORD_RESET_TTL_SECONDS * 1000) } });
    await this.notifications.email(user.email, 'Reset your NeuroCare password', `Use this secure reset token: ${token}`);
    return { accepted: true, developmentToken: config.NODE_ENV === 'development' ? token : undefined };
  }

  async resetPassword(token: string, password: string) {
    const reset = await prisma.passwordResetToken.findFirst({ where: { tokenHash: sha256(token), usedAt: null, expiresAt: { gt: new Date() } } });
    if (!reset) throw badRequest('Invalid or expired password reset token');
    const passwordHash = await bcrypt.hash(password, config.PASSWORD_HASH_ROUNDS);
    const now = new Date();
    await prisma.$transaction([prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }), prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: now } }), prisma.refreshToken.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now } }), prisma.userSession.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now } }), prisma.securityAlert.create({ data: { userId: reset.userId, type: 'PASSWORD_CHANGED', title: 'Password changed', message: 'Your NeuroCare password was changed.' } })]);
    return { reset: true };
  }

  async beginTotp(userId: string) {
    const secret = authenticator.generateSecret();
    const existing = await prisma.mfaFactor.findFirst({ where: { userId, method: MfaMethod.TOTP } });
    if (existing) await prisma.mfaFactor.update({ where: { id: existing.id }, data: { secretCipher: secret, verifiedAt: null } });
    else await prisma.mfaFactor.create({ data: { userId, method: MfaMethod.TOTP, secretCipher: secret } });
    return { secret, otpauthUrl: authenticator.keyuri(userId, 'NeuroCare UK', secret) };
  }

  async confirmTotp(userId: string, otp: string) {
    const factor = await prisma.mfaFactor.findFirst({ where: { userId, method: MfaMethod.TOTP } });
    if (!factor || !authenticator.check(otp, factor.secretCipher)) throw badRequest('Invalid authenticator code');
    await prisma.$transaction([prisma.mfaFactor.update({ where: { id: factor.id }, data: { verifiedAt: new Date() } }), prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } }), prisma.securityAlert.create({ data: { userId, type: 'MFA_CHANGED', title: 'Authenticator app enabled', message: 'Authenticator app MFA was enabled on your account.' } })]);
    return { enabled: true, method: MfaMethod.TOTP };
  }

  async requestEmailMfa(userId: string, purpose: MfaChallengeType = MfaChallengeType.EMAIL_ENROLLMENT, meta: RequestMeta) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound('User not found');
    const value = code();
    await prisma.mfaChallenge.create({ data: { userId, type: purpose, codeHash: codeHash(value), expiresAt: new Date(Date.now() + config.MFA_CODE_TTL_SECONDS * 1000), ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
    await this.notifications.email(user.email, 'Your NeuroCare security code', `Your security code is ${value}. It expires in ${Math.floor(config.MFA_CODE_TTL_SECONDS / 60)} minutes.`);
    return { sent: true };
  }

  async confirmEmailMfa(userId: string, value: string, meta: RequestMeta) {
    await this.consumeEmailChallenge(userId, value, MfaChallengeType.EMAIL_ENROLLMENT, meta);
    await prisma.$transaction([prisma.mfaFactor.upsert({ where: { userId_method: { userId, method: MfaMethod.EMAIL } }, create: { userId, method: MfaMethod.EMAIL, secretCipher: 'email' , verifiedAt: new Date() }, update: { verifiedAt: new Date() } }), prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } }), prisma.securityAlert.create({ data: { userId, type: 'MFA_CHANGED', title: 'Email MFA enabled', message: 'Email MFA was enabled on your account.' } })]);
    return { enabled: true, method: MfaMethod.EMAIL };
  }

  async listSessions(userId: string) { return prisma.userSession.findMany({ where: { userId, revokedAt: null }, include: { device: true }, orderBy: { lastSeenAt: 'desc' } }); }

  async revokeSession(userId: string, sessionId: string) {
    const result = await prisma.userSession.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await prisma.refreshToken.updateMany({ where: { session: { id: sessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!result.count) throw notFound('Session not found');
    return { revoked: true };
  }

  async securityAlerts(userId: string) { return prisma.securityAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }); }
  async loginHistory(userId: string) { return prisma.loginHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }); }

  private async verifyLoginMfa(userId: string, value: string, method: MfaMethod, meta: RequestMeta) {
    if (method === MfaMethod.TOTP) {
      const factor = await prisma.mfaFactor.findFirst({ where: { userId, method, verifiedAt: { not: null } } });
      if (!factor || !authenticator.check(value, factor.secretCipher)) throw unauthorized('Invalid MFA code');
      return;
    }
    await this.consumeEmailChallenge(userId, value, MfaChallengeType.EMAIL_LOGIN, meta);
  }

  private async consumeEmailChallenge(userId: string, value: string, type: MfaChallengeType, meta: RequestMeta) {
    const challenge = await prisma.mfaChallenge.findFirst({ where: { userId, type, consumedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!challenge) throw unauthorized('Invalid or expired MFA code');
    if (challenge.attempts >= 5) throw unauthorized('Too many MFA attempts');
    if (challenge.codeHash !== codeHash(value)) {
      await prisma.mfaChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      throw unauthorized('Invalid or expired MFA code');
    }
    await prisma.mfaChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date(), ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
  }

  private async issueSession(user: User, meta: RequestMeta) {
    const fingerprintHash = deviceFingerprint(meta);
    const device = await prisma.device.upsert({ where: { userId_fingerprintHash: { userId: user.id, fingerprintHash } }, create: { userId: user.id, fingerprintHash, platform: meta.userAgent, userAgent: meta.userAgent, ipAddress: meta.ipAddress }, update: { lastSeenAt: new Date(), ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
    if (!device.trustedAt) {
      await prisma.securityAlert.create({ data: { userId: user.id, type: 'NEW_DEVICE', title: 'New device sign-in', message: 'Your NeuroCare account was accessed from a new device.', metadata: { deviceId: device.id, ipAddress: meta.ipAddress } } });
    }
    const tokenPair = this.createTokenPair(user);
    const refresh = await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: sha256(tokenPair.refreshToken), expiresAt: new Date(Date.now() + ttlSeconds(config.REFRESH_TOKEN_TTL) * 1000) } });
    const session = await prisma.userSession.create({ data: { userId: user.id, deviceId: device.id, refreshTokenId: refresh.id, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
    return { user: this.publicUser(user), tokens: tokenPair, session: { id: session.id }, device: { id: device.id, new: !device.trustedAt } };
  }

  private createTokenPair(user: TokenUser) {
    const claims = { sub: user.id, email: user.email, roles: user.roles };
    return {
      accessToken: jwt.sign({ ...claims, type: 'access' }, config.JWT_ACCESS_SECRET, { expiresIn: ttlSeconds(config.ACCESS_TOKEN_TTL), issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE }),
      refreshToken: jwt.sign({ ...claims, type: 'refresh' }, config.JWT_REFRESH_SECRET, { expiresIn: ttlSeconds(config.REFRESH_TOKEN_TTL), issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE }),
    };
  }

  private async createVerificationToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({ data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + config.EMAIL_VERIFICATION_TTL_SECONDS * 1000) } });
    return token;
  }

  private async sendVerificationEmail(email: string, token: string) {
    await this.notifications.email(email, 'Verify your NeuroCare account', `Use this secure verification token: ${token}`);
  }

  private async mfaMethods(userId: string) { const factors = await prisma.mfaFactor.findMany({ where: { userId, verifiedAt: { not: null } }, select: { method: true } }); return factors.map((factor) => factor.method); }
  private async recordLogin(user: Pick<User, 'id'> | null, success: boolean, reason: string, meta: RequestMeta, email = '', deviceId?: string) { try { await prisma.loginHistory.create({ data: { userId: user?.id, email, success, reason, ipAddress: meta.ipAddress, userAgent: meta.userAgent, deviceId } }); } catch (error) { logger.warn({ err: error }, 'Unable to write login history'); } }
  private publicUser(user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'roles' | 'mfaEnabled' | 'emailVerifiedAt'>) { return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, roles: user.roles, mfaEnabled: user.mfaEnabled, emailVerified: Boolean(user.emailVerifiedAt) }; }
}
