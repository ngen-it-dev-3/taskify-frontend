type FloatingCardProps = {
  label: string;
  title: string;
  meta: string;
  accent?: string;
  className?: string;   // for positioning
  delay?: string;       // animation delay
  floatSpeed?: "fast" | "slow" | "normal";
};

export default function FloatingCard({
  label,
  title,
  meta,
  accent = "#1B6B52",
  className = "",
  delay = "0s",
  floatSpeed = "normal",
}: FloatingCardProps) {
  const floatClass =
    floatSpeed === "fast"
      ? "animate-float-fast"
      : floatSpeed === "slow"
      ? "animate-float-slow"
      : "animate-float";

  return (
    <div
      className={`absolute hidden md:block ${floatClass} ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="w-56 rounded-2xl border border-[#E6EBDD] bg-white/95 backdrop-blur-sm p-4 shadow-[0_8px_30px_-10px_rgba(27,107,82,0.15)]">
        <div className="flex items-center gap-2">
          {/* Sonar dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className="animate-sonar absolute inline-flex h-full w-full rounded-full"
              style={{ backgroundColor: accent, opacity: 0.6 }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: accent }}
            />
          </span>
          <span className="text-[11px] font-semibold tracking-wide text-[#0F1714]">
            {label}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#0F1714]/75 leading-snug">{title}</p>
        <p className="mt-1 text-sm font-semibold" style={{ color: accent }}>
          {meta}
        </p>
      </div>
    </div>
  );
}