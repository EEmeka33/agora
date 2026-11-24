"use client";

import { createContext, use } from "react";
import type { Locale } from "../constants";
import { dictionaries } from "./dictionaries";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale() {
  return use(LocaleContext);
}

/** Dictionary for the current locale, usable in client components. */
export function useT() {
  return dictionaries[use(LocaleContext)];
}
