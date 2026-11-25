"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  CornerDownLeft,
  FileText,
  FolderKanban,
  Inbox,
  Layers,
  Loader2,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "agora:open-search";
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type Result = { type: string; id: string; title: string; subtitle?: string; href: string };
const typeIcons: Record<string, LucideIcon> = {
  projects: FolderKanban,
  tasks: CheckSquare,
  members: User,
  poles: Layers,
  events: CalendarDays,
  documents: FileText,
  requests: Inbox,
};

export function CommandPalette() {
  const t = useT();
  const router = useRouter();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const pages: Result[] = React.useMemo(
    () =>
      (
        [
          ["dashboard", "/"],
          ["foundation", "/foundation"],
          ["structure", "/structure"],
          ["poles", "/poles"],
          ["members", "/members"],
          ["projects", "/projects"],
          ["tasks", "/tasks"],
          ["requests", "/requests"],
          ["polls", "/polls"],
          ["volunteering", "/volunteering"],
          ["notifications", "/notifications"],
          ["events", "/events"],
          ["documents", "/documents"],
          ["finance", "/finance"],
          ["activity", "/activity"],
          ["settings", "/settings"],
        ] as const
      ).map(([key, href]) => ({ type: "pages", id: key, title: t.nav[key], href })),
    [t],
  );

  const show = React.useCallback(() => {
    setQuery("");
    setResults([]);
    setIndex(0);
    setOpen(true);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) setOpen(false);
        else show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, [show]);

  React.useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  const trimmed = query.trim();
  React.useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setIndex(0);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const q = query.trim().toLowerCase();
  const matchingPages = q ? pages.filter((p) => p.title.toLowerCase().includes(q)) : pages;
  const items = [...matchingPages, ...(trimmed.length >= 2 ? results : [])];
  const groups = items.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  const go = (r: Result | undefined) => {
    if (!r) return;
    setOpen(false);
    router.push(r.href);
  };

  let flatIndex = -1;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setOpen(false)}
      onMouseDown={(e) => e.target === dialogRef.current && setOpen(false)}
      className="fixed inset-x-0 top-[12vh] mx-auto w-[calc(100%-1.5rem)] max-w-xl overflow-hidden rounded-2xl border bg-popover p-0 text-foreground pop-shadow open:animate-pop-in"
    >
      <div className="flex items-center gap-3 border-b px-4">
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <Search className="size-4 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(items.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(items[index]);
            }
          }}
          placeholder={t.search.placeholder}
          className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
      </div>
      <div className="max-h-[55vh] scrollbar-thin overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {q.length >= 2 && !loading ? t.common.noResults : t.search.hint}
          </p>
        ) : (
          Object.entries(groups).map(([type, list]) => (
            <div key={type} className="mb-1">
              <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {t.search.groups[type as keyof typeof t.search.groups] ?? type}
              </p>
              {list.map((r) => {
                flatIndex++;
                const i = flatIndex;
                const Icon = typeIcons[r.type] ?? CornerDownLeft;
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    type="button"
                    onMouseMove={() => setIndex(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm",
                      i === index ? "bg-hover" : "",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    {r.subtitle && (
                      <span className="max-w-[40%] truncate text-xs text-muted-foreground">{r.subtitle}</span>
                    )}
                    {i === index && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </dialog>
  );
}
