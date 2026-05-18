"use client";
import { useState } from "react";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { Upload, Check } from "lucide-react";

type Category = { id: string; name: string };

const KINDS = [
  { value: "HTML", label: "HTML — interactive course (existing pattern)" },
  { value: "VIDEO_FILE", label: "Video — uploaded mp4 / webm" },
  { value: "VIDEO_EMBED", label: "Video — YouTube / Vimeo / Loom URL" },
  { value: "PDF", label: "PDF — uploaded document" },
  { value: "PPTX", label: "Slides — uploaded .pptx" },
  { value: "PPT", label: "Slides — uploaded .ppt" },
  { value: "SLIDES_GOOGLE", label: "Slides — Google Slides / Docs URL" },
  { value: "MARKDOWN", label: "Markdown — inline content" },
];

/**
 * Server-action-friendly course form. We progressively reveal the right
 * input rows based on the selected kind. Uploaded files hit /api/admin/course-upload
 * which returns a contentUrl / mimeType / fileSize triple that we write into
 * hidden fields before submitting the parent <form>.
 */
export default function CourseForm({
  action,
  categories,
  initial,
}: {
  action: (form: FormData) => void;
  categories: Category[];
  initial?: {
    id?: string;
    title?: string;
    slug?: string;
    description?: string;
    kind?: string;
    htmlPath?: string;
    contentUrl?: string | null;
    embedUrl?: string | null;
    contentMd?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    level?: string | null;
    durationMin?: number | null;
    tags?: string[];
    categoryId?: string | null;
    isPublished?: boolean;
    isMandatory?: boolean;
  };
}) {
  const [kind, setKind] = useState(initial?.kind ?? "HTML");
  const [contentUrl, setContentUrl] = useState(initial?.contentUrl ?? "");
  const [mimeType, setMimeType] = useState(initial?.mimeType ?? "");
  const [fileSize, setFileSize] = useState(initial?.fileSize ?? 0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isUploadKind =
    kind === "VIDEO_FILE" || kind === "PDF" || kind === "PPTX" || kind === "PPT";
  const isUrlKind = kind === "VIDEO_EMBED" || kind === "SLIDES_GOOGLE";

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/course-upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload failed");
      setContentUrl(j.contentUrl);
      setMimeType(j.mimeType);
      setFileSize(j.fileSize);
      if (j.kind && j.kind !== kind && isUploadKind) setKind(j.kind);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}
      <div><Label>Title</Label><Input name="title" required defaultValue={initial?.title} /></div>
      <div><Label>Slug</Label><Input name="slug" required defaultValue={initial?.slug} placeholder="my-new-course" /></div>
      <div>
        <Label>Category</Label>
        <Select name="categoryId" defaultValue={initial?.categoryId ?? ""}>
          <option value="">(none)</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      <div className="lg:col-span-3">
        <Label>Content type</Label>
        <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
      </div>

      {kind === "HTML" && (
        <div className="lg:col-span-3">
          <Label>HTML file path <span className="text-[var(--muted-foreground)]">(relative to COURSES_DIR)</span></Label>
          <Input
            name="htmlPath"
            required
            defaultValue={initial?.htmlPath}
            placeholder="demo-ai-prompting-course.html"
          />
        </div>
      )}
      {kind !== "HTML" && (
        <input type="hidden" name="htmlPath" value={initial?.htmlPath ?? ""} />
      )}

      {isUploadKind && (
        <div className="lg:col-span-3">
          <Label>Upload file</Label>
          <label
            className={`mt-1 flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)] text-sm text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_6%,var(--muted))] ${
              uploading ? "opacity-60" : ""
            }`}
          >
            <input
              type="file"
              accept={
                kind === "VIDEO_FILE"
                  ? "video/mp4,video/webm,video/quicktime"
                  : kind === "PDF"
                    ? "application/pdf"
                    : ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              }
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {contentUrl ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--success)]" />
                <span className="font-mono text-xs">{contentUrl}</span>
                <span className="text-xs">({(fileSize / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>{uploading ? "Uploading…" : "Click or drop a file (max 500 MB)"}</span>
              </div>
            )}
          </label>
          {uploadError && <p className="mt-1 text-xs text-[var(--danger)]">{uploadError}</p>}
          <input type="hidden" name="contentUrl" value={contentUrl} />
          <input type="hidden" name="mimeType" value={mimeType} />
          <input type="hidden" name="fileSize" value={fileSize} />
        </div>
      )}

      {isUrlKind && (
        <div className="lg:col-span-3">
          <Label>External URL</Label>
          <Input
            name="embedUrl"
            defaultValue={initial?.embedUrl ?? ""}
            placeholder={
              kind === "VIDEO_EMBED"
                ? "https://www.youtube.com/watch?v=… or https://vimeo.com/…"
                : "https://docs.google.com/presentation/d/…"
            }
          />
        </div>
      )}

      {(kind === "PPTX" || kind === "PPT") && (
        <div className="lg:col-span-3">
          <Label>
            (Optional) Office Online viewer URL
            <span className="ml-1 text-[var(--muted-foreground)]">— if blank, we auto-build it from the uploaded file</span>
          </Label>
          <Input name="embedUrl" defaultValue={initial?.embedUrl ?? ""} placeholder="https://view.officeapps.live.com/op/embed.aspx?src=…" />
        </div>
      )}

      {kind === "MARKDOWN" && (
        <div className="lg:col-span-3">
          <Label>Markdown content</Label>
          <Textarea
            name="contentMd"
            rows={10}
            defaultValue={initial?.contentMd ?? ""}
            placeholder="# Welcome to the course&#10;…"
          />
        </div>
      )}

      <div>
        <Label>Level</Label>
        <Select name="level" defaultValue={initial?.level ?? "Beginner"}>
          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
        </Select>
      </div>
      <div><Label>Duration (min)</Label><Input name="durationMin" type="number" defaultValue={initial?.durationMin ?? 60} /></div>
      <div className="lg:col-span-3"><Label>Description</Label><Textarea name="description" required defaultValue={initial?.description} /></div>
      <div className="lg:col-span-2"><Label>Tags (comma-separated)</Label><Input name="tags" defaultValue={initial?.tags?.join(", ")} placeholder="AI, Prompting" /></div>
      <div className="flex items-end gap-4">
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> Published</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isMandatory" defaultChecked={initial?.isMandatory ?? false} /> Mandatory</label>
        <Button type="submit" className="ml-auto">{initial?.id ? "Save" : "Add"}</Button>
      </div>
    </form>
  );
}
