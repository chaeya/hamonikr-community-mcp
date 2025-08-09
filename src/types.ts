export interface HamoniKRConfig {
  baseUrl: string;
  loginUrl: string;
  boards: {
    notice: string;
    qna: string;
    project: string;
  };
  credentials: {
    username: string;
    password: string;
  };
}

export interface BrowserConfig {
  headless: boolean;
  timeout: number;
  viewport: {
    width: number;
    height: number;
  };
}

export interface Config {
  hamonikr: HamoniKRConfig;
  browser: BrowserConfig;
}

export interface LoginResult {
  success: boolean;
  message: string;
  sessionActive?: boolean;
}

export interface PostData {
  title: string;
  content: string;
  board: 'notice' | 'qna' | 'project';
}

export interface PostResult {
  success: boolean;
  message: string;
  postUrl?: string;
  postId?: string;
}

export interface CommentData {
  postUrl: string;
  content: string;
}

export interface CommentResult {
  success: boolean;
  message: string;
  commentId?: string;
}

export interface EditData {
  postUrl: string;
  title?: string;
  content?: string;
}

export interface DeleteResult {
  success: boolean;
  message: string;
}

export interface HamoniKRSession {
  isLoggedIn: boolean;
  username?: string;
  lastLoginTime?: Date;
}

export interface PostContent {
  title: string;
  content: string;
  author: string;
  date: string;
  views: number;
  comments: number;
  url: string;
}

export interface GetPostResult {
  success: boolean;
  message: string;
  post?: PostContent;
}