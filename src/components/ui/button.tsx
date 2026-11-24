import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0";

const variants = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-strong",
  secondary: "bg-muted text-foreground hover:bg-hover",
  outline: "border border-input bg-card text-foreground shadow-xs hover:bg-hover",
  ghost: "text-foreground hover:bg-hover",
  soft: "bg-primary-soft text-primary-soft-foreground hover:brightness-95 dark:hover:brightness-110",
  destructive: "bg-destructive text-white shadow-sm hover:brightness-95",
  "destructive-ghost": "text-destructive hover:bg-destructive/10",
  link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
} as const;

const sizes = {
  xs: "h-7 px-2 text-xs rounded-md [&_svg]:size-3.5",
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4",
  lg: "h-10 px-5",
  icon: "size-9",
  "icon-sm": "size-8",
  "icon-xs": "size-7 rounded-md [&_svg]:size-3.5",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonVariants({ variant, size, className })} {...props} />;
}
