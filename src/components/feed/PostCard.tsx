"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Globe,
  Pin,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PostBody } from "@/components/feed/PostBody";
import { PostMedia, PollCard, LinkPreviewCard } from "@/components/feed/PostMedia";
import { PostMenu } from "@/components/feed/PostMenu";
import { SharePostButton } from "@/components/feed/SharePostButton";
import { QuoteRepostButton } from "@/components/feed/QuoteRepostButton";
import { QuotedPostCard } from "@/components/feed/QuotedPostCard";
import { toggleLike, toggleRepost } from "@/lib/actions";
import type { FeedPost } from "@/lib/types";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const INK = "var(--eight-ink)";
const LINE = "var(--eight-line)";
const MUTED = "var(--eight-muted)";

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
  const style = { color: active ? color : MUTED, fontSize: 13.5 };

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

  const postUrl = post.threadId ? `/post/${post.threadId}` : `/post/${post.id}`;

  return (
    <article className="flex gap-3 px-4 py-4 border-b" style={{ borderColor: LINE }}>
      <Link href={`/${post.handle}`}>
        <Avatar name={post.name} />
      </Link>
      <div className="flex-1 min-w-0">
        {post.isPinned && (
          <div className="flex items-center gap-1 mb-1" style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
            <Pin size={12} /> Fixado
          </div>
        )}
        {post.isClinicalCase && (
          <div
            className="flex items-center gap-1 mb-1"
            style={{ fontSize: 12, color: ORANGE, fontWeight: 700 }}
          >
            <Sparkles size={12} /> Caso clínico
            {post.caseSpecialty && (
              <span style={{ color: MUTED, fontWeight: 500 }}>· {post.caseSpecialty}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 flex-wrap">
          <Link href={`/${post.handle}`} style={{ fontWeight: 700, color: INK, textDecoration: "none" }}>
            {post.name}
          </Link>
          {post.verified && <VerifiedBadge size={17} />}
          <span style={{ color: MUTED, fontSize: 14 }}>
            <Link href={`/${post.handle}`} style={{ color: MUTED, textDecoration: "none" }}>
              @{post.handle}
            </Link>
            {" · "}
            <Link href={postUrl} style={{ color: MUTED, textDecoration: "none" }}>
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

        {post.isClinicalCase && post.caseTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.caseTags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "#fdeee8",
                  color: ORANGE,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link href={postUrl} style={{ textDecoration: "none", color: "var(--eight-body-text)" }}>
          <PostBody text={post.body} />
        </Link>

        {post.quotedPost && <QuotedPostCard quoted={post.quotedPost} />}

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
          <div className="flex items-center justify-between mt-3" style={{ maxWidth: 400 }}>
            <ActionBtn icon={MessageCircle} count={post.replies} color={BLUE} href={postUrl} />
            <ActionBtn icon={Repeat2} count={post.reposts} color="#1a9c5b" active={post.reposted} onClick={onRepost} />
            <QuoteRepostButton postId={post.id} />
            <ActionBtn icon={Heart} count={post.likes} color={ORANGE} active={post.liked} fill onClick={onLike} />
            <SharePostButton postId={post.id} />
          </div>
        )}
      </div>
    </article>
  );
}
