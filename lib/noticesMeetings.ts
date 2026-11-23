import api from "@/lib/axios";

export type NoticeSourceType = "HR" | "Management" | "Supervisor";
export type NoticeBadgeType = "Warning" | "Notice" | "Announcement";
export type NoticeFilterType = "all" | "hr" | "management" | "supervisor" | "archive";

export type MeetingType = "Video Call" | "In-Person" | "Phone Call";
export type MeetingStatus = "Pending Approval" | "Confirmed" | "Declined" | "Completed";
export type MeetingRangeFilter = "all" | "today" | "weekly" | "monthly";

export interface NoticeRecord {
    _id: string;
    title: string;
    description: string;
    sourceType: NoticeSourceType;
    badgeType: NoticeBadgeType;
    audience: string;
    department?: string;
    postedByLabel?: string;
    postedBy?: { _id: string; fullName?: string; role?: string };
    isArchived: boolean;
    createdAt: string;
}

export interface CreateNoticePayload {
    title: string;
    description: string;
    sourceType?: NoticeSourceType;
    badgeType?: NoticeBadgeType;
    audience?: string;
    department?: string;
    postedByLabel?: string;
    expiresAt?: string | null;
}

export interface MeetingRecord {
    _id: string;
    title: string;
    withAttendees: string;
    type: MeetingType;
    venue?: string;
    meetingLink?: string;
    notes?: string;
    scheduledDate?: string | null;
    timeSlotLabel?: string;
    preferredDateText?: string;
    status: MeetingStatus;
    requestedByName?: string;
    requestedBy?: { _id: string; fullName?: string };
    createdAt: string;
}

export interface MeetingStats {
    upcoming7Days: number;
    pendingRequests: number;
    today: number;
    activeVideoLinks: number;
}

export interface CreateMeetingPayload {
    title: string;
    withAttendees: string;
    type?: MeetingType;
    scheduledDate?: string | null;
    timeSlotLabel?: string;
    preferredDateText?: string;
    venue?: string;
    meetingLink?: string;
    notes?: string;
    directSchedule?: boolean;
}

const BASE_PATH = "/notices-meetings";

export const noticesMeetingsApi = {
    // --- Notices ---
    async getNotices(params?: { filter?: NoticeFilterType; search?: string }): Promise<NoticeRecord[]> {
        const res = await api.get(`${BASE_PATH}/notices`, { params });
        return res.data?.data || [];
    },

    async createNotice(payload: CreateNoticePayload): Promise<NoticeRecord> {
        const res = await api.post(`${BASE_PATH}/notices`, payload);
        return res.data?.data;
    },

    async toggleArchiveNotice(id: string, isArchived?: boolean): Promise<NoticeRecord> {
        const res = await api.patch(`${BASE_PATH}/notices/${id}/archive`, { isArchived });
        return res.data?.data;
    },

    async deleteNotice(id: string): Promise<void> {
        await api.delete(`${BASE_PATH}/notices/${id}`);
    },

    // --- Meetings ---
    async getMeetings(params?: { range?: MeetingRangeFilter; search?: string }): Promise<{
        data: MeetingRecord[];
        stats: MeetingStats;
    }> {
        const res = await api.get(`${BASE_PATH}/meetings`, { params });
        return {
            data: res.data?.data || [],
            stats: res.data?.stats || {
                upcoming7Days: 0,
                pendingRequests: 0,
                today: 0,
                activeVideoLinks: 0,
            },
        };
    },

    async createMeeting(payload: CreateMeetingPayload): Promise<MeetingRecord> {
        const res = await api.post(`${BASE_PATH}/meetings`, payload);
        return res.data?.data;
    },

    async updateMeetingStatus(
        id: string,
        payload: {
            status: "Confirmed" | "Declined" | "Completed";
            scheduledDate?: string;
            timeSlotLabel?: string;
            meetingLink?: string;
            venue?: string;
        }
    ): Promise<MeetingRecord> {
        const res = await api.patch(`${BASE_PATH}/meetings/${id}/status`, payload);
        return res.data?.data;
    },

    async deleteMeeting(id: string): Promise<void> {
        await api.delete(`${BASE_PATH}/meetings/${id}`);
    },
};