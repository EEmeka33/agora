/** Builds "<base>?<params>" from the current search params with some keys changed or removed. */
export function withParams(
  base: string,
  current: Record<string, string | string[] | undefined>,
  patch: Record<string, string | null>,
  drop: string[] = ["new"],
) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (typeof v === "string" && !drop.includes(k)) next.set(k, v);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v) next.set(k, v);
    else next.delete(k);
  }
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}
