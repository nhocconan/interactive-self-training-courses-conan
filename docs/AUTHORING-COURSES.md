# Authoring courses

A course in Demo Learning Portal is one of seven content kinds. Admins
pick the kind in `/admin/courses` and the learner viewer renders the right
player for it.

| Kind            | Source                                              | Player                             |
|-----------------|-----------------------------------------------------|------------------------------------|
| `HTML`          | File under `./courses/<file>.html`                  | Sandboxed `<iframe>`, scroll-based progress |
| `VIDEO_FILE`    | Upload mp4 / webm / mov (≤ 500 MB)                  | Native `<video controls>`, time-based progress |
| `VIDEO_EMBED`   | YouTube / Vimeo / Loom URL                          | Provider `<iframe>`; manual Mark complete |
| `PDF`           | Upload PDF                                          | Browser PDF viewer                 |
| `PPTX` / `PPT`  | Upload deck OR pass an Office Online viewer URL     | Office Online `<iframe>`           |
| `SLIDES_GOOGLE` | Google Slides / Docs share URL                      | `docs.google.com` embed            |
| `MARKDOWN`      | Inline text                                         | In-app Markdown reader             |

## Choosing a kind

- **Already have rich interactive HTML** (Tailwind, charts, quizzes)? Use
  `HTML` — that is what the three legacy courses use.
- **Have a recorded lecture or screencast?** Either upload as `VIDEO_FILE`
  (recommended for IP control — file is gated by `/courses-asset/<key>`),
  or paste a YouTube URL as `VIDEO_EMBED`.
- **Have slide decks?** Upload `PPTX` (Office Online renders it in-page).
- **Have a Google Doc / Slides?** Make sure the file is shared with the
  org and paste the share URL as `SLIDES_GOOGLE`.
- **Need a one-page primer?** Use `MARKDOWN` — no upload needed.

## Adding a course (step-by-step)

1. Sign in as Admin → **Courses** (`/admin/courses`).
2. Pick a category, title, slug, and description.
3. Choose **Content type**. The form reveals the right inputs:
   - For `HTML`: enter the relative path (file must exist under `./courses/`).
   - For upload kinds: click the drop-zone — the file uploads to
     `/api/admin/course-upload` and the response writes a hidden `contentUrl`
     into the form before submit.
   - For URL kinds: paste the share/embed URL.
   - For `MARKDOWN`: type it inline.
4. Toggle **Published** and (optionally) **Mandatory**.
5. Grant access via category grants or direct enrolments.

## Upload constraints

- Maximum file size: **500 MB** (set in `src/lib/course-content.ts`).
- Accepted MIME types:
  `application/pdf`, `video/mp4`, `video/webm`, `video/quicktime`,
  `application/vnd.ms-powerpoint`,
  `application/vnd.openxmlformats-officedocument.presentationml.presentation`.
- Uploaded files are stored under `COURSE_ASSETS_DIR` (defaults to
  `../course-assets` outside the app directory). Override via env var if
  you mount a network share for shared storage.

## Reporting richer progress (HTML kind, optional)

Courses can opt in to explicit progress signals via `postMessage`:

```js
window.parent.postMessage(
  { type: "lms:progress", percent: 75 },
  window.location.origin,
);
```

The viewer takes the **max** of `(scroll-derived, messaged)`.

## Video progress

For `VIDEO_FILE` the viewer hooks the `<video>` `timeupdate` event and
auto-saves the watched-percent. For `VIDEO_EMBED` we cannot reliably
observe cross-origin playback, so the learner clicks **Mark complete**.

## Security notes

- HTML courses are served from `/courses-html/<slug>` with a permissive but
  scoped CSP. Top-navigation is explicitly forbidden via the iframe sandbox.
- Uploaded assets are served from `/courses-asset/<key>` — every request
  re-checks `canAccessCourse(userId, role, courseId)` before streaming.
- Video files support HTTP Range requests for fast seeking.
