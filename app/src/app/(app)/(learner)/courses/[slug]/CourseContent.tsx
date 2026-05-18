"use client";
import { useEffect, useRef, useState } from "react";
import { Button, ProgressBar } from "@/components/ui";
import { CheckCircle2, Maximize2, Download } from "lucide-react";
import type { CourseKind } from "@prisma/client";
import { normalizeEmbed, officeViewerUrl } from "@/lib/course-content";

type Props = {
  courseId: string;
  slug: string;
  kind: CourseKind;
  contentUrl: string | null;
  embedUrl: string | null;
  contentMd: string | null;
  initialPercent: number;
  completed: boolean;
};

/**
 * Multi-format course player. The progress contract:
 *   • HTML / MARKDOWN — scroll-based progress (legacy behaviour).
 *   • PDF             — page-based progress via the embedded toolbar
 *                       isn't observable cross-origin; we cap at the user's
 *                       manual "Mark complete" action.
 *   • VIDEO_FILE      — uses the <video> element's `timeupdate` event.
 *   • VIDEO_EMBED     — relies on user pressing "Mark complete".
 *   • PPTX / PPT / SLIDES_GOOGLE — relies on user pressing "Mark complete".
 *
 * In every mode we render a slim utility bar (Progress · Fullscreen · Mark
 * complete) above the content area, so the learner UI is consistent.
 */
export default function CourseContent({
  courseId,
  slug,
  kind,
  contentUrl,
  embedUrl,
  contentMd,
  initialPercent,
  completed,
}: Props) {
  const [percent, setPercent] = useState(initialPercent);
  const [done, setDone] = useState(completed);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSent = useRef<number>(initialPercent);

  // Track scroll for HTML kind (and post-message courses).
  useEffect(() => {
    if (kind !== "HTML") return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "lms:progress" && typeof e.data.percent === "number") {
        const p = Math.min(99, Math.max(0, Math.round(e.data.percent)));
        setPercent((cur) => Math.max(cur, p));
      }
    };
    window.addEventListener("message", onMsg);
    const id = setInterval(() => {
      try {
        const iframe = iframeRef.current;
        const win = iframe?.contentWindow;
        const doc = iframe?.contentDocument;
        if (!win || !doc) return;
        const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
        const docH = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        const viewH = win.innerHeight || 0;
        const scrollHeight = docH - viewH;
        if (scrollHeight > viewH * 0.3) {
          const p = Math.min(99, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
          setPercent((cur) => Math.max(cur, p));
        }
      } catch {
        /* cross-origin */
      }
    }, 2000);
    return () => {
      clearInterval(id);
      window.removeEventListener("message", onMsg);
    };
  }, [kind]);

  // Track video time for VIDEO_FILE.
  useEffect(() => {
    if (kind !== "VIDEO_FILE") return;
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (!v.duration || isNaN(v.duration)) return;
      const p = Math.min(99, Math.round((v.currentTime / v.duration) * 100));
      setPercent((cur) => Math.max(cur, p));
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [kind]);

  // Debounce-save bookmark progress.
  useEffect(() => {
    if (done) return;
    if (percent === lastSent.current) return;
    const t = setTimeout(async () => {
      lastSent.current = percent;
      setSaving(true);
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, percent }),
      }).catch(() => {});
      setSaving(false);
      setSavedAt(new Date());
    }, 1500);
    return () => clearTimeout(t);
  }, [percent, courseId, done]);

  async function markComplete() {
    setSaving(true);
    const r = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, percent: 100, complete: true }),
    });
    setSaving(false);
    if (r.ok) {
      setPercent(100);
      setDone(true);
      setSavedAt(new Date());
    }
  }

  function openFullscreen() {
    const el =
      kind === "VIDEO_FILE" ? videoRef.current : iframeRef.current;
    el?.requestFullscreen?.();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
        <div className="min-w-[140px] flex-1">
          <ProgressBar value={percent} />
          <div className="mt-1 flex items-baseline justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>
              {saving
                ? "Saving…"
                : savedAt
                  ? `Saved ${savedAt.toLocaleTimeString()}`
                  : kind === "VIDEO_FILE"
                    ? "Tracks playback automatically"
                    : kind === "HTML"
                      ? "Auto-saves as you scroll"
                      : "Press Mark complete when finished"}
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contentUrl && (kind === "PDF" || kind === "PPTX" || kind === "PPT") && (
            <a
              href={contentUrl}
              download
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--muted)]"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          )}
          <Button variant="outline" size="sm" onClick={openFullscreen} title="Fullscreen course">
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </Button>
          <Button onClick={markComplete} disabled={done} size="sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {done ? "Completed" : "Mark complete"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]">
        {renderBody({ kind, slug, contentUrl, embedUrl, contentMd, iframeRef, videoRef })}
      </div>
    </div>
  );
}

function renderBody({
  kind,
  slug,
  contentUrl,
  embedUrl,
  contentMd,
  iframeRef,
  videoRef,
}: {
  kind: CourseKind;
  slug: string;
  contentUrl: string | null;
  embedUrl: string | null;
  contentMd: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const className =
    "block h-[calc(100vh-10rem)] min-h-[640px] w-full border-0 bg-white";

  if (kind === "HTML") {
    return (
      <iframe
        ref={iframeRef}
        src={`/courses-html/${slug}`}
        title="Course content"
        className={className}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        allow="fullscreen"
      />
    );
  }
  if (kind === "VIDEO_FILE" && contentUrl) {
    return (
      <video
        ref={videoRef}
        src={contentUrl}
        controls
        controlsList="nodownload"
        playsInline
        className={className}
      />
    );
  }
  if (kind === "VIDEO_EMBED" && embedUrl) {
    return (
      <iframe
        ref={iframeRef}
        src={normalizeEmbed(embedUrl)}
        title="Course video"
        className={className}
        allow="fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (kind === "SLIDES_GOOGLE" && embedUrl) {
    return (
      <iframe
        ref={iframeRef}
        src={normalizeEmbed(embedUrl)}
        title="Course slides"
        className={className}
        allow="fullscreen"
        allowFullScreen
      />
    );
  }
  if (kind === "PDF" && contentUrl) {
    return (
      <iframe
        ref={iframeRef}
        src={`${contentUrl}#toolbar=1&navpanes=0`}
        title="Course PDF"
        className={className}
      />
    );
  }
  if ((kind === "PPTX" || kind === "PPT") && (embedUrl || contentUrl)) {
    const src = embedUrl
      ? normalizeEmbed(embedUrl)
      : contentUrl
        ? officeViewerUrl(toAbsolute(contentUrl))
        : "";
    return (
      <iframe
        ref={iframeRef}
        src={src}
        title="Course slides"
        className={className}
        allow="fullscreen"
        allowFullScreen
      />
    );
  }
  if (kind === "MARKDOWN" && contentMd) {
    return (
      <div className="prose prose-sm max-w-none p-6 dark:prose-invert">
        {/* Minimal-deps markdown: render as preformatted with line wrapping. */}
        <pre className="whitespace-pre-wrap text-sm leading-7">{contentMd}</pre>
      </div>
    );
  }
  return (
    <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">
      This course has no content yet. Ask your admin to upload a file or set a URL.
    </div>
  );
}

function toAbsolute(p: string) {
  if (typeof window === "undefined") return p;
  return new URL(p, window.location.origin).toString();
}
