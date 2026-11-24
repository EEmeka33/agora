import "server-only";
import { cookies, headers } from "next/headers";
import type { Locale } from "../constants";
import { dictionaries, isLocale } from "./dictionaries";

export const LOCALE_COOKIE = "agora_locale";

/** Locale from the cookie, then the browser's Accept-Language, then English. */
export async function getLocale(): Promise<Locale> {
  const cookieValue = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
