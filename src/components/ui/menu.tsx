"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dropdown menu positioned with `position: fixed` so it is never clipped
 * by scrollable parents (tables, cards…).
 */
export function Menu({
  trigger,
  children,
  align = "end",
  className,
  triggerClassName,
  label,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

  const toggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const top = rect.bottom + 6;
      setPos(
        align === "end"
          ? { top, right: Math.max(8, window.innerWidth - rect.right) }
          : { top, left: Math.max(8, rect.left) },
      );
    }
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  // Flip above the trigger when there is no room below.
  React.useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;
    const menu = menuRef.current.getBoundingClientRect();
    const trig = triggerRef.current.getBoundingClientRect();
    if (menu.bottom > window.innerHeight - 8 && trig.top > menu.height + 12) {
      setPos((p) => ({ ...p, top: trig.top - menu.height - 6 }));
    }
  }, [open]);

  return (
    <>
      <span
        ref={triggerRef}
        className={triggerClassName ?? "inline-flex"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        {trigger}
      </span>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", ...pos }}
          className={cn(
            "z-50 min-w-48 animate-pop-in overflow-hidden rounded-xl border bg-popover p-1 text-sm pop-shadow",
            className,
          )}
        >
          {children(close)}
        </div>
      )}
    </>
  );
}

export function MenuItem({
  className,
  destructive,
  icon,
  children,
  ...props
}: React.ComponentProps<"button"> & { destructive?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        destructive && "text-destructive hover:bg-destructive/10 [&_svg]:text-destructive",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">{children}</div>;
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
