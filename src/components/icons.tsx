import {
  Calendar,
  Camera,
  Code,
  Globe,
  GraduationCap,
  Handshake,
  Heart,
  Layers,
  Leaf,
  Megaphone,
  Music,
  Palette,
  Shield,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { colorOf } from "@/lib/colors";

export const poleIcons: Record<string, LucideIcon> = {
  layers: Layers,
  megaphone: Megaphone,
  calendar: Calendar,
  wallet: Wallet,
  handshake: Handshake,
  users: Users,
  heart: Heart,
  palette: Palette,
  code: Code,
  graduation: GraduationCap,
  leaf: Leaf,
  trophy: Trophy,
  music: Music,
  globe: Globe,
  camera: Camera,
  shield: Shield,
};

export function PoleIcon({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = poleIcons[icon] ?? Layers;
  const box = {
    sm: "size-6 rounded-md [&_svg]:size-3.5",
    md: "size-9 rounded-lg [&_svg]:size-[18px]",
    lg: "size-12 rounded-xl [&_svg]:size-6",
  }[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", colorOf(color).soft, box, className)}>
      <Icon />
    </span>
  );
}
