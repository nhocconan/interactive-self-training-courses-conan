"use client";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteCourse } from "../actions";
import { Trash2 } from "lucide-react";

export default function DeleteCourseButton({ id, title }: { id: string; title: string }) {
  return (
    <ConfirmButton
      variant="ghost"
      size="sm"
      message={`Delete course "${title}"? Every progress record, quiz attempt and certificate tied to this course will be removed. This cannot be undone.`}
      onConfirm={async () => { await deleteCourse(id); }}
    >
      <Trash2 className="h-3.5 w-3.5" /> Delete
    </ConfirmButton>
  );
}
