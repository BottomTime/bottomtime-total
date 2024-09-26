import { Express } from 'express';

export interface User extends Express.User {
  authorizedDomains: string[];
  email: string;
}
