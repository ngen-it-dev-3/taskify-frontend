// components/tender/security/PaymentHistoryModal.tsx
"use client";

import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: any;
}

// Helper to format the image URL (supports http, base64, and relative paths)
function getImageUrl(imagePath: string | undefined): string | null {
    if (!imagePath) return null;

    // If it's already a full URL or base64, use it directly
    if (imagePath.startsWith("data:image/") || imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    // Otherwise, construct the full backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const baseUrl = apiUrl.replace("/api/v1", "");
    const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    // Add cache buster so the image updates instantly if changed
    const cacheBuster = Date.now();
    return `${baseUrl}${path}?v=${cacheBuster}`;
}

function UserAvatar({
    name,
    userId,
    photoUrl
}: {
    name: string;
    userId?: string;
    photoUrl?: string
}) {
    const { user } = useAuth(); // ✅ Get the currently logged-in user

    // Logic: 
    // 1. If the payment was made by the CURRENT user, use their fresh profile photo.
    // 2. Otherwise, use the photoUrl saved with the payment (if it's not a giant base64).
    let resolvedPhoto = photoUrl;

    if (user && userId && userId === user._id) {
        resolvedPhoto = user.profilePhoto;
    }

    const resolvedUrl = getImageUrl(resolvedPhoto);

    // Render image if we have a valid URL
    if (resolvedUrl) {
        return (
            <div className="flex items-center gap-2">
                <img
                    src={resolvedUrl}
                    alt={name || "User"}
                    className="h-6 w-6 shrink-0 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                        // If image fails to load, swap it for the initials fallback
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallback = (e.target as HTMLImageElement).nextElementSibling;
                        if (fallback) {
                            (fallback as HTMLElement).style.display = "flex";
                        }
                    }}
                />
                {/* Fallback Initials (hidden by default) */}
                <div className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">
                    {name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-slate-600 font-medium">{name || "System"}</span>
            </div>
        );
    }

    // Fallback if no photo URL is available at all
    return (
        <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">
                {name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-slate-600 font-medium">{name || "System"}</span>
        </div>
    );
}

export function PaymentHistoryModal({ open, onOpenChange, row }: Props) {
    if (!open || !row) return null;

    // Map the history. If there are no saved payments, fallback to the initial received amount.
    const history = row.payments?.length
        ? row.payments
        : row.receivedAmount > 0
            ? [{
                date: row.invoiceDate || new Date().toISOString(),
                amount: row.receivedAmount,
                mode: "Bank transfer",
                reference: row.invoiceNo || "—",
                enteredBy: row.recordedBy || "System",
                enteredById: row.createdBy || null,
            }]
            : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl relative overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 relative">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <h2 className="font-serif text-xl font-bold text-slate-900">Payment history</h2>
                    <p className="mt-1 text-xs text-slate-500">{row.clientDescription}</p>
                </div>

                {/* Table */}
                <div className="p-6 bg-slate-50">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Mode</th>
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Entered by</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                            No payments recorded yet.
                                        </td>
                                    </tr>
                                )}
                                {history.map((p: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-600 font-medium">
                                            {new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                            ৳{Number(p.amount).toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{p.mode}</td>
                                        <td className="px-4 py-3 font-mono text-slate-500">{p.reference || "—"}</td>
                                        <td className="px-4 py-3">
                                            <UserAvatar
                                                name={p.enteredBy}
                                                userId={p.enteredById}
                                                photoUrl={p.enteredByPhoto}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}