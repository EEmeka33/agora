import { en, type Dictionary } from "./en";
import { fr } from "./fr";
import type { Locale } from "../constants";

export const dictionaries: Record<Locale, Dictionary> = { en, fr };
export type { Dictionary };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}
