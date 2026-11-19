// app/hr/leaves/components/LeaveEligibilityModal.tsx
"use client";

import React from "react";
import { X, CalendarClock, Info, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaveEligibilityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// লিভের নিয়ম (দিন)
const ACCRUAL_RULES = {
    sick: { label: "Sick Leave", days: 36, max: 10 },
    casual: { label: "Casual Leave", days: 45, max: 8 },
    earned: { label: "Earned Leave", days: 60, max: 6 },
};

export default function LeaveEligibilityModal({ isOpen, onClose }: LeaveEligibilityModalProps) {
    if (!isOpen) return null;

    // ⭐ বর্তমান বছর এবং আজকের তারিখ
    const today = new Date();
    const currentYear = today.getFullYear();

    // ১ জানুয়ারি থেকে আজ পর্যন্ত কত দিন পার হয়েছে
    const startOfYear = new Date(currentYear, 0, 1);
    const daysSinceYearStart = Math.ceil((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));

    // প্রতিটি লিভের জন্য কতগুলো অর্জিত হয়েছে এবং টেবিল ডেটা তৈরি
    const leaveData = Object.entries(ACCRUAL_RULES).map(([key, rule]) => {
        const earnedCount = Math.floor(daysSinceYearStart / rule.days);
        const totalAllowed = Math.min(earnedCount, rule.max);

        // টেবিল ডেটা জেনারেট করা (কোন তারিখে ছুটি পাওয়া যাবে)
        const schedule = [];
        for (let i = 1; i <= rule.max; i++) {
            const daysRequired = rule.days * i;
            const eligibleDate = new Date(currentYear, 0, 1 + daysRequired); // ১ জানুয়ারি + নির্দিষ্ট দিন

            const isEarned = daysSinceYearStart >= daysRequired;

            schedule.push({
                sl: i,
                date: eligibleDate,
                isEarned: isEarned,
            });
        }

        return {
            key,
            label: rule.label,
            totalAllowed,
            max: rule.max,
            schedule,
        };
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#A06126]/10 text-[#A06126] rounded-md">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {currentYear} Leave Eligibility Schedule
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Auto-calculated based on the current year (1 Jan - 31 Dec)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-amber-50 border-b border-amber-100 p-4 flex gap-3 text-amber-800 text-sm">
                        <Info className="w-5 h-5 shrink-0" />
                        <p>
                            So far in the current year (since January 1), a total of <strong>{daysSinceYearStart} days</strong> have passed.
                            See below which leave number has been or will be earned on which date.
                        </p>
                    </div>

                    {/* Modal Body (Table) */}
                    <div className="overflow-y-auto p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {leaveData.map((leave) => (
                                <div key={leave.key} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Card Header */}
                                    <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-800 text-sm">{leave.label}</h3>
                                        <span className="text-xs font-bold bg-[#A06126]/10 text-[#A06126] px-2 py-0.5 rounded">
                                            {leave.totalAllowed} / {leave.max}
                                        </span>
                                    </div>

                                    {/* Table */}
                                    <div className="max-h-[350px] overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white sticky top-0 border-b border-gray-100 text-gray-500">
                                                <tr>
                                                    <th className="px-3 py-2 font-medium">#</th>
                                                    <th className="px-3 py-2 font-medium">Eligible Date</th>
                                                    <th className="px-3 py-2 font-medium text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {leave.schedule.map((row) => (
                                                    <tr key={row.sl} className={row.isEarned ? "bg-emerald-50/40" : "bg-white"}>
                                                        <td className="px-3 py-2 text-gray-500">{row.sl}</td>
                                                        <td className="px-3 py-2 font-medium text-gray-700">
                                                            {row.date.toLocaleDateString("en-GB", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            {row.isEarned ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                                                    <CheckCircle2 className="w-3 h-3" /> Earned
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                                    <Clock className="w-3 h-3" /> Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}