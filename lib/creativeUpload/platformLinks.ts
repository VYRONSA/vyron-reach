export const PLATFORM_LAUNCH_URLS = {
  Facebook: 'https://www.facebook.com/adsmanager/',
  Instagram: 'https://www.facebook.com/adsmanager/',
  LinkedIn: 'https://www.linkedin.com/campaignmanager/',
  WhatsApp: 'https://business.facebook.com/',
  'Google Ads': 'https://ads.google.com/',
  'Google Display': 'https://ads.google.com/',
} as const

export function getPlatformLaunchUrl(platform: string): string {
  return (
    PLATFORM_LAUNCH_URLS[platform as keyof typeof PLATFORM_LAUNCH_URLS] ??
    'https://ads.google.com/'
  )
}
