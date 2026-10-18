import React from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export type StatCardVariant =
  | "blue"
  | "emerald"
  | "pink"
  | "teal"
  | "rose"
  | "indigo"
  | "amber";

const VARIANT_MAP: Record<
  StatCardVariant,
  { color: string; accent: string; bar: string }
> = {
  blue: {
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    accent: "from-blue-500/20",
    bar: "from-blue-500 to-cyan-400",
  },
  emerald: {
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accent: "from-emerald-500/20",
    bar: "from-emerald-500 to-teal-400",
  },
  pink: {
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    accent: "from-pink-500/20",
    bar: "from-pink-500 to-fuchsia-400",
  },
  teal: {
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    accent: "from-teal-500/20",
    bar: "from-teal-500 to-cyan-400",
  },
  rose: {
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    accent: "from-rose-500/20",
    bar: "from-rose-500 to-orange-400",
  },
  indigo: {
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    accent: "from-indigo-500/20",
    bar: "from-indigo-500 to-purple-400",
  },
  amber: {
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    accent: "from-amber-500/20",
    bar: "from-amber-500 to-yellow-400",
  },
};

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  todaySub?: string;
  icon: LucideIcon | React.ReactNode;
  variant?: StatCardVariant;
  color?: string;
  accent?: string;
  bar?: string;
  trend?: number;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  progress?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  isBlurred?: boolean;
  onToggleBlur?: () => void;
  isLoading?: boolean;
}

export interface StatCardSkeletonProps {
  variant?: StatCardVariant;
  className?: string;
}

export function StatCardSkeleton({
  variant = "blue",
  className = "",
}: StatCardSkeletonProps) {
  const preset = VARIANT_MAP[variant] || VARIANT_MAP.blue;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${preset.accent} via-card to-card p-3 sm:p-3.5 shadow-xs dark:border-white/5 select-none ${className}`}
    >
      {/* Shimmer sweep effect */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/15 dark:via-white/5 to-transparent" />

      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Label placeholder */}
          <div className="h-3 w-24 rounded-md bg-muted-foreground/15 animate-pulse" />
          {/* Value placeholder */}
          <div className="h-7 sm:h-8 w-32 rounded-md bg-muted-foreground/25 animate-pulse mt-1" />
          {/* Subtitle placeholder */}
          <div className="h-2.5 w-44 rounded-md bg-muted-foreground/10 animate-pulse mt-1.5" />
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Icon badge placeholder */}
          <div
            className={`size-8.5 rounded-lg ${preset.color} opacity-40 animate-pulse flex items-center justify-center`}
          />
        </div>
      </div>

      {/* Slim compact progress bar skeleton */}
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${preset.bar} opacity-40 animate-pulse`}
          style={{ width: "65%" }}
        />
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  todaySub,
  icon,
  variant = "blue",
  color: customColor,
  accent: customAccent,
  bar: customBar,
  trend,
  badge,
  action,
  progress = 100,
  active,
  onClick,
  className = "",
  isBlurred = false,
  onToggleBlur,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return <StatCardSkeleton variant={variant} className={className} />;
  }

  const preset = VARIANT_MAP[variant] || VARIANT_MAP.blue;
  const color = customColor || preset.color;
  const accent = customAccent || preset.accent;
  const bar = customBar || preset.bar;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="size-5" />;
  };

  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${accent} via-card to-card p-3 sm:p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-cyan-500/30 dark:border-white/5 ${
        isClickable ? "cursor-pointer select-none" : ""
      } ${
        active !== undefined
          ? active
            ? "ring-2 ring-primary border-primary shadow-md"
            : "opacity-85 hover:opacity-100"
          : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              onClick={isBlurred && onToggleBlur ? onToggleBlur : undefined}
              className={`text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight transition-all duration-200 ${
                isBlurred ? "blur-[6px] select-none cursor-pointer" : ""
              }`}
              title={isBlurred && onToggleBlur ? "Click to reveal amount" : undefined}
            >
              {value}
            </div>
            {onToggleBlur && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBlur();
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                title={isBlurred ? "Show Amount" : "Hide Amount"}
                aria-label={isBlurred ? "Show Amount" : "Hide Amount"}
              >
                {isBlurred ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            )}
          </div>
          {(sub || todaySub) && (
            <div className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
              {sub} {todaySub ? `· ${todaySub}` : ""}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div
            className={`size-8.5 rounded-lg ${color} flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0 shadow-xs`}
          >
            {renderIcon()}
          </div>
          {trend !== undefined && (
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                trend >= 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              {trend >= 0 ? "+" : ""}
              {trend.toFixed(0)}%
            </span>
          )}
          {badge}
          {action}
        </div>
      </div>

      {/* Slim compact progress bar */}
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${bar}`}
          style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
        />
      </div>
    </div>
  );
}
export default StatCard;
