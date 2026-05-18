"use client";
import { useTransition } from "react";
import { Select } from "@/components/ui";
import { updateUserRole } from "../actions";
import type { Role } from "@prisma/client";

export default function UserRoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [pending, start] = useTransition();
  return (
    <Select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => start(() => updateUserRole(userId, e.target.value as Role))}
      className="h-8 text-xs"
    >
      <option value="USER">User</option>
      <option value="HR">HR</option>
      <option value="ADMIN">Admin</option>
    </Select>
  );
}
