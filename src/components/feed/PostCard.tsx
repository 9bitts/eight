"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Globe,
  Pin,
  LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PostBody } from "@/components/feed/PostBody";
import { PostMedia, PollCard, LinkPreviewCard } from "@/components/feed/PostMedia";
import { PostMenu } from "@/components/feed/PostMenu";
import { toggleLike, toggleRepost } from "@/lib/actions";
import type { FeedPost } from "@/lib/types";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "#0c2b36";
const LINE = "#e4ebee";

function ActionBtn({
  icon: Icon,
  count,
  color,
  active,
  onClick,
  fill,
  href,
}: {
  icon: LucideIcon;
  count: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
  fill?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <span className="p-1.5 rounded-full">
        <Icon size={18} strokeWidth={2} fill={active && fill ? color : "none"} />
      </span>
      {count > 0 && <span>{count}</span>}
    </>
  );
  const style = { color: active ? color : "#6b818b", fontSize: 13.5 };

  if (href) {
    return (
      <Link href={href} className="flex items-center gap-1.5 transition-colors" style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 transition-colors" style={style}>
      {inner}
    </button>
  );
}

export function PostCard({
  post,
  showActions = true,
}: {
  post: FeedPost;
  showActions?: boolean;
}) {
  const router = useRouter();

  const onLike = async () => {
    await toggleLike(post.id);
    router.refresh();
  };

  const onRepost = async () => {
    await toggleRepost(post.id);
    router.refresh();
  };

  const onShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => alert("Link copiado!"));
  };

  const postUrl = post.threadId ? `/post/${post.threadId}` : `/post/${post.id}`;

  return (
    <article className="flex gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
      <Link href={`/${post.handle}`}>
        <Avatar name={post.name} />
      </Link>
      <div className="flex-1 min-w-0">
        {post.isPinned && (
          <div className="flex items-center gap-1 mb-1" style={{ fontSize: 12, color: "#7a8f97", fontWeight: 600 }}>
            <Pin size={12} /> Fixado
          </div>
        )}
        <div className="flex items-center gap-1 flex-wrap">
          <Link href={`/${post.handle}`} style={{ fontWeight: 700, color: INK, textDecoration: "none" }}>
            {post.name}
          </Link>
          {post.verified && <VerifiedBadge size={17} />}
          <span style={{ color: "#7a8f97", fontSize: 14 }}>
            <Link href={`/${post.handle}`} style={{ color: "#7a8f97", textDecoration: "none" }}>
              @{post.handle}
            </Link>
            {" · "}
            <Link href={postUrl} style={{ color: "#7a8f97", textDecoration: "none" }}>
              {post.time}
            </Link>
            {post.edited && <span> · editado</span>}
          </span>
          <PostMenu postId={post.id} isOwner={post.isOwner} isPinned={post.isPinned} body={post.body} />
        </div>
        <div
          className="flex items-center gap-1 mt-0.5 mb-1.5"
          style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}
        >
          <span style={{ background: "#fbe5dd", padding: "1px 8px", borderRadius: 99 }}>{post.spec}</span>
          {post.loc && (
            <span style={{ color: "#9fb0b6", display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
              <Globe size={12} /> {post.loc}
            </span>
          )}
        </div>

        <Link href={postUrl} style={{ textDecoration: "none" }}>
          <PostBody text={post.body} />
        </Link>

        <PostMedia images={post.images} videoUrl={post.videoUrl} gifUrl={post.gifUrl} />

        {post.linkPreview && !post.images.length && !post.videoUrl && (
          <LinkPreviewCard preview={post.linkPreview} />
        )}

        {post.poll && <PollCard poll={post.poll} />}

        {post.threadOrder > 0 && (
          <Link href={`/post/${post.threadId}`} style={{ fontSize: 13, color: BLUE, fontWeight: 600 }}>
            Ver fio completo →
          </Link>
        )}

        {showActions && (
          <div className="flex items-center justify-between mt-3" style={{ maxWidth: 360 }}>
            <ActionBtn icon={MessageCircle} count={post.replies} color={BLUE} href={postUrl} />
            <ActionBtn icon={Repeat2} count={post.reposts} color="#1a9c5b" active={post.reposted} onClick={onRepost} />
            <ActionBtn icon={Heart} count={post.likes} color={ORANGE} active={post.liked} fill onClick={onLike} />
            <ActionBtn icon={Share} count={0} color={BLUE} onClick={onShare} />
          </div>
        )}
      </div>
    </article>
  );
}
