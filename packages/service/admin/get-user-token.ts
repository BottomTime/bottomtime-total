/* eslint-disable no-process-env, no-console */
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

export async function getUserToken(mongoUri: string, username: string) {
  const lowered = username.trim().toLowerCase();
  const mongoClient = await MongoClient.connect(mongoUri);
  const users = mongoClient.db().collection('Users');
  const user = await users.findOne({
    $or: [{ usernameLowered: lowered }, { emailLowered: lowered }],
  });

  if (user) {
    const token = await new Promise<string>((resolve, reject) => {
      jwt.sign(
        {
          iss: process.env.BT_BASE_URL,
          iat: Date.now(),
          exp: Date.now() + 20 * 60 * 1000,
          sub: `user|${user._id}`,
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
    throw new Error(`User not found: "${username}"`);
  }
}
