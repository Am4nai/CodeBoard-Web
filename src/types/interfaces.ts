export interface PostCardProps {
  id: number;
  title: string;
  description?: string;
  code: string;
  language?: string;
  authorName: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  views?: number;
  editable?: boolean;
  fetchCollectionData?: () => void;

  mode?: "add" | "remove";
  collectionId?: number;
}

export interface UserProfile {
  avatar_url: string | null;
  description: string | null;
  about: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  profile: UserProfile | null;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  created_at: string;
  updated_at: string | null;
  parent_id: number | null;
  username: string;
  author_avatar_url?: string | null;
  replies: Comment[];
}

export interface CommentThreadProps {
  comment: Comment;
  level?: number;
  post_id?: number;
  focusedCommentId: number | null;
  setFocusedCommentId: React.Dispatch<React.SetStateAction<number | null>>;
  refreshComments: () => Promise<void>;
}

export interface Collection {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface AddToCollectionDropdownProps {
  postId: number;
  collections: Collection[];
  onAdded?: (collectionId: number) => void;
  onClose: () => void;
}

export type CollectionWithPostsResponse = Collection & {
  posts: Array<{
    id: number;
    author_id: number;
    author_name: string;
    author_avatar_url: string | null;
    title: string;
    description: string | null;
    about: string | null;
    code: string;
    language_id: number;
    language_name: string;
    like_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    comment_count: number;
  }>;
};

export type Language = {
  id: number;
  name: string;
};

export type Tag = {
  id: number;
  name: string;
  posts_count: number;
};

export type PostByIdResponse = {
  id: number;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  title: string;
  description: string | null;
  about: string | null;
  code: string;
  language_id: number;
  language_name: string;
  like_count: number;
  views_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  tags: string[];
};

export type PostsResponse = {
  page: number;
  limit: number;
  totalPosts: number;
  totalPages: number;
  remainingPosts: number;
  posts: Array<{
    id: number;
    author_id: number;
    author_name: string;
    author_avatar_url: string | null;
    title: string;
    description: string | null;
    about: string | null;
    code: string;
    language_id: number;
    language_name: string;
    like_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    comment_count: number;
  }>;
};

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  profile: {
    avatar_url: string | null;
    description: string | null;
    about: string | null;
  } | null;
};

export type UserPostsResponse = {
  userId: string;
  total: number;
  posts: Array<{
    id: number;
    author_id: number;
    author_name: string;
    author_avatar_url: string | null;
    title: string;
    description: string | null;
    about: string | null;
    code: string;
    language_id: number;
    language_name: string;
    like_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    comment_count: number;
  }>;
};

export type SearchPostsResponse = {
  posts: Array<{
    id: number;
    author_id: number;
    author_name: string;
    author_avatar_url: string | null;
    title: string;
    description: string | null;
    about: string | null;
    code: string;
    language_id: number;
    language_name: string;
    like_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    comment_count: number;
  }>;
};

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  avatar_url: string | null;
  description: string | null;
  about: string | null;
}