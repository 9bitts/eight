"use client";

import type { ViewTimelinePoint } from "@/lib/post-analytics";

const BLUE = "#176a88";
const ORANGE = "#e05930";
const MUTED = "var(--eight-muted)";
const LINE = "var(--eight-line)";

export function ViewTimelineChart({ points }: { points: ViewTimelinePoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.profileViews + p.postViews));
  const barMaxH = 96;

  return (
    <div className="px-4 py-4 border-b" style={{ borderColor: LINE }}>
      <div className="flex items-center gap-4 mb-3" style={{ fontSize: 12, color: MUTED }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: BLUE, display: "inline-block" }} />
          Perfil
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, borderRadius: 2, background: ORANGE, display: "inline-block" }} />
          Publicações
        </span>
      </div>

      <div className="flex items-end gap-1" style={{ height: barMaxH + 24 }}>
        {points.map((p) => {
          const total = p.profileViews + p.postViews;
          const postH = (p.postViews / max) * barMaxH;
          const profileH = (p.profileViews / max) * barMaxH;
          return (
            <div
              key={p.date}
              className="flex-1 flex flex-col items-center justify-end min-w-0"
              style={{ height: barMaxH + 24 }}
              title={`${p.label}: ${p.profileViews} perfil, ${p.postViews} posts`}
            >
              <div
                className="w-full flex flex-col justify-end gap-0.5"
                style={{ height: barMaxH }}
              >
                {postH > 0 && (
                  <div
                    style={{
                      height: postH,
                      background: ORANGE,
                      borderRadius: "3px 3px 0 0",
                      minHeight: postH > 0 ? 2 : 0,
                    }}
                  />
                )}
                {profileH > 0 && (
                  <div
                    style={{
                      height: profileH,
                      background: BLUE,
                      borderRadius: postH > 0 ? 0 : "3px 3px 0 0",
                      minHeight: profileH > 0 ? 2 : 0,
                    }}
                  />
                )}
                {total === 0 && (
                  <div style={{ height: 2, background: "var(--eight-line)", borderRadius: 2 }} />
                )}
              </div>
              <span
                className="truncate w-full text-center mt-1"
                style={{ fontSize: 9, color: MUTED }}
              >
                {p.label.replace(".", "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
