"use client";
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;

export function ConfirmButton({
  onConfirm,
  message,
  variant = "danger",
  size = "sm",
  children,
}: {
  onConfirm: () => Promise<void> | void;
  message: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  children: ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(message)) return;
        start(async () => {
          await onConfirm();
        });
      }}
    >
      {children}
    </Button>
  );
}
