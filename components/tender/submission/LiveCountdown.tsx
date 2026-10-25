// components/tender/submission/LiveCountdown.tsx
"use client";

import { useEffect, useState } from "react";

export function LiveCountdown({ deadlineStr }: { deadlineStr?: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
    formattedDate: string;
  } | null>(null);

  useEffect(() => {
    if (!deadlineStr) return;

    // Ensure the date parses correctly
    const targetDate = new Date(deadlineStr).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
          formattedDate: new Date(deadlineStr).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        expired: false,
        formattedDate: new Date(deadlineStr).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
    };

    updateTimer(); // Run immediately
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [deadlineStr]);

  if (!deadlineStr || !timeLeft) {
    return (
      <div className="flex flex-col items-start lg:items-end">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
          <span>Deadline</span>
          <span className="text-slate-900">Not set</span>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="flex flex-col items-start lg:items-end">
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
        <span>Deadline</span>
        <span className="text-slate-900">{timeLeft.formattedDate}</span>
        <span
          className={`rounded border px-1.5 py-0.5 ${
            timeLeft.expired
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-orange-200 bg-orange-50 text-[#a97400]"
          }`}
        >
          {timeLeft.expired
            ? "Expired"
            : `${timeLeft.days}d ${formatNumber(timeLeft.hours)}h ${formatNumber(
                timeLeft.minutes
              )}m ${formatNumber(timeLeft.seconds)}s`}
        </span>
      </div>
      <span className="text-[9px] text-slate-400">time not set - counting to end of day</span>
    </div>
  );
}