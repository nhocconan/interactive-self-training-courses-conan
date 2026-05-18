import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Award, CheckCircle2, XCircle } from "lucide-react";

// Public verification page — no auth required.
export default async function VerifyCert({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { code },
    include: { user: true, course: true, path: true },
  });

  const ok = !!cert;
  const expired = cert?.expiresAt ? cert.expiresAt < new Date() : false;

  return (
    <main className="min-h-screen bg-mesh">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-8 shadow-[var(--shadow-pop)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${ok && !expired ? "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)]" : "bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)]"}`}>
              {ok && !expired ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
                Demo Learning · Certificate verification
              </div>
              <div className="text-2xl font-bold">
                {ok ? (expired ? "Certificate expired" : "Valid certificate") : "Certificate not found"}
              </div>
            </div>
          </div>

          {ok ? (
            <div className="mt-6 space-y-2 text-sm">
              <Row label="Code">{cert!.code}</Row>
              <Row label="Awarded to">{cert!.user.name}</Row>
              <Row label="For">{cert!.title}</Row>
              <Row label="Issued">{new Date(cert!.issuedAt).toLocaleString()}</Row>
              {cert!.expiresAt && (
                <Row label="Expires">
                  <span className={expired ? "text-[var(--danger)]" : ""}>
                    {new Date(cert!.expiresAt).toLocaleString()}
                  </span>
                </Row>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              The code <code>{code}</code> doesn’t match any certificate we issued.
            </p>
          )}

          <div className="mt-6 inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Award className="h-3.5 w-3.5" /> Independently verifiable · learning.demo.com
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
          <Link href="/login" className="underline">Back to portal</Link>
        </p>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-[var(--border)] py-2 last:border-b-0">
      <dt className="text-xs text-[var(--muted-foreground)]">{label}</dt>
      <dd className="col-span-2 font-medium">{children}</dd>
    </div>
  );
}
