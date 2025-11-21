
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  GENERATOR = 'GENERATOR',
  SHEET_PLANNER = 'SHEET_PLANNER',
  AUDIT = 'AUDIT',
  SETTINGS = 'SETTINGS'
}

// Cấu hình cho từng kênh riêng biệt
export interface ChannelProfile {
  id: string;
  name: string;
  description?: string;
  avatarColor?: string;
  
  // Security: Các trường này nên được mã hóa khi lưu xuống storage
  youtubeApiKey: string;
  youtubeClientId: string;
  youtubeClientSecret: string;
  channelId: string;
  sheetId: string;
  geminiApiKey: string;
  
  // Settings riêng cho kênh
  autoUploadDelay: number; // Giây
  defaultTone: string;
  
  // Encryption flag
  isEncrypted?: boolean;
}

export interface SystemState {
  profiles: ChannelProfile[];
  activeProfileId: string | null;
  isEncrypted: boolean; // Cờ đánh dấu dữ liệu đã được bảo vệ chưa
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
}

export interface GeneratedContent {
  title: string;
  description: string;
  tags: string[];
  scriptOutline: string[];
  hook: string;
  seoScore?: number;
}

// Interface mới cho kịch bản đã lưu
export interface SavedScript {
  id: string;
  profileId: string;
  type: 'LONG' | 'SHORT';
  topic: string;
  title: string;
  description: string;
  content: string; // Gộp scriptOutline thành text để dễ edit
  thumbnailPrompt?: string; // NEW: Lưu gợi ý prompt tạo ảnh
  socialPosts?: { // NEW: Lưu bài đăng MXH
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  tags: string[];
  createdAt: string;
  lastModified: string;
}

// NEW: Interface cho Video Viral tìm được
export interface ViralVideo {
  title: string;
  url: string;
  views?: string;
  reason?: string; // Tại sao nó viral
}

export type RowStatus = 'PENDING' | 'PROCESSING' | 'OPTIMIZED' | 'SCRIPT_READY' | 'UPLOADING' | 'PUBLISHED' | 'ERROR';

export interface SheetRow {
  id: string;
  topic: string;
  status: RowStatus;
  optimizedTitle?: string;
  optimizedDesc?: string;
  keywords?: string;
  videoId?: string;
  publishDate?: string;
  logs?: string;
  seoScore?: number;
  linkedScriptId?: string; // ID của script trong thư viện
}

export interface AuditResult {
  score: number;
  analysis: string;
  actionItems: string[];
  strengths: string[];
  weaknesses: string[];
  competitorAnalysis?: string;
}

// Default profile template
export const NEW_PROFILE_TEMPLATE: ChannelProfile = {
  id: '',
  name: 'New Channel',
  youtubeApiKey: '',
  youtubeClientId: '',
  youtubeClientSecret: '',
  channelId: '',
  sheetId: '',
  geminiApiKey: '',
  autoUploadDelay: 10,
  defaultTone: 'Hài hước & Năng động',
  isEncrypted: false
};
