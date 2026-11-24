import { cn, formatDate } from "@/lib/utils";
import { colorOf } from "@/lib/colors";

export function DateTile({
  date,
  locale,
  color = "indigo",
  className,
}: {
  date: Date;
  locale: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl border bg-card text-center",
        className,
      )}
    >
      <span className={cn("w-full py-0.5 text-[10px] font-semibold tracking-wide uppercase", colorOf(color).solid)}>
        {formatDate(date, locale, { month: "short" }).replace(".", "")}
      </span>
      <span className="pt-1 text-xl leading-none font-semibold tabular-nums">
        {formatDate(date, locale, { day: "numeric" })}
      </span>
      <span className="pb-1 text-[10px] text-muted-foreground capitalize">
        {formatDate(date, locale, { weekday: "short" }).replace(".", "")}
      </span>
    </div>
  );
}
