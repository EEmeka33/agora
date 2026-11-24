"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Layers,
  Network,
  Rocket,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

const icons = {
  dashboard: LayoutDashboard,
  foundation: Rocket,
  structure: Network,
  poles: Layers,
  members: Users,
  projects: FolderKanban,
  tasks: CheckSquare,
  events: CalendarDays,
  documents: FileText,
  finance: Wallet,
  activity: Activity,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

type NavKey = keyof typeof icons;
const sections: {
  key: "overview" | "organization" | "work" | "life" | "admin";
  items: { key: NavKey; href: string }[];
}[] = [
  {
    key: "overview",
    items: [
      { key: "dashboard", href: "/" },
      { key: "foundation", href: "/foundation" },
    ],
  },
  {
    key: "organization",
    items: [
      { key: "structure", href: "/structure" },
      { key: "poles", href: "/poles" },
      { key: "members", href: "/members" },
    ],
  },
  {
    key: "work",
    items: [
      { key: "projects", href: "/projects" },
      { key: "tasks", href: "/tasks" },
    ],
  },
  {
    key: "life",
    items: [
      { key: "events", href: "/events" },
      { key: "documents", href: "/documents" },
    ],
  },
  {
    key: "admin",
    items: [
      { key: "finance", href: "/finance" },
      { key: "activity", href: "/activity" },
      { key: "settings", href: "/settings" },
    ],
  },
];

export type SidebarProps = {
  association: { name: string; legalForm: string };
  badges: Partial<Record<NavKey, string | number>>;
  footer: React.ReactNode;
};

const MobileNavContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <MobileNavContext value={{ open, setOpen }}>{children}</MobileNavContext>;
}

export function useMobileNav() {
  return React.useContext(MobileNavContext);
}

function SidebarContent({ association, badges, footer, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const t = useT();
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 px-4 pt-5 pb-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm">
          {association.name.trim().charAt(0).toUpperCase() || "A"}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm leading-tight font-semibold">{association.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{association.legalForm}</span>
        </span>
      </Link>
      <nav className="flex-1 scrollbar-thin space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.key}>
            <p className="mb-1 px-2 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              {t.nav.sections[section.key]}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = icons[item.key];
                const active = isActive(item.href);
                const badge = badges[item.key];
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-soft text-primary-soft-foreground"
                          : "text-muted-foreground hover:bg-hover hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[18px] shrink-0",
                          active ? "" : "text-muted-foreground/80 group-hover:text-foreground",
                        )}
                      />
                      <span className="flex-1 truncate">{t.nav[item.key]}</span>
                      {badge !== undefined && badge !== 0 && badge !== "" && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
                            active ? "bg-primary/15" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3">{footer}</div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { open, setOpen } = useMobileNav();
  const pathname = usePathname();
  const t = useT();

  // Close the drawer after navigating.
  const prevPath = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setOpen(false);
    }
  }, [pathname, setOpen]);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-sidebar lg:block">
        <SidebarContent {...props} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in border-r bg-sidebar shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-5 right-3 rounded-md p-1.5 text-muted-foreground hover:bg-hover"
              aria-label={t.common.close}
            >
              <X className="size-4" />
            </button>
            <SidebarContent {...props} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
