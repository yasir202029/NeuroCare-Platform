import type { Role } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  roles: Role[];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}
