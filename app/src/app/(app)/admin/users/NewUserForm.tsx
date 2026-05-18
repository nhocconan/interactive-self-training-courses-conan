"use client";
import { useState } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { createLocalUser } from "../actions";
import { ChevronDown } from "lucide-react";

export default function NewUserForm() {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <div className="font-semibold">+ Create local user</div>
          <div className="text-xs text-[var(--muted-foreground)]">
            For accounts not in Active Directory.
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <form action={createLocalUser} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Full name</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" required minLength={6} />
          </div>
          <div>
            <Label>Department</Label>
            <Input name="department" />
          </div>
          <div>
            <Label>Role</Label>
            <Select name="role" defaultValue="USER">
              <option value="USER">User</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Create user</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
