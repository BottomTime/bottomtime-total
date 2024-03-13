/* eslint-disable no-process-env, no-console */
import { UserEntity } from '@/data';

import { getDataSource } from 'admin/database/data-source';
import jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';

export async function getUserToken(postgresUri: string, username: string) {
  let ds: DataSource | undefined;

  try {
    ds = await getDataSource(postgresUri);

    const lowered = username.trim().toLowerCase();
    const users = ds.getRepository(UserEntity);

    const user = await users.findOne({
      where: [{ usernameLowered: lowered }, { emailLowered: lowered }],
      select: ['id'],
    });

    if (user) {
      const token = await new Promise<string>((resolve, reject) => {
        jwt.sign(
          {
            iss: process.env.BT_BASE_URL,
            iat: Date.now(),
            exp: Date.now() + 20 * 60 * 1000,
            sub: `user|${user.id}`,
          },
          process.env.BT_SESSION_SECRET ?? '',
          {},
          (error, token) => {
            if (error) reject(error);
            else resolve(token!);
          },
        );
      });
      console.log(token);
    } else {
      console.error(`User not found: "${username}"`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error getting user token:', error);
    process.exitCode = 1;
  } finally {
    if (ds) await ds.destroy();
  }
}
