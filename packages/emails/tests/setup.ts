/* eslint-disable no-console, no-process-env */
import { mkdir } from 'fs/promises';
import { resolve } from 'path';

export default async function (): Promise<void> {
  // Create a directory for logs
  await mkdir(resolve(__dirname, '../logs'), { recursive: true });
}
