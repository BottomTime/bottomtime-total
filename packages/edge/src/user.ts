import { Express } from 'express';

export interface User extends Express.User {
  email: string;
}
