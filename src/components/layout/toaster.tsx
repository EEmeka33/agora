"use client";

import * as React from "react";
import { Toaster } from "sonner";

export function AppToaster() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return (
    <Toaster
      theme={dark ? "dark" : "light"}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{ className: "!rounded-xl !text-sm" }}
    />
  );
}
