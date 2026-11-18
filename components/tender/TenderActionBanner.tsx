"use client";

import { Bell, ShieldAlert, Receipt } from "lucide-react";
import type { ActionItem } from "@/hooks/tender/useTenderOverview";
import Link from "next/link";

interface Props {
  items: ActionItem[];
}

export function TenderActionBanner({ items }: Props) {
  const getIcon = (icon: ActionItem["icon"]) => {
    const cls = "h-4 w-4 shrink-0"; // 👈 shrink-0 added so icon doesn't squish
    switch (icon) {
      case "bell":
        return <Bell className={`${cls} text-orange-400`} />;
      case "shield":
        return <ShieldAlert className={`${cls} text-rose-400`} />;
      case "receipt":
        return <Receipt className={`${cls} text-amber-400`} />;
      default:
        return <Bell className={`${cls} text-orange-400`} />;
    }
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalCount = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 rounded-xl bg-[#0a1f2e] px-6 py-5 text-white">
      {/* Left side: Title */}
      <div className="shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#b8860b]">
          Today · {today}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">
          {totalCount} {totalCount === 1 ? "thing" : "things"} need action today
        </h2>
      </div>

      {/* Right side: Scrollable Pills (Overflow handled) */}
      <div className="flex w-full xl:w-auto items-center gap-3 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="whitespace-nowrap flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm transition hover:bg-white/20 border border-white/5"
          >
            {getIcon(item.icon)}
            <span className="text-xs font-medium text-white/90">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}