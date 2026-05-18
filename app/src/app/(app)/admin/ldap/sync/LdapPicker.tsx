"use client";
import { useState, useTransition } from "react";
import { Button, Card, Input, Select, Badge } from "@/components/ui";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { searchLdapUsers, addLdapUser } from "../actions";

type Row = Awaited<ReturnType<typeof searchLdapUsers>>[number];

export default function LdapPicker() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [searching, startSearch] = useTransition();
  const [adding, startAdd] = useTransition();
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRows([]);
    startSearch(async () => {
      try {
        const out = await searchLdapUsers(q);
        setRows(out);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function provision(row: Row, role: string) {
    setError(null);
    const fd = new FormData();
    fd.set("dn", row.dn);
    fd.set("email", row.email);
    fd.set("username", row.username);
    fd.set("name", row.name);
    if (row.department) fd.set("department", row.department);
    if (row.jobTitle) fd.set("jobTitle", row.jobTitle);
    fd.set("role", role);
    startAdd(async () => {
      try {
        await addLdapUser(fd);
        setAdded((m) => ({ ...m, [row.dn]: true }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Add user from Active Directory</h2>
      <form onSubmit={onSearch} className="mt-3 flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, username, or email…"
        />
        <Button type="submit" disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
      {rows.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Dept</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dn} className="border-t align-middle">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="font-mono text-[11px] text-[var(--muted-foreground)]">{r.username}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.email}</td>
                  <td className="px-3 py-2 text-xs">{r.department ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Select id={`role-${r.dn}`} defaultValue="USER" className="h-8 text-xs">
                      <option value="USER">User</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {added[r.dn] ? (
                      <Badge tone="success">Added</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={adding}
                        onClick={() => {
                          const sel = document.getElementById(`role-${r.dn}`) as HTMLSelectElement | null;
                          provision(r, sel?.value ?? "USER");
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Add
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && !searching && q && (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">No matches — broaden your query.</p>
      )}
    </Card>
  );
}
