export type PollData = {
  id: string;
  endsAt: string;
  ended: boolean;
  options: {
    id: string;
    text: string;
    votes: number;
    percent: number;
    voted: boolean;
  }[];
  totalVotes: number;
  userVoted: boolean;
};

export type LinkPreviewData = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
};

export type FeedPost = {
  id: string;
  authorId: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  spec: string;
  loc: string;
  time: string;
  liked: boolean;
  reposted: boolean;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  body: string;
  verified: boolean;
  images: string[];
  videoUrl: string | null;
  gifUrl: string | null;
  edited: boolean;
  editCount: number;
  scheduled: boolean;
  scheduledAt: string | null;
  isPinned: boolean;
  threadId: string | null;
  threadOrder: number;
  linkPreview: LinkPreviewData | null;
  poll: PollData | null;
  isOwner: boolean;
  saved: boolean;
  isClinicalCase: boolean;
  caseTags: string[];
  caseSpecialty: string | null;
  quotedPost: {
    id: string;
    name: string;
    handle: string;
    body: string;
    verified: boolean;
    images: string[];
    videoUrl: string | null;
  } | null;
  repostedBy: {
    name: string;
    handle: string;
    avatarUrl: string | null;
    time: string;
  } | null;
  createdAt: string;
};

export type FeedTab = "forYou" | "following";

export type Suggestion = {
  id: string;
  name: string;
  handle: string;
  spec: string;
  verified: boolean;
  following: boolean;
};

export type ConnectionProfile = {
  id: string;
  displayName: string;
  handle: string;
  spec: string;
  verified: boolean;
  following: boolean;
  followsYou: boolean;
};

export type Trend = {
  tag: string;
  count: number;
};

export type SessionUser = {
  profileId: string;
  displayName: string;
  handle: string;
  verified: boolean;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isAdmin: boolean;
};

export type CreatePostInput = {
  body: string;
  images?: string[];
  videoUrl?: string;
  gifUrl?: string;
  scheduledAt?: string;
  threadParts?: string[];
  pollOptions?: string[];
  pollEndsInHours?: number;
  parentId?: string;
};
