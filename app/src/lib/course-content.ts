import type { CourseKind } from "@prisma/client";

export type RenderableCourse = {
  id: string;
  slug: string;
  kind: CourseKind;
  htmlPath: string;
  contentUrl: string | null;
  embedUrl: string | null;
  contentMd: string | null;
  mimeType: string | null;
};

/// Coerce an arbitrary YouTube / Vimeo / Loom share URL into its embed form.
/// Used by the Course viewer for VIDEO_EMBED and by the AI feature for fetching context.
export function normalizeEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.endsWith("youtube.com") && u.searchParams.has("v")) {
      const id = u.searchParams.get("v");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.endsWith("vimeo.com") && /^\/\d+/.test(u.pathname)) {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
    if (u.hostname.endsWith("loom.com") && u.pathname.startsWith("/share/")) {
      return url.replace("/share/", "/embed/");
    }
    if (u.hostname.includes("docs.google.com")) {
      // Google Slides: convert /pub or /edit to /embed.
      return url
        .replace(/\/edit.*$/, "/embed")
        .replace(/\/pub.*$/, "/embed");
    }
    return url;
  } catch {
    return url;
  }
}

/// Office Online viewer URL for PPT/PPTX/Doc files. The original file must
/// itself be reachable from the public internet for OOV to render it.
export function officeViewerUrl(absoluteFileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteFileUrl)}`;
}

export const ACCEPTED_UPLOAD_MIME: Record<string, CourseKind> = {
  "application/pdf": "PDF",
  "video/mp4": "VIDEO_FILE",
  "video/webm": "VIDEO_FILE",
  "video/quicktime": "VIDEO_FILE",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.ms-powerpoint": "PPT",
};

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB
