import { AvatarSize, ListAvatarURLsResponseDTO } from '@bottomtime/api';

export type AvatarURLs = ListAvatarURLsResponseDTO['sizes'];

export function getAvatarURL(
  baseUrl: string | undefined,
  size: AvatarSize,
): string | undefined {
  if (!baseUrl) return undefined;

  if (/^\/api\/users\/[a-z0-9]+([_.-][a-z0-9]+)*\/avatar/i.test(baseUrl)) {
    return baseUrl.endsWith('/') ? `${baseUrl}${size}` : `${baseUrl}/${size}`;
  }

  return baseUrl;
}
