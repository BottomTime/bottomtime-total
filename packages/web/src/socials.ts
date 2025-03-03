import Mustache from 'mustache';

export enum SocialMediaNetwork {
  Bluesky = 'bluesky',
  Facebook = 'facebook',
  Instagram = 'instagram',
  TikTok = 'tiktok',
  Twitter = 'twitter',
  YouTube = 'youtube',
}

const MustacheUrls: Record<SocialMediaNetwork, string> = {
  [SocialMediaNetwork.Bluesky]: 'https://bsky.app/profile/{{username}}',
  [SocialMediaNetwork.Facebook]: 'https://www.facebook.com/{{username}}',
  [SocialMediaNetwork.Instagram]: 'https://www.instagram.com/{{username}}/',
  [SocialMediaNetwork.TikTok]: 'https://www.tiktok.com/@{{username}}',
  [SocialMediaNetwork.Twitter]: 'https://x.com/{{username}}',
  [SocialMediaNetwork.YouTube]: 'https://www.youtube.com/@{{username}}',
};

export function getSocialMediaProfileUrl(
  network: SocialMediaNetwork,
  username: string,
): string {
  return Mustache.render(MustacheUrls[network], { username });
}
