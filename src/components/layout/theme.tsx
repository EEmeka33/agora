"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export type Theme = "light" | "dark" | "system";

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

// Tiny external store around localStorage so every toggle stays in sync.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function getSnapshot(): Theme {
  try {
    return (localStorage.getItem("agora-theme") as Theme) || "system";
  } catch {
    return "system";
  }
}
const getServerSnapshot = (): Theme => "system";

export function useTheme() {
  const theme = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setTheme = React.useCallback((t: Theme) => {
    try {
      localStorage.setItem("agora-theme", t);
    } catch {}
    apply(t);
    listeners.forEach((l) => l());
  }, []);
  return { theme, setTheme };
}

export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`${t.common.theme}: ${t.common[theme]}`}
      aria-label={t.nav.toggleTheme}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}

export function ThemePicker() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t.common.light, icon: <Sun /> },
    { value: "dark", label: t.common.dark, icon: <Moon /> },
    { value: "system", label: t.common.system, icon: <Monitor /> },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:max-w-md">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setTheme(o.value)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors [&_svg]:size-5",
            theme === o.value ? "border-primary bg-primary-soft text-primary-soft-foreground" : "hover:bg-hover",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Keeps <html data-accent> and lang in sync with the association settings. */
export function DocumentSync({ accent, locale }: { accent: string; locale: string }) {
  React.useEffect(() => {
    const el = document.documentElement;
    if (accent === "indigo") el.removeAttribute("data-accent");
    else el.setAttribute("data-accent", accent);
    el.lang = locale;
    try {
      localStorage.setItem("agora-accent", accent);
    } catch {}
  }, [accent, locale]);
  return null;
}
