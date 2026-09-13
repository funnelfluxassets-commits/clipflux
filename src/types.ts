export type SupportedPlatform =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'pinterest'
  | 'facebook'
  | 'reddit'
  | 'unknown';

export type AspectRatioType = '9:16' | '16:9' | '1:1' | 'unknown';
export type FreshnessType = 'all' | 'week' | 'month' | 'year';

export interface DownloadOption {
  id: string;
  label: string;
  quality: string;
  description: string;
  badge: string;
  type: 'video' | 'audio' | 'thumbnail';
  url: string;
  directUrl?: string;
  extension: 'mp4' | 'mp3' | 'jpg' | 'png' | 'webm';
  fileSize?: string;
  width?: number;
  height?: number;
  isOriginal?: boolean;
}

export interface MediaResult {
  id: string;
  platform: SupportedPlatform;
  originalUrl: string;
  title: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  coverUrl: string;
  videoUrl?: string;
  duration?: number;
  durationFormatted?: string;
  aspect_ratio: AspectRatioType;
  width?: number;
  height?: number;
  downloads: DownloadOption[];
}

export interface ScrapedClip {
  id: string;
  topic: string;
  platform: SupportedPlatform;
  title: string;
  author: string;
  url: string;
  video_url: string;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
  aspect_ratio: AspectRatioType;
  is_clean: boolean;
  clean_score: number;
  clean_reason: string;
}

export interface ScrapeJobResponse {
  topic: string;
  target_ratio: string;
  count: number;
  scraped_at: number;
  videos: ScrapedClip[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  credits: number;
  tier: 'free' | 'pro' | 'suite';
}
