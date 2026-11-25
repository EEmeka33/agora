import { en, type Dictionary } from "./en";
import { fr } from "./fr";
import { LOCALES, type Locale } from "../constants";

export const dictionaries: Record<Locale, Dictionary> = { en, fr };
export type { Dictionary };

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value);
}
