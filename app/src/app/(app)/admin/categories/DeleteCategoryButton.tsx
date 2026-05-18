"use client";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteCategory } from "../actions";
import { Trash2 } from "lucide-react";

export default function DeleteCategoryButton({ id, name, courseCount }: { id: string; name: string; courseCount: number }) {
  const msg = courseCount > 0
    ? `Delete category "${name}"? ${courseCount} course(s) will fall back to "General". This cannot be undone.`
    : `Delete category "${name}"? This cannot be undone.`;
  return (
    <ConfirmButton
      variant="ghost"
      size="sm"
      message={msg}
      onConfirm={async () => { await deleteCategory(id); }}
    >
      <Trash2 className="h-3.5 w-3.5" /> Delete
    </ConfirmButton>
  );
}
