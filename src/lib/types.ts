export type FeedPost = {
  id: string;
  authorId: string;
  name: string;
  handle: string;
  spec: string;
  loc: string;
  time: string;
  liked: boolean;
  reposted: boolean;
  likes: number;
  reposts: number;
  replies: number;
  body: string;
  verified: boolean;
};

export type Suggestion = {
  id: string;
  name: string;
  handle: string;
  spec: string;
  verified: boolean;
  following: boolean;
};

export type SessionUser = {
  profileId: string;
  displayName: string;
  handle: string;
  verified: boolean;
};
