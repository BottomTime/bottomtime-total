import {
  PasswordStrengthSchema,
  ProfileVisibility,
  UserRole,
  UsernameSchema,
} from '@bottomtime/api';

import { hash } from 'bcrypt';
import prompts from 'prompts';
import { UserEntity } from 'src/data';
import { DataSource } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

import { getDataSource } from '../database/data-source';

/* eslint-disable no-console */
export type CreateAdminOptions = {
  potgresUri: string;
  username?: string;
  password?: string;
  email?: string;
};

async function completeOptions(
  options: CreateAdminOptions,
): Promise<Required<CreateAdminOptions>> {
  let username: string;
  let password: string;
  let email: string;

  if (!options.username) {
    const response = await prompts(
      {
        type: 'text',
        name: 'username',
        message: 'Enter a username for the new admin account:',
        validate: (username) => {
          const valid = UsernameSchema.safeParse(username);
          if (valid.success) return true;
          else
            return 'Username must be between 3 and 50 characters and be alphanumeric with dashes, dots, or underscores.';
        },
      },
      { onCancel: () => process.exit(1) },
    );
    username = response.username;
  } else {
    username = options.username;
  }

  if (!options.password) {
    const response = await prompts(
      {
        type: 'password',
        name: 'password',
        message: 'Enter a password for the new admin account:',
        validate: (password) => {
          const valid = PasswordStrengthSchema.safeParse(password);
          if (valid.success) return true;
          else
            return 'Password must be between 8 and 50 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.';
        },
      },
      { onCancel: () => process.exit(1) },
    );
    password = response.password;
  } else {
    password = options.password;
  }

  if (!options.email) {
    const response = await prompts(
      {
        type: 'text',
        name: 'email',
        message: 'Enter an email address for the new admin account:',
        validate: (email) => {
          const valid = z.string().email().safeParse(email);
          if (valid.success) return true;
          else return 'Invalid email address';
        },
      },
      { onCancel: () => process.exit(1) },
    );
    email = response.email;
  } else {
    email = options.email;
  }

  return {
    username,
    password,
    email,
    potgresUri: options.potgresUri,
  };
}

export async function createAdmin(options: CreateAdminOptions): Promise<void> {
  const completedOptions = await completeOptions(options);
  let dataSource: DataSource | undefined;

  try {
    console.log('Connecting to database...');
    dataSource = await getDataSource(options.potgresUri);

    console.log('Creating admin account...');
    const admin = new UserEntity();
    admin.email = completedOptions.email;
    admin.emailLowered = admin.email.toLowerCase();
    admin.emailVerified = true;
    admin.id = uuid();
    admin.name = 'Administrator';
    admin.passwordHash = await hash(completedOptions.password, 16);
    admin.profileVisibility = ProfileVisibility.Private;
    admin.role = UserRole.Admin;
    admin.username = completedOptions.username;
    admin.usernameLowered = admin.username.toLowerCase();

    const Users = dataSource.getRepository(UserEntity);
    await Users.save(admin);

    console.log('Admin account has been saved.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    if (dataSource) await dataSource.destroy();
  }
}
