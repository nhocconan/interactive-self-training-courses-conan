import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import Link from "next/link";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { saveLdap } from "../actions";
import LdapTestButton from "./LdapTestButton";
import { Users2 } from "lucide-react";

export default async function AdminLdap() {
  await requireAdmin();
  const cfg = (await prisma.ldapConfig.findUnique({ where: { id: 1 } })) ?? null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LDAP / Active Directory</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Configure single sign-on against your Windows Server 2019 (or any RFC-4511 LDAP) server.
            Users may either log in directly (auto-provisioning), or be added in bulk by an admin via the picker.
          </p>
        </div>
        <Link
          href="/admin/ldap/sync"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm hover:bg-[var(--muted)]"
        >
          <Users2 className="h-4 w-4" /> Add / sync AD users
        </Link>
      </div>

      <Card className="p-6">
        <form action={saveLdap} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={cfg?.enabled} className="accent-[var(--primary)]" />
            Enable LDAP / AD authentication
          </label>
          <div><Label>Server URL</Label><Input name="url" defaultValue={cfg?.url ?? ""} placeholder="ldap://dc01.demo.local:389" /></div>
          <div><Label>Base DN</Label><Input name="baseDN" defaultValue={cfg?.baseDN ?? ""} placeholder="DC=demo,DC=local" /></div>
          <div><Label>Bind DN (service account)</Label><Input name="bindDN" defaultValue={cfg?.bindDN ?? ""} placeholder="CN=svc-lms,OU=Service,DC=demo,DC=local" /></div>
          <div><Label>Bind password</Label><Input name="bindPassword" type="password" defaultValue={cfg?.bindPassword ?? ""} placeholder="••••••••" /></div>
          <div className="sm:col-span-2"><Label>User search filter</Label><Input name="userFilter" defaultValue={cfg?.userFilter ?? "(|(sAMAccountName={username})(userPrincipalName={username}))"} /></div>
          <div className="sm:col-span-2">
            <Label>
              Picker sub-tree(s)
              <span className="ml-1 text-[var(--muted-foreground)]">— one OU per line. Empty = use Base DN.</span>
            </Label>
            <Textarea
              name="subtreeOUs"
              rows={3}
              defaultValue={cfg?.subtreeOUs ?? ""}
              placeholder="OU=Employees,DC=demo,DC=local&#10;OU=Contractors,DC=demo,DC=local"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="syncEnabled" defaultChecked={cfg?.syncEnabled} className="accent-[var(--primary)]" />
            Enable nightly attribute sync for LDAP-sourced users
          </label>
          <div><Label>Email attribute</Label><Input name="emailAttr" defaultValue={cfg?.emailAttr ?? "mail"} /></div>
          <div><Label>Name attribute</Label><Input name="nameAttr" defaultValue={cfg?.nameAttr ?? "displayName"} /></div>
          <div><Label>Department attribute</Label><Input name="deptAttr" defaultValue={cfg?.deptAttr ?? "department"} /></div>
          <div><Label>Title attribute</Label><Input name="titleAttr" defaultValue={cfg?.titleAttr ?? "title"} /></div>
          <div>
            <Label>Default role for new LDAP users</Label>
            <Select name="defaultRole" defaultValue={cfg?.defaultRole ?? "USER"}>
              <option value="USER">User</option><option value="HR">HR</option><option value="ADMIN">Admin</option>
            </Select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="startTls" defaultChecked={cfg?.startTls} className="accent-[var(--primary)]" />
            Use StartTLS (recommended for production)
          </label>
          <div className="sm:col-span-2 flex justify-between">
            <LdapTestButton />
            <Button type="submit">Save configuration</Button>
          </div>
        </form>
      </Card>

      <p className="text-xs text-[var(--muted-foreground)]">
        Use <code className="rounded bg-[var(--muted)] px-1">{`{username}`}</code> in the filter — it is substituted with the value the user enters at login (the local-part is used when they type an email).
      </p>
    </div>
  );
}
