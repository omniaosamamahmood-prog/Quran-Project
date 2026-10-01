import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type HomePanelProps = {
  icon: ReactNode;
  title: ReactNode;
  action: string;
  href: string;
  children: ReactNode;
  className?: string;
};

/** Home card whose text and action both span the full card width. */
export function HomePanel({
  icon,
  title,
  action,
  href,
  children,
  className,
}: HomePanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0 flex-1">{title}</div>
      </div>
      <div className="mt-3">{children}</div>
      <Link
        href={href}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-emerald px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-deep"
      >
        {action}
      </Link>
    </section>
  );
}
