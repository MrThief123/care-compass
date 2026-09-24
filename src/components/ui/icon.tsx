import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  ClipboardCheck,
  File,
  Info,
  Home,
  Loader2,
  LogOut,
  Plus,
  Search,
  SlidersHorizontal,
  User,
  X,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  home: Home,
  info: Info,
  calendar: Calendar,
  dollar: CircleDollarSign,
  sliders: SlidersHorizontal,
  person: User,
  "clipboard-check": ClipboardCheck,
  bell: Bell,
  search: Search,
  file: File,
  loader: Loader2,
  "log-out": LogOut,
  plus: Plus,
  check: Check,
  "alert-triangle": AlertTriangle,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;

const SIZES = { 14: 14, 16: 16, 20: 20, 24: 24 } as const;

export interface IconProps extends Omit<LucideProps, "size"> {
  name: IconName;
  size?: keyof typeof SIZES;
}

export function Icon({ name, size = 16, className, ...props }: IconProps) {
  const LucideIcon = ICONS[name];
  return (
    <LucideIcon size={SIZES[size]} className={className} data-testid={`icon-${name}`} {...props} />
  );
}
