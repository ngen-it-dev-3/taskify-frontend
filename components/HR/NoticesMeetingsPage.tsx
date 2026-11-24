"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Megaphone,
    Calendar,
    Plus,
    X,
    Video,
    MapPin,
    Phone,
    Copy,
    Check,
    Archive,
    RotateCcw,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    CalendarDays,
    ListFilter,
    Sparkles,
    Link2,
    Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import {
    noticesMeetingsApi,
    NoticeRecord,
    NoticeSourceType,
    NoticeBadgeType,
    NoticeFilterType,
    MeetingRecord,
    MeetingType,
    MeetingStatus,
    MeetingRangeFilter,
    MeetingStats,
} from "@/lib/noticesMeetings";

const NOTICE_FILTERS: { id: NoticeFilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "hr", label: "HR Notice" },
    { id: "management", label: "Management Notice" },
    { id: "supervisor", label: "Supervisor Notice" },
];

const MEETING_RANGES: { id: MeetingRangeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "today", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
];

const getBadgeStyle = (badge: NoticeBadgeType) => {
    if (badge === "Warning") {
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (badge === "Announcement") {
        return "bg-sky-50 text-sky-700 border-sky-200";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
};

const getCardBorderAccent = (
    source: NoticeSourceType,
    badge: NoticeBadgeType
) => {
    if (badge === "Warning") return "border-l-4 border-l-rose-600";
    if (source === "Management") return "border-l-4 border-l-amber-600";
    if (source === "Supervisor") return "border-l-4 border-l-slate-700";
    return "border-l-4 border-l-[#5D4037]";
};

const getStatusStyle = (status: MeetingStatus) => {
    if (status === "Confirmed") {
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (status === "Declined") {
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (status === "Completed") {
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
};

const formatShortDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
};

const formatNoticeDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatDateInputValue = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
};

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const getErrorMessage = (error: unknown, fallback: string) => {
    return (
        (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || fallback
    );
};

export default function NoticesMeetingsPage() {
    const { user } = useAuth();

    const [activeSection, setActiveSection] = useState<"notices" | "meetings">(
        "notices"
    );

    // --- Notices State ---
    const [noticeFilter, setNoticeFilter] = useState<NoticeFilterType>("all");
    const [notices, setNotices] = useState<NoticeRecord[]>([]);
    const [loadingNotices, setLoadingNotices] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<NoticeRecord | null>(
        null
    );
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<NoticeRecord | null>(null);
    const [savingNotice, setSavingNotice] = useState(false);
    const [deletingNotice, setDeletingNotice] = useState<NoticeRecord | null>(
        null
    );
    const [busyNoticeId, setBusyNoticeId] = useState<string | null>(null);

    const [noticeForm, setNoticeForm] = useState({
        title: "",
        sourceType: "HR" as NoticeSourceType,
        badgeType: "Notice" as NoticeBadgeType,
        audience: "All Staff",
        department: "All",
        postedByLabel: "",
        expiresAt: "",
        description: "",
    });

    // --- Meetings State ---
    const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
    const [meetingStats, setMeetingStats] = useState<MeetingStats>({
        upcoming7Days: 0,
        pendingRequests: 0,
        today: 0,
        activeVideoLinks: 0,
    });
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
    const [listRangeFilter, setListRangeFilter] =
        useState<MeetingRangeFilter>("all");
    const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);
    const [busyMeetingId, setBusyMeetingId] = useState<string | null>(null);

    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isDirectScheduleMode, setIsDirectScheduleMode] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<MeetingRecord | null>(
        null
    );
    const [deletingMeeting, setDeletingMeeting] = useState<MeetingRecord | null>(
        null
    );
    const [submittingMeeting, setSubmittingMeeting] = useState(false);

    const [meetingForm, setMeetingForm] = useState({
        title: "",
        withAttendees: "",
        type: "Video Call" as MeetingType,
        scheduledDate: "",
        timeSlotLabel: "",
        preferredDateText: "",
        venue: "",
        meetingLink: "",
        status: "Confirmed" as MeetingStatus,
        notes: "",
    });

    const canManage = useMemo(() => {
        const managerRoles = [
            "super_admin",
            "admin",
            "hr_manager",
            "hr",
            "manager",
            "md",
        ];
        const primaryRole = String(user?.role || "")
            .toLowerCase()
            .replace(/\s+/g, "_");
        if (primaryRole && managerRoles.includes(primaryRole)) return true;

        const populatedRoles = Array.isArray(
            (user as { roles?: { code?: string }[] })?.roles
        )
            ? (user as { roles?: { code?: string }[] }).roles!.map((r) =>
                String(r?.code || "").toLowerCase()
            )
            : [];
        return populatedRoles.some((code) => managerRoles.includes(code));
    }, [user]);

    const fetchNotices = useCallback(async () => {
        try {
            setLoadingNotices(true);
            const data = await noticesMeetingsApi.getNotices({
                filter: noticeFilter,
            });
            setNotices(data);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to load notices"));
        } finally {
            setLoadingNotices(false);
        }
    }, [noticeFilter]);

    const fetchMeetings = useCallback(async () => {
        try {
            setLoadingMeetings(true);
            const result = await noticesMeetingsApi.getMeetings({
                range: listRangeFilter,
            });
            setMeetings(result.data);
            setMeetingStats(result.stats);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to load meetings"));
        } finally {
            setLoadingMeetings(false);
        }
    }, [listRangeFilter]);

    useEffect(() => {
        if (activeSection === "notices") {
            fetchNotices();
        } else {
            fetchMeetings();
        }
    }, [activeSection, fetchNotices, fetchMeetings]);

    // --- Notice Handlers ---
    const openCreateNoticeModal = () => {
        setEditingNotice(null);
        setNoticeForm({
            title: "",
            sourceType: "HR",
            badgeType: "Notice",
            audience: "All Staff",
            department: "All",
            postedByLabel: "",
            expiresAt: "",
            description: "",
        });
        setIsNoticeModalOpen(true);
    };

    const openEditNoticeModal = (notice: NoticeRecord, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedNotice(null);
        setEditingNotice(notice);
        setNoticeForm({
            title: notice.title || "",
            sourceType: notice.sourceType || "HR",
            badgeType: notice.badgeType || "Notice",
            audience: notice.audience || "All Staff",
            department: notice.department || "All",
            postedByLabel: notice.postedByLabel || "",
            expiresAt: formatDateInputValue(
                (notice as NoticeRecord & { expiresAt?: string | null }).expiresAt
            ),
            description: notice.description || "",
        });
        setIsNoticeModalOpen(true);
    };

    const handleSaveNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noticeForm.title.trim() || !noticeForm.description.trim()) {
            toast.error("Title and description are required");
            return;
        }

        const payload = {
            title: noticeForm.title.trim(),
            description: noticeForm.description.trim(),
            sourceType: noticeForm.sourceType,
            badgeType: noticeForm.badgeType,
            audience: noticeForm.audience.trim() || "All Staff",
            department: noticeForm.department.trim() || "All",
            postedByLabel: noticeForm.postedByLabel.trim() || undefined,
            expiresAt: noticeForm.expiresAt || null,
        };

        try {
            setSavingNotice(true);
            if (editingNotice) {
                await api.patch(
                    `/notices-meetings/notices/${editingNotice._id}`,
                    payload
                );
                toast.success("Notice updated");
            } else {
                await noticesMeetingsApi.createNotice(payload);
                toast.success("Notice published");
            }

            setIsNoticeModalOpen(false);
            setEditingNotice(null);
            setNoticeForm({
                title: "",
                sourceType: "HR",
                badgeType: "Notice",
                audience: "All Staff",
                department: "All",
                postedByLabel: "",
                expiresAt: "",
                description: "",
            });

            if (!editingNotice && noticeFilter === "archive") {
                setNoticeFilter("all");
            } else {
                await fetchNotices();
            }
        } catch (error: unknown) {
            toast.error(
                getErrorMessage(
                    error,
                    editingNotice ? "Failed to update notice" : "Failed to post notice"
                )
            );
        } finally {
            setSavingNotice(false);
        }
    };

    const handleToggleArchive = async (
        notice: NoticeRecord,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        if (busyNoticeId === notice._id) return;

        try {
            setBusyNoticeId(notice._id);
            await noticesMeetingsApi.toggleArchiveNotice(
                notice._id,
                !notice.isArchived
            );
            toast.success(
                !notice.isArchived ? "Moved to archive" : "Restored to active board"
            );
            if (selectedNotice?._id === notice._id) {
                setSelectedNotice(null);
            }
            await fetchNotices();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to update archive state"));
        } finally {
            setBusyNoticeId(null);
        }
    };

    const handleConfirmDeleteNotice = async () => {
        if (!deletingNotice) return;
        const targetId = deletingNotice._id;

        try {
            setBusyNoticeId(targetId);
            await noticesMeetingsApi.deleteNotice(targetId);
            toast.success("Notice deleted");
            if (selectedNotice?._id === targetId) setSelectedNotice(null);
            setDeletingNotice(null);
            await fetchNotices();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to delete notice"));
        } finally {
            setBusyNoticeId(null);
        }
    };

    // --- Meeting Handlers ---
    const openCreateMeetingModal = (directSchedule: boolean) => {
        setEditingMeeting(null);
        setIsDirectScheduleMode(directSchedule);
        setMeetingForm({
            title: "",
            withAttendees: "",
            type: "Video Call",
            scheduledDate: "",
            timeSlotLabel: "",
            preferredDateText: "",
            venue: "",
            meetingLink: "",
            status: directSchedule && canManage ? "Confirmed" : "Pending Approval",
            notes: "",
        });
        setIsMeetingModalOpen(true);
    };

    const openEditMeetingModal = (meeting: MeetingRecord) => {
        setEditingMeeting(meeting);
        setIsDirectScheduleMode(true);
        setMeetingForm({
            title: meeting.title || "",
            withAttendees: meeting.withAttendees || "",
            type: meeting.type || "Video Call",
            scheduledDate: formatDateInputValue(meeting.scheduledDate),
            timeSlotLabel: meeting.timeSlotLabel || "",
            preferredDateText: meeting.preferredDateText || "",
            venue: meeting.venue || "",
            meetingLink: meeting.meetingLink || "",
            status: meeting.status || "Pending Approval",
            notes: meeting.notes || "",
        });
        setIsMeetingModalOpen(true);
    };

    const handleSaveMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meetingForm.title.trim() || !meetingForm.withAttendees.trim()) {
            toast.error("Title/Purpose and Attendees are required");
            return;
        }

        try {
            setSubmittingMeeting(true);

            if (editingMeeting) {
                await api.patch(
                    `/notices-meetings/meetings/${editingMeeting._id}/status`,
                    {
                        title: meetingForm.title.trim(),
                        withAttendees: meetingForm.withAttendees.trim(),
                        type: meetingForm.type,
                        scheduledDate: meetingForm.scheduledDate || null,
                        timeSlotLabel: meetingForm.timeSlotLabel.trim(),
                        preferredDateText: meetingForm.preferredDateText.trim(),
                        venue:
                            meetingForm.type === "In-Person" ? meetingForm.venue.trim() : "",
                        meetingLink:
                            meetingForm.type === "Video Call"
                                ? meetingForm.meetingLink.trim()
                                : "",
                        status: meetingForm.status,
                        notes: meetingForm.notes.trim(),
                    }
                );
                toast.success("Meeting updated");
            } else {
                await noticesMeetingsApi.createMeeting({
                    title: meetingForm.title.trim(),
                    withAttendees: meetingForm.withAttendees.trim(),
                    type: meetingForm.type,
                    scheduledDate: meetingForm.scheduledDate || null,
                    timeSlotLabel: meetingForm.timeSlotLabel.trim(),
                    preferredDateText: meetingForm.preferredDateText.trim(),
                    venue: meetingForm.venue.trim(),
                    meetingLink: meetingForm.meetingLink.trim(),
                    notes: meetingForm.notes.trim(),
                    directSchedule: isDirectScheduleMode && canManage,
                });
                toast.success(
                    isDirectScheduleMode && canManage
                        ? "Meeting scheduled & confirmed"
                        : "Meeting request submitted"
                );
            }

            setEditingMeeting(null);
            setIsMeetingModalOpen(false);
            await fetchMeetings();
        } catch (error: unknown) {
            toast.error(
                getErrorMessage(
                    error,
                    editingMeeting ? "Failed to update meeting" : "Failed to save meeting"
                )
            );
        } finally {
            setSubmittingMeeting(false);
        }
    };

    const handleMeetingDecision = async (
        id: string,
        status: "Confirmed" | "Declined"
    ) => {
        if (busyMeetingId === id) return;
        try {
            setBusyMeetingId(id);
            await noticesMeetingsApi.updateMeetingStatus(id, { status });
            toast.success(`Meeting ${status.toLowerCase()}`);
            await fetchMeetings();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to update meeting status"));
        } finally {
            setBusyMeetingId(null);
        }
    };

    const handleConfirmDeleteMeeting = async () => {
        if (!deletingMeeting) return;
        const targetId = deletingMeeting._id;

        try {
            setBusyMeetingId(targetId);
            await api.delete(`/notices-meetings/meetings/${targetId}`);
            toast.success("Meeting deleted");
            setDeletingMeeting(null);
            await fetchMeetings();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to delete meeting"));
        } finally {
            setBusyMeetingId(null);
        }
    };

    const handleCopyLink = async (meeting: MeetingRecord) => {
        if (!meeting.meetingLink) return;
        try {
            await navigator.clipboard.writeText(meeting.meetingLink);
            setCopiedMeetingId(meeting._id);
            toast.success("Meeting link copied");
            setTimeout(() => {
                setCopiedMeetingId((prev) => (prev === meeting._id ? null : prev));
            }, 2000);
        } catch {
            toast.error("Could not copy link");
        }
    };

    const calendarDays = useMemo(() => {
        const now = new Date();
        if (calendarMode === "week") {
            return Array.from({ length: 7 }, (_, idx) => {
                return new Date(now.getFullYear(), now.getMonth(), now.getDate() + idx);
            });
        }

        const year = now.getFullYear();
        const month = now.getMonth();
        const totalDays = new Date(year, month + 1, 0).getDate();
        return Array.from(
            { length: totalDays },
            (_, idx) => new Date(year, month, idx + 1)
        );
    }, [calendarMode]);

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#2C3E50]">
            <div className="container mx-auto px-6 sm:px-8 py-8 space-y-6">
                {/* Top Page Header */}
                <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#8D6E63]">
                        HR &amp; Admin
                    </span>
                    <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] mt-1">
                        Notices &amp; Meetings
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Company-wide notices and the meeting / presentation scheduler,
                        together in one place.
                    </p>
                </div>

                {/* Primary Sub-Tabs: Notice Board | Meetings */}
                <div className="border-b border-slate-200 flex items-center gap-7">
                    <button
                        type="button"
                        onClick={() => setActiveSection("notices")}
                        className={`cursor-pointer pb-3 text-sm font-medium relative flex items-center gap-2 transition-colors ${activeSection === "notices"
                            ? "text-[#1A1A1A] font-semibold"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        <Megaphone className="w-4 h-4 text-[#8D6E63]" />
                        <span>Notice Board</span>
                        {activeSection === "notices" && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8D6E63]" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSection("meetings")}
                        className={`cursor-pointer pb-3 text-sm font-medium relative flex items-center gap-2 transition-colors ${activeSection === "meetings"
                            ? "text-[#1A1A1A] font-semibold"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        <Calendar className="w-4 h-4 text-[#8D6E63]" />
                        <span>Meetings</span>
                        {activeSection === "meetings" && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8D6E63]" />
                        )}
                    </button>
                </div>

                {/* ===================================================== */}
                {/* SECTION 1: NOTICE BOARD                               */}
                {/* ===================================================== */}
                {activeSection === "notices" && (
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200/90 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
                            <div className="flex flex-wrap items-center gap-5">
                                {NOTICE_FILTERS.map((item) => {
                                    const active = noticeFilter === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setNoticeFilter(item.id)}
                                            className={`cursor-pointer flex items-center gap-2 text-xs font-medium transition-colors ${active
                                                ? "text-[#1A1A1A] font-semibold"
                                                : "text-slate-600 hover:text-[#1A1A1A]"
                                                }`}
                                        >
                                            <span
                                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${active ? "border-[#8D6E63]" : "border-slate-300"
                                                    }`}
                                            >
                                                {active && (
                                                    <span className="w-2 h-2 rounded-full bg-[#8D6E63]" />
                                                )}
                                            </span>
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}

                                <span className="h-4 w-[1px] bg-slate-200 hidden sm:inline-block" />

                                <button
                                    type="button"
                                    onClick={() => setNoticeFilter("archive")}
                                    className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-colors ${noticeFilter === "archive"
                                        ? "bg-[#8D6E63]/15 text-[#5D4037] border-[#8D6E63]/40 font-semibold"
                                        : "bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200/70"
                                        }`}
                                >
                                    <Archive className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Archive</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={openCreateNoticeModal}
                                className="cursor-pointer px-4 py-2 rounded-md bg-[#8D6E63] hover:bg-[#795548] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Post Notice</span>
                            </button>
                        </div>

                        {loadingNotices ? (
                            <div className="h-52 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 text-sm">
                                <Loader2 className="w-5 h-5 animate-spin text-[#8D6E63]" />
                                <span>Loading notices...</span>
                            </div>
                        ) : notices.length === 0 ? (
                            <div className="h-52 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                                <Megaphone className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm font-medium">
                                    No notices found in this view.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {notices.map((notice) => {
                                    const isBusy = busyNoticeId === notice._id;

                                    return (
                                        <div
                                            key={notice._id}
                                            onClick={() => setSelectedNotice(notice)}
                                            className={`cursor-pointer bg-white border border-slate-200/90 hover:border-[#8D6E63]/50 rounded-xl p-4 shadow-2xs transition-all flex flex-col justify-between gap-3 ${getCardBorderAccent(
                                                notice.sourceType,
                                                notice.badgeType
                                            )}`}
                                        >
                                            <div className="space-y-2.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getBadgeStyle(
                                                            notice.badgeType
                                                        )}`}
                                                    >
                                                        {notice.badgeType}
                                                    </span>

                                                    <div
                                                        className="flex items-center gap-1 shrink-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={(e) => handleToggleArchive(notice, e)}
                                                            className="cursor-pointer px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                                            title={
                                                                notice.isArchived
                                                                    ? "Restore notice"
                                                                    : "Archive notice"
                                                            }
                                                        >
                                                            {notice.isArchived ? (
                                                                <>
                                                                    <RotateCcw className="w-2.5 h-2.5" />
                                                                    <span>Restore</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Archive className="w-2.5 h-2.5 text-amber-600" />
                                                                    <span>Archive</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        {canManage && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={isBusy}
                                                                    onClick={(e) =>
                                                                        openEditNoticeModal(notice, e)
                                                                    }
                                                                    className="cursor-pointer p-1 rounded text-slate-500 hover:text-[#8D6E63] hover:bg-amber-50 transition-colors disabled:opacity-50"
                                                                    title="Edit notice"
                                                                    aria-label={`Edit ${notice.title}`}
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={isBusy}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeletingNotice(notice);
                                                                    }}
                                                                    className="cursor-pointer p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                                                    title="Delete notice"
                                                                    aria-label={`Delete ${notice.title}`}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-[11px] text-slate-400">
                                                    Posted {formatNoticeDate(notice.createdAt)} by{" "}
                                                    {notice.postedByLabel || notice.sourceType}
                                                </p>

                                                <h3 className="text-sm font-bold text-[#1A1A1A] leading-snug line-clamp-2">
                                                    {notice.title}
                                                </h3>

                                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                                    <span className="font-semibold text-slate-700">
                                                        Audience: {notice.audience}.
                                                    </span>{" "}
                                                    {notice.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ===================================================== */}
                {/* SECTION 2: MEETINGS SCHEDULER                         */}
                {/* ===================================================== */}
                {activeSection === "meetings" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                                <p className="text-[11px] font-medium text-slate-500">
                                    Upcoming (7 Days)
                                </p>
                                <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
                                    {meetingStats.upcoming7Days}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Confirmed &amp; pending
                                </p>
                            </div>

                            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                                <p className="text-[11px] font-medium text-slate-500">
                                    Pending Requests
                                </p>
                                <p className="text-2xl font-bold text-amber-700 mt-1">
                                    {meetingStats.pendingRequests}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Awaiting HR decision
                                </p>
                            </div>

                            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                                <p className="text-[11px] font-medium text-slate-500">Today</p>
                                <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
                                    {meetingStats.today}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {formatShortDate(new Date().toISOString())}
                                </p>
                            </div>

                            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                                <p className="text-[11px] font-medium text-slate-500">
                                    Video Call Links Active
                                </p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">
                                    {meetingStats.activeVideoLinks}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Ready to share
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">
                                Anyone can request a meeting or presentation slot. HR/Admin can
                                also fix a meeting directly and share the link once it&apos;s
                                confirmed.
                            </p>
                            <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => openCreateMeetingModal(false)}
                                    className="cursor-pointer px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Request Meeting</span>
                                </button>
                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={() => openCreateMeetingModal(true)}
                                        className="cursor-pointer px-4 py-2 rounded-md bg-[#8D6E63] hover:bg-[#795548] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Schedule Meeting</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5 text-[#8D6E63]" />
                                    <span>
                                        {calendarMode === "week" ? "This Week" : "This Month"}
                                    </span>
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCalendarMode((prev) =>
                                            prev === "week" ? "month" : "week"
                                        )
                                    }
                                    className="cursor-pointer px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors"
                                >
                                    {calendarMode === "week" ? "Month View" : "Week View"}
                                </button>
                            </div>

                            <div
                                className={`grid gap-3 ${calendarMode === "week"
                                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                                    : "grid-cols-2 sm:grid-cols-4 md:grid-cols-7"
                                    }`}
                            >
                                {calendarDays.map((dayDate) => {
                                    const dayMeetings = meetings.filter(
                                        (m) =>
                                            m.scheduledDate &&
                                            m.status !== "Declined" &&
                                            isSameDay(new Date(m.scheduledDate), dayDate)
                                    );
                                    const todayFlag = isSameDay(dayDate, new Date());

                                    return (
                                        <div
                                            key={dayDate.toISOString()}
                                            className={`border rounded-lg p-3 min-h-[96px] flex flex-col justify-between ${todayFlag
                                                ? "border-[#8D6E63]/60 bg-[#8D6E63]/[0.04]"
                                                : "border-slate-200/80 bg-white"
                                                }`}
                                        >
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                                    {dayDate.toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                    })}
                                                </span>
                                                <span className="text-lg font-bold text-[#1A1A1A] leading-none">
                                                    {dayDate.getDate()}
                                                </span>
                                            </div>

                                            <div className="mt-2 space-y-1">
                                                {dayMeetings.length === 0 ? (
                                                    <p className="text-[11px] text-slate-400">
                                                        No meetings scheduled.
                                                    </p>
                                                ) : (
                                                    dayMeetings.slice(0, 3).map((m) => (
                                                        <div
                                                            key={m._id}
                                                            className="text-[11px] text-slate-700 truncate flex items-center gap-1.5"
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#8D6E63] shrink-0" />
                                                            <span className="truncate font-medium">
                                                                {m.title}
                                                            </span>
                                                            {m.timeSlotLabel && (
                                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                                    {m.timeSlotLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                                    <ListFilter className="w-3.5 h-3.5 text-[#8D6E63]" />
                                    <span>All Meetings — List</span>
                                </span>

                                <div className="flex items-center gap-4">
                                    {MEETING_RANGES.map((r) => {
                                        const active = listRangeFilter === r.id;
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setListRangeFilter(r.id)}
                                                className={`cursor-pointer flex items-center gap-1.5 text-xs ${active
                                                    ? "text-[#1A1A1A] font-semibold"
                                                    : "text-slate-500 hover:text-slate-800"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-3 h-3 rounded-full border flex items-center justify-center ${active ? "border-[#8D6E63]" : "border-slate-300"
                                                        }`}
                                                >
                                                    {active && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#8D6E63]" />
                                                    )}
                                                </span>
                                                <span>{r.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {loadingMeetings ? (
                                <div className="h-36 flex items-center justify-center gap-2 text-slate-400 text-sm">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#8D6E63]" />
                                    <span>Loading meetings...</span>
                                </div>
                            ) : meetings.length === 0 ? (
                                <div className="h-36 flex items-center justify-center text-slate-400 text-sm">
                                    No meetings found for this filter.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                <th className="py-2.5 pr-4">Meeting</th>
                                                <th className="py-2.5 px-4">Date / Time</th>
                                                <th className="py-2.5 px-4">Type</th>
                                                <th className="py-2.5 px-4">With</th>
                                                <th className="py-2.5 px-4">Requested By</th>
                                                <th className="py-2.5 px-4">Status</th>
                                                <th className="py-2.5 pl-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {meetings.map((m) => {
                                                const isBusy = busyMeetingId === m._id;
                                                const dateText = m.scheduledDate
                                                    ? `${formatShortDate(m.scheduledDate)}${m.timeSlotLabel ? ` • ${m.timeSlotLabel}` : ""
                                                    }`
                                                    : m.preferredDateText
                                                        ? `Preferred: ${m.preferredDateText}`
                                                        : "TBD";

                                                return (
                                                    <tr
                                                        key={m._id}
                                                        className="hover:bg-[#FDFBF7] transition-colors"
                                                    >
                                                        <td className="py-3.5 pr-4 font-semibold text-[#1A1A1A]">
                                                            {m.title}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                                            {dateText}
                                                        </td>
                                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 text-[11px] font-medium">
                                                                {m.type === "Video Call" && (
                                                                    <Video className="w-3 h-3" />
                                                                )}
                                                                {m.type === "In-Person" && (
                                                                    <MapPin className="w-3 h-3" />
                                                                )}
                                                                {m.type === "Phone Call" && (
                                                                    <Phone className="w-3 h-3" />
                                                                )}
                                                                <span>
                                                                    {m.type === "In-Person" && m.venue
                                                                        ? `${m.type} — ${m.venue}`
                                                                        : m.type}
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600">
                                                            {m.withAttendees}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                                            {m.requestedByName ||
                                                                m.requestedBy?.fullName ||
                                                                "—"}
                                                        </td>
                                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(
                                                                    m.status
                                                                )}`}
                                                            >
                                                                {m.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center justify-end gap-2">
                                                                {m.status === "Pending Approval" &&
                                                                    canManage ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isBusy}
                                                                            onClick={() =>
                                                                                handleMeetingDecision(
                                                                                    m._id,
                                                                                    "Confirmed"
                                                                                )
                                                                            }
                                                                            className="cursor-pointer px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                        >
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            <span>Approve</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isBusy}
                                                                            onClick={() =>
                                                                                handleMeetingDecision(
                                                                                    m._id,
                                                                                    "Declined"
                                                                                )
                                                                            }
                                                                            className="cursor-pointer px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                        >
                                                                            <XCircle className="w-3 h-3" />
                                                                            <span>Decline</span>
                                                                        </button>
                                                                    </>
                                                                ) : m.type === "Video Call" && m.meetingLink ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopyLink(m)}
                                                                        className="cursor-pointer inline-flex items-center gap-1 text-slate-600 hover:text-[#5D4037] font-medium text-[11px]"
                                                                    >
                                                                        {copiedMeetingId === m._id ? (
                                                                            <>
                                                                                <Check className="w-3 h-3 text-emerald-600" />
                                                                                <span className="text-emerald-700">
                                                                                    Copied
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy className="w-3 h-3" />
                                                                                <span>Copy Link</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[11px] text-slate-400">
                                                                        {m.status === "Confirmed"
                                                                            ? "No link needed"
                                                                            : "—"}
                                                                    </span>
                                                                )}

                                                                {canManage && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isBusy}
                                                                            onClick={() => openEditMeetingModal(m)}
                                                                            title="Edit Meeting"
                                                                            aria-label={`Edit ${m.title}`}
                                                                            className="cursor-pointer p-1.5 rounded text-slate-500 hover:text-[#8D6E63] hover:bg-amber-50 transition-colors disabled:opacity-50"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={isBusy}
                                                                            onClick={() => setDeletingMeeting(m)}
                                                                            title="Delete Meeting"
                                                                            aria-label={`Delete ${m.title}`}
                                                                            className="cursor-pointer p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: VIEW NOTICE DETAIL */}
            {selectedNotice && (
                <div
                    className="fixed inset-0 bg-[#1A1A1A]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedNotice(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <span
                                    className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getBadgeStyle(
                                        selectedNotice.badgeType
                                    )}`}
                                >
                                    {selectedNotice.badgeType}
                                </span>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 mr-1">
                                        Posted {formatNoticeDate(selectedNotice.createdAt)} by{" "}
                                        {selectedNotice.postedByLabel || selectedNotice.sourceType}
                                    </span>
                                    {canManage && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openEditNoticeModal(selectedNotice)}
                                                className="cursor-pointer px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-[#8D6E63] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const target = selectedNotice;
                                                    setSelectedNotice(null);
                                                    setDeletingNotice(target);
                                                }}
                                                className="cursor-pointer px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>Delete</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedNotice(null)}
                                        className="cursor-pointer w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">
                                {selectedNotice.title}
                            </h2>

                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                <span className="font-semibold text-[#1A1A1A]">
                                    Audience: {selectedNotice.audience}.
                                </span>{" "}
                                {selectedNotice.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: POST / EDIT NOTICE */}
            {isNoticeModalOpen && (
                <div
                    className="fixed inset-0 bg-[#1A1A1A]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        if (!savingNotice) {
                            setIsNoticeModalOpen(false);
                            setEditingNotice(null);
                        }
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-slate-100 bg-[#FDFBF7] flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#1A1A1A]">
                                    {editingNotice ? "Edit Notice" : "Post New Notice"}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {editingNotice
                                        ? "Update notice details, audience, or badge."
                                        : "Publish an HR, Management, or Supervisor notice."}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={savingNotice}
                                onClick={() => {
                                    setIsNoticeModalOpen(false);
                                    setEditingNotice(null);
                                }}
                                className="cursor-pointer p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNotice} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Notice Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={noticeForm.title}
                                    onChange={(e) =>
                                        setNoticeForm({ ...noticeForm, title: e.target.value })
                                    }
                                    placeholder="e.g., Office Closed — National Holiday"
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Notice Source
                                    </label>
                                    <select
                                        value={noticeForm.sourceType}
                                        onChange={(e) =>
                                            setNoticeForm({
                                                ...noticeForm,
                                                sourceType: e.target.value as NoticeSourceType,
                                            })
                                        }
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    >
                                        <option value="HR">HR Notice</option>
                                        <option value="Management">Management Notice</option>
                                        <option value="Supervisor">Supervisor Notice</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Badge Type
                                    </label>
                                    <select
                                        value={noticeForm.badgeType}
                                        onChange={(e) =>
                                            setNoticeForm({
                                                ...noticeForm,
                                                badgeType: e.target.value as NoticeBadgeType,
                                            })
                                        }
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    >
                                        <option value="Notice">Notice</option>
                                        <option value="Announcement">Announcement</option>
                                        <option value="Warning">Warning</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Audience
                                    </label>
                                    <input
                                        type="text"
                                        value={noticeForm.audience}
                                        onChange={(e) =>
                                            setNoticeForm({ ...noticeForm, audience: e.target.value })
                                        }
                                        placeholder="e.g., All Staff, Sales & Marketing"
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Expires On (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={noticeForm.expiresAt}
                                        onChange={(e) =>
                                            setNoticeForm({
                                                ...noticeForm,
                                                expiresAt: e.target.value,
                                            })
                                        }
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={noticeForm.description}
                                    onChange={(e) =>
                                        setNoticeForm({
                                            ...noticeForm,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Write the full notice details..."
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    disabled={savingNotice}
                                    onClick={() => {
                                        setIsNoticeModalOpen(false);
                                        setEditingNotice(null);
                                    }}
                                    className="cursor-pointer px-4 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingNotice}
                                    className="cursor-pointer px-5 py-2 rounded-md bg-[#8D6E63] hover:bg-[#795548] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {savingNotice && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    )}
                                    <span>
                                        {editingNotice ? "Update Notice" : "Publish Notice"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: DELETE NOTICE CONFIRMATION */}
            {deletingNotice && (
                <div
                    className="fixed inset-0 bg-[#1A1A1A]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        if (!busyNoticeId) setDeletingNotice(null);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <h3 className="text-sm font-bold text-[#1A1A1A]">
                                    Delete Notice?
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Are you sure you want to permanently delete{" "}
                                    <span className="font-semibold text-[#1A1A1A]">
                                        &ldquo;{deletingNotice.title}&rdquo;
                                    </span>
                                    ? This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 text-xs">
                            <button
                                type="button"
                                disabled={Boolean(busyNoticeId)}
                                onClick={() => setDeletingNotice(null)}
                                className="cursor-pointer px-4 py-2 rounded-md border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={Boolean(busyNoticeId)}
                                onClick={handleConfirmDeleteNotice}
                                className="cursor-pointer px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {busyNoticeId && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: REQUEST / SCHEDULE / EDIT MEETING */}
            {isMeetingModalOpen && (
                <div
                    className="fixed inset-0 bg-[#1A1A1A]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        if (!submittingMeeting) {
                            setIsMeetingModalOpen(false);
                            setEditingMeeting(null);
                        }
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#1A1A1A]">
                                    {editingMeeting
                                        ? "Edit Meeting"
                                        : isDirectScheduleMode && canManage
                                            ? "Schedule & Confirm Meeting"
                                            : "Request a Meeting / Presentation"}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {editingMeeting
                                        ? "Modify meeting details, schedule slot, or status."
                                        : isDirectScheduleMode && canManage
                                            ? "Fix a slot directly — it will be marked Confirmed immediately."
                                            : 'HR will review and confirm — you\'ll see it move to "Confirmed" once fixed.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={submittingMeeting}
                                onClick={() => {
                                    setIsMeetingModalOpen(false);
                                    setEditingMeeting(null);
                                }}
                                className="cursor-pointer w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveMeeting}
                            className="p-6 overflow-y-auto space-y-4"
                        >
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Title / Purpose *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={meetingForm.title}
                                    onChange={(e) =>
                                        setMeetingForm({ ...meetingForm, title: e.target.value })
                                    }
                                    placeholder="e.g., Product Demo Presentation — New IoT Line"
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        With / Attendees *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={meetingForm.withAttendees}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                withAttendees: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., HR, CEO & Sales Team"
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={meetingForm.type}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                type: e.target.value as MeetingType,
                                            })
                                        }
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    >
                                        <option value="Video Call">Video Call</option>
                                        <option value="In-Person">In-Person</option>
                                        <option value="Phone Call">Phone Call</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Scheduled / Preferred Date
                                    </label>
                                    <input
                                        type="date"
                                        value={meetingForm.scheduledDate}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                scheduledDate: e.target.value,
                                            })
                                        }
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Time Slot / Preference
                                    </label>
                                    <input
                                        type="text"
                                        value={meetingForm.timeSlotLabel}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                timeSlotLabel: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., 11:30 AM or afternoon"
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    />
                                </div>
                            </div>

                            {editingMeeting && canManage && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={meetingForm.status}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                status: e.target.value as MeetingStatus,
                                            })
                                        }
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    >
                                        <option value="Pending Approval">Pending Approval</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Declined">Declined</option>
                                    </select>
                                </div>
                            )}

                            {meetingForm.type === "In-Person" && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Venue (If In-Person)
                                    </label>
                                    <input
                                        type="text"
                                        value={meetingForm.venue}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                venue: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., Head Office Boardroom, 3rd Floor"
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    />
                                </div>
                            )}

                            {meetingForm.type === "Video Call" && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                                        <Link2 className="w-3 h-3" />
                                        <span>
                                            Meeting Link (Optional — auto-generated on confirm)
                                        </span>
                                    </label>
                                    <input
                                        type="url"
                                        value={meetingForm.meetingLink}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                meetingLink: e.target.value,
                                            })
                                        }
                                        placeholder="https://meet.google.com/... or https://zoom.us/..."
                                        className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Notes / Agenda
                                </label>
                                <textarea
                                    rows={2}
                                    value={meetingForm.notes}
                                    onChange={(e) =>
                                        setMeetingForm({ ...meetingForm, notes: e.target.value })
                                    }
                                    placeholder="Optional — anything HR should know"
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    disabled={submittingMeeting}
                                    onClick={() => {
                                        setIsMeetingModalOpen(false);
                                        setEditingMeeting(null);
                                    }}
                                    className="cursor-pointer px-4 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingMeeting}
                                    className="cursor-pointer px-4 py-2 rounded-md bg-[#8D6E63] hover:bg-[#795548] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {submittingMeeting && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    )}
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>
                                        {editingMeeting
                                            ? "Update Meeting"
                                            : isDirectScheduleMode && canManage
                                                ? "Confirm Schedule"
                                                : "Submit Request"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: DELETE MEETING CONFIRMATION */}
            {deletingMeeting && (
                <div
                    className="fixed inset-0 bg-[#1A1A1A]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        if (!busyMeetingId) setDeletingMeeting(null);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <h3 className="text-sm font-bold text-[#1A1A1A]">
                                    Delete Meeting?
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Are you sure you want to permanently delete{" "}
                                    <span className="font-semibold text-[#1A1A1A]">
                                        &ldquo;{deletingMeeting.title}&rdquo;
                                    </span>
                                    ?
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 text-xs">
                            <button
                                type="button"
                                disabled={Boolean(busyMeetingId)}
                                onClick={() => setDeletingMeeting(null)}
                                className="cursor-pointer px-4 py-2 rounded-md border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={Boolean(busyMeetingId)}
                                onClick={handleConfirmDeleteMeeting}
                                className="cursor-pointer px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {busyMeetingId && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}