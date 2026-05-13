// Types pour le réseau social

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
  updated_at?: string;
  profiles: UserProfile | UserProfile[];
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: UserProfile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'message' | 'follow';
  actor_id: string;
  actor?: UserProfile;
  post_id?: string;
  comment_id?: string;
  message?: string;
  read: boolean;
  created_at: string;
}
