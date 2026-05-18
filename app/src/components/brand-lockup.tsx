import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const logoFrame =
  "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[color-mix(in_oklab,var(--primary)_18%,var(--border))] bg-white shadow-sm";

/**
 * Demo Learning brand lockup.
 *  - `default`: learner header.   [logo] Demo / LEARNING
 *  - `admin`:   admin sidebar.    [logo]ᴬ Admin console / Demo Learning
 */
export function BrandLockup({
  variant = "default",
  href = "/dashboard",
  className,
}: {
  variant?: "default" | "admin";
  href?: string;
  className?: string;
}) {
  if (variant === "admin") {
    return (
      <Link href={href} className={cn("flex items-center gap-2.5", className)}>
        <span className="relative shrink-0">
          <span className={logoFrame}>
            <Image
              src="/brand/demo-logo.png"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-[var(--background)] bg-[var(--brand-navy)] text-[7px] font-bold leading-none text-white">
            A
          </span>
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Admin
          </span>
          <span className="mt-1 text-[13px] font-bold tracking-tight">Demo Learning</span>
        </span>
      </Link>
    );
  }
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className={logoFrame}>
        <Image
          src="/brand/demo-logo.png"
          alt=""
          aria-hidden="true"
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="text-[15px] font-bold tracking-tight">Demo</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Learning
        </span>
      </span>
    </Link>
  );
}
