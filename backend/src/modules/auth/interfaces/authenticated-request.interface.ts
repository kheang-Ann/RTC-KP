import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
