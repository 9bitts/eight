"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Globe,
  Pin,
  Sparkles,
  Bookmark,
  Eye,
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
import { PostImpression } from "@/components/feed/PostImpression";
import { EditHistoryDialog } from "@/components/feed/EditHistoryDialog";
import { UndoToast } from "@/components/feed/UndoToast";
import { toggleLike, toggleRepost } from "@/lib/actions";
import { toggleBookmark } from "@/lib/actions/bookmarks";
import { POST_EDIT_WINDOW_MS } from "@/lib/constants";
import { formatCount } from "@/lib/feed";
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
  countHref,
  label,
}: {
  icon: LucideIcon;
  count: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
  fill?: boolean;
  href?: string;
  countHref?: string;
  label: string;
}) {
  const inner = (
    <>
      <span className="p-1.5 rounded-full">
        <Icon size={18} strokeWidth={2} fill={active && fill ? color : "none"} />
      </span>
      {count > 0 &&
        (countHref ? (
          <Link href={countHref} style={{ textDecoration: "none", color: "inherit" }}>
            {count}
          </Link>
        ) : (
          <span>{count}</span>
        ))}
    </>
  );
  const style = { color: active ? color : MUTED, fontSize: 13.5 };

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-1.5 transition-colors"
        style={style}
        aria-label={count > 0 ? `${label}, ${count}` : label}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 transition-colors"
      style={style}
      aria-label={count > 0 ? `${label}, ${count}` : label}
      aria-pressed={active}
    >
      {inner}
    </button>
  );
}

export function PostCard({
  post,
  showActions = true,
  trackImpression = false,
}: {
  post: FeedPost;
  showActions?: boolean;
  trackImpression?: boolean;
}) {
  const router = useRouter();
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [viewCount, setViewCount] = useState(post.views);
  const [reposted, setReposted] = useState(post.reposted);
  const [repostCount, setRepostCount] = useState(post.reposts);
  const [repostUndo, setRepostUndo] = useState(false);

  useEffect(() => {
    setReposted(post.reposted);
    setRepostCount(post.reposts);
  }, [post.reposted, post.reposts]);

  const onRepost = async () => {
    const wasReposted = reposted;
    if (!wasReposted) {
      setReposted(true);
      setRepostCount((c) => c + 1);
      setRepostUndo(true);
      await toggleRepost(post.id);
    } else {
      setReposted(false);
      setRepostCount((c) => Math.max(0, c - 1));
      await toggleRepost(post.id);
      router.refresh();
    }
  };

  const undoRepost = async () => {
    setRepostUndo(false);
    setReposted(false);
    setRepostCount((c) => Math.max(0, c - 1));
    await toggleRepost(post.id);
  };

  const onLike = async () => {
    await toggleLike(post.id);
    router.refresh();
  };

  const onBookmark = async () => {
    await toggleBookmark(post.id);
    router.refresh();
  };

  const postUrl = post.threadId ? `/post/${post.threadId}` : `/post/${post.id}`;
  const canEdit =
    post.isOwner &&
    Date.now() - new Date(post.createdAt).getTime() < POST_EDIT_WINDOW_MS;

  return (
    <article className="px-4 py-4 border-b relative" style={{ borderColor: LINE }}>
      {trackImpression && (
        <PostImpression
          postId={post.id}
          onRecorded={() => setViewCount((v) => v + 1)}
        />
      )}
      {showEditHistory && (
        <EditHistoryDialog
          postId={post.id}
          currentBody={post.body}
          onClose={() => setShowEditHistory(false)}
        />
      )}
      {repostUndo && (
        <UndoToast
          message="Repostado"
          onUndo={undoRepost}
          onDismiss={() => setRepostUndo(false)}
        />
      )}
      {post.repostedBy && (
        <div
          className="flex items-center gap-1.5 mb-1"
          style={{ fontSize: 13, color: MUTED, fontWeight: 600, paddingLeft: 52 }}
        >
          <Repeat2 size={14} />
          <Link href={`/${post.repostedBy.handle}`} style={{ color: MUTED, textDecoration: "none" }}>
            {post.repostedBy.name} repostou
          </Link>
          <span>· {post.repostedBy.time}</span>
        </div>
      )}
      <div className="flex gap-3">
        <Link href={`/${post.handle}`}>
          <Avatar name={post.name} imageUrl={post.avatarUrl} />
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
            {post.edited && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => setShowEditHistory(true)}
                  style={{
                    color: MUTED,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: "inherit",
                  }}
                >
                  editado{post.editCount > 0 ? ` (${post.editCount})` : ""}
                </button>
              </>
            )}
          </span>
          <PostMenu
            postId={post.id}
            authorProfileId={post.authorId}
            isOwner={post.isOwner}
            isPinned={post.isPinned}
            body={post.body}
            canEdit={canEdit}
          />
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
          <div className="flex items-center justify-between mt-3" style={{ maxWidth: 440 }}>
            <ActionBtn icon={MessageCircle} count={post.replies} color={BLUE} href={postUrl} label="Responder" />
            <ActionBtn
              icon={Repeat2}
              count={repostCount}
              color="#1a9c5b"
              active={reposted}
              onClick={onRepost}
              countHref={repostCount > 0 ? `/post/${post.id}/reposts` : undefined}
              label={reposted ? "Desfazer repost" : "Repostar"}
            />
            <QuoteRepostButton postId={post.id} />
            <ActionBtn
              icon={Heart}
              count={post.likes}
              color={ORANGE}
              active={post.liked}
              fill
              onClick={onLike}
              countHref={post.likes > 0 ? `/post/${post.id}/curtidas` : undefined}
              label={post.liked ? "Descurtir" : "Curtir"}
            />
            <button
              type="button"
              onClick={onBookmark}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: post.saved ? BLUE : MUTED, background: "transparent", border: "none", cursor: "pointer" }}
              aria-label={post.saved ? "Remover dos salvos" : "Salvar"}
            >
              <Bookmark size={18} strokeWidth={2} fill={post.saved ? BLUE : "none"} />
            </button>
            <SharePostButton postId={post.id} />
            <span
              className="flex items-center gap-1"
              style={{ color: MUTED, fontSize: 13.5 }}
              title="Visualizações"
            >
              <Eye size={18} strokeWidth={2} />
              {formatCount(viewCount)}
            </span>
          </div>
        )}
        </div>
      </div>
    </article>
  );
}
