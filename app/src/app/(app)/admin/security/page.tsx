import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { invalidateSiteSecurityCache } from "@/lib/site-security";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { ShieldCheck, KeyRound, Clock, Globe } from "lucide-react";

async function saveSecurity(form: FormData) {
  "use server";
  const s = await requireAdmin();
  const data = {
    pwdMinLength: Math.max(8, Number(form.get("pwdMinLength") || 10)),
    pwdMinClasses: Math.max(1, Math.min(4, Number(form.get("pwdMinClasses") || 3))),
    pwdMaxAgeDays: Math.max(0, Number(form.get("pwdMaxAgeDays") || 0)),
    loginMaxFailures: Math.max(3, Number(form.get("loginMaxFailures") || 8)),
    loginCooldownMinutes: Math.max(1, Number(form.get("loginCooldownMinutes") || 5)),
    sessionIdleMinutes: Math.max(0, Number(form.get("sessionIdleMinutes") || 0)),
    allowedEmailDomains: String(form.get("allowedEmailDomains") || "").trim() || null,
    adminIpAllowlist: String(form.get("adminIpAllowlist") || "").trim() || null,
    forceHsts: form.get("forceHsts") === "on",
    adminReauthHours: Math.max(1, Number(form.get("adminReauthHours") || 8)),
  };
  const before = await prisma.siteSecurity.findUnique({ where: { id: 1 } });
  await prisma.siteSecurity.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  invalidateSiteSecurityCache();
  await audit({ actorId: s.user.id, action: "security.update", before, after: data });
  revalidatePath("/admin/security");
}

export default async function SiteSecurityPage() {
  await requireAdmin();
  const cfg =
    (await prisma.siteSecurity.findUnique({ where: { id: 1 } })) ??
    (await prisma.siteSecurity.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site security</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Password policy, brute-force lockout, session lifetime, and access controls. Changes apply on next sign-in.
        </p>
      </div>

      <form action={saveSecurity} className="space-y-6">
        <Card className="p-6">
          <SectionHeading icon={<KeyRound className="h-4 w-4" />} title="Password policy" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Minimum length" hint="≥ 8 recommended">
              <Input type="number" name="pwdMinLength" defaultValue={cfg.pwdMinLength} min={8} />
            </Field>
            <Field label="Min character classes (1-4)" hint="lower / upper / digit / symbol">
              <Input type="number" name="pwdMinClasses" defaultValue={cfg.pwdMinClasses} min={1} max={4} />
            </Field>
            <Field label="Max age (days, 0 = never)" hint="Forces a rotation prompt">
              <Input type="number" name="pwdMaxAgeDays" defaultValue={cfg.pwdMaxAgeDays} min={0} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading icon={<ShieldCheck className="h-4 w-4" />} title="Brute-force protection" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Max consecutive failures" hint="Lock out after this many wrong attempts">
              <Input type="number" name="loginMaxFailures" defaultValue={cfg.loginMaxFailures} min={3} />
            </Field>
            <Field label="Lockout duration (minutes)" hint="Counter resets after this">
              <Input type="number" name="loginCooldownMinutes" defaultValue={cfg.loginCooldownMinutes} min={1} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading icon={<Clock className="h-4 w-4" />} title="Sessions" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Idle session timeout (minutes, 0 = JWT default)">
              <Input type="number" name="sessionIdleMinutes" defaultValue={cfg.sessionIdleMinutes} min={0} />
            </Field>
            <Field label="Admin re-auth window (hours)" hint="Re-prompt admin password for sensitive ops">
              <Input type="number" name="adminReauthHours" defaultValue={cfg.adminReauthHours} min={1} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading icon={<Globe className="h-4 w-4" />} title="Access controls" />
          <div className="grid grid-cols-1 gap-4">
            <Field label="Allowed email domains" hint="Comma-separated. Empty = no restriction.">
              <Input
                name="allowedEmailDomains"
                defaultValue={cfg.allowedEmailDomains ?? ""}
                placeholder="demo.com, dic.app"
              />
            </Field>
            <Field label="Admin IP allowlist (CIDR)" hint="Comma- or newline-separated. Empty = no restriction.">
              <Textarea
                name="adminIpAllowlist"
                rows={3}
                defaultValue={cfg.adminIpAllowlist ?? ""}
                placeholder="10.0.0.0/8&#10;192.168.1.0/24"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="forceHsts" defaultChecked={cfg.forceHsts} className="accent-[var(--primary)]" />
              Force HTTPS (HSTS header in production)
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save security settings</Button>
        </div>
      </form>
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">
        {icon}
      </span>
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {hint && <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{hint}</div>}
      <div className="mt-1">{children}</div>
    </div>
  );
}
