import type { Metadata, Viewport } from "next";
import { AppToaster } from "@/components/layout/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Agora", template: "%s · Agora" },
  description:
    "The shared workspace of your association: founding, structure, projects, tasks, events, finance and documents.",
  applicationName: "Agora",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#17181c" },
  ],
};

// Applies theme, accent color and language before the first paint (no flash).
const bootScript = `(function(){try{var d=document.documentElement,s=localStorage,t=s.getItem("agora-theme")||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");var a=s.getItem("agora-accent");if(a)d.setAttribute("data-accent",a);var m=document.cookie.match(/(?:^|; )agora_locale=([^;]*)/);if(m)d.lang=m[1];}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
