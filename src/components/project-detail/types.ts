export interface ProjectSummary {
  full: string;
  bullets: string[];
  insights: string[];
  tldr: string;
}

export interface ProjectKeyMoment {
  time: string;
  timestamp: number;
  text: string;
  description: string;
}

export interface ProjectSocialPosts {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
}

export interface ProjectTitles {
  youtubeShort: string[];
  youtubeLong: string[];
  podcastTitles: string[];
  seoKeywords: string[];
}

export interface ProjectYouTubeTimestamp {
  timestamp: string;
  description: string;
}

export interface ProjectTranscript {
  text: string;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export interface ProjectDetailData {
  _id: string;
  userId: string;
  fileName: string;
  displayName: string;
  fileDuration?: number;
  createdAt: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  jobStatus?: {
    transcription?:
      | 'pending'
      | 'uploading'
      | 'processing'
      | 'completed'
      | 'failed';
    contentGeneration?: 'pending' | 'running' | 'completed' | 'failed';
  };
  jobErrors?: {
    keyMoments?: string;
    summary?: string;
    socialPosts?: string;
    titles?: string;
    hashtags?: string;
    youtubeTimestamps?: string;
    transcript?: string;
    general?: string;
  };
  error?: {
    message: string;
    step: string;
  };
  summary?: ProjectSummary;
  keyMoments?: ProjectKeyMoment[];
  socialPosts?: ProjectSocialPosts;
  hashtags?: string[];
  titles?: ProjectTitles;
  youtubeTimestamps?: ProjectYouTubeTimestamp[];
  transcript?: ProjectTranscript;
}

