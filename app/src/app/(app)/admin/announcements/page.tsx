import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { Trash2 } from "lucide-react";

async function broadcast(form: FormData) {
  "use server";
  const s = await requireAdmin();
  const title = String(form.get("title") || "").trim();
  const body = String(form.get("body") || "").trim();
  const audience = (String(form.get("audience") || "ALL")) as "ALL" | "USER" | "HR" | "ADMIN";
  if (!title || !body) return;
  const a = await prisma.announcement.create({
    data: { title, body, audience, createdBy: s.user.id },
  });
  const users = await prisma.user.findMany({
    where: { isActive: true, ...(audience === "ALL" ? {} : { role: audience }) },
    select: { id: true },
  });
  await notify({
    userId: users.map((u) => u.id),
    kind: "ANNOUNCEMENT",
    title,
    body,
  });
  await audit({ actorId: s.user.id, action: "announcement.broadcast", target: a.id, after: { title, audience, count: users.length } });
  revalidatePath("/admin/announcements");
}

async function remove(id: string) {
  "use server";
  const s = await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
  await audit({ actorId: s.user.id, action: "announcement.delete", target: id });
  revalidatePath("/admin/announcements");
}

export default async function AdminAnnouncements() {
  await requireAdmin();
  const items = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
      <Card className="p-5">
        <h2 className="text-sm font-semibold">New announcement</h2>
        <form action={broadcast} className="mt-3 space-y-3">
          <div><Label>Title</Label><Input name="title" required /></div>
          <div><Label>Body</Label><Textarea name="body" required /></div>
          <div className="flex items-center gap-3">
            <Label className="m-0">Audience</Label>
            <Select name="audience" defaultValue="ALL" className="w-48">
              <option value="ALL">Everyone</option>
              <option value="USER">Learners</option>
              <option value="HR">HR team</option>
              <option value="ADMIN">Admins</option>
            </Select>
            <Button type="submit" className="ml-auto">Broadcast</Button>
          </div>
        </form>
      </Card>
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="p-8 text-center text-sm text-[var(--muted-foreground)]">No announcements yet.</Card>
        ) : items.map((a) => (
          <Card key={a.id} className="flex items-start justify-between p-5">
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">{a.audience}</div>
              <div className="text-base font-semibold">{a.title}</div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{a.body}</p>
              <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">{new Date(a.createdAt).toLocaleString()}</div>
            </div>
            <form action={async () => { "use server"; await remove(a.id); }}>
              <Button type="submit" variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
