import { FEATURES } from '@/lib/tier-config';

export interface ProjectTabConfig {
  value:
    | 'summary'
    | 'moments'
    | 'youtube-timestamps'
    | 'social'
    | 'hashtags'
    | 'titles'
    | 'transcript';
  label: string;
  feature?: (typeof FEATURES)[keyof typeof FEATURES];
}

export const PROJECT_TABS: ProjectTabConfig[] = [
  { value: 'summary', label: 'Summary', feature: FEATURES.SUMMARY },
  { value: 'moments', label: 'Key Moments', feature: FEATURES.KEY_MOMENTS },
  {
    value: 'youtube-timestamps',
    label: 'YouTube Timestamps',
    feature: FEATURES.YOUTUBE_TIMESTAMPS,
  },
  { value: 'social', label: 'Social Posts', feature: FEATURES.SOCIAL_POSTS },
  { value: 'hashtags', label: 'Hashtags', feature: FEATURES.HASHTAGS },
  { value: 'titles', label: 'Titles', feature: FEATURES.TITLES },
  { value: 'transcript', label: 'Transcript' },
];
