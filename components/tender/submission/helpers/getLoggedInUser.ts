// components/tender/submission/helpers/getLoggedInUser.ts
/**
 * Reads the logged-in user's display name from the same storage keys
 * used elsewhere in the app. Falls back to "—".
 */
export function getLoggedInUser(): string {
    if (typeof window === "undefined") return "—";
    try {
        const raw =
            localStorage.getItem("user") ||
            localStorage.getItem("authUser") ||
            localStorage.getItem("currentUser") ||
            sessionStorage.getItem("user") ||
            "";
        if (!raw) return "—";
        const parsed = JSON.parse(raw);
        return (
            parsed?.name ||
            parsed?.fullName ||
            parsed?.username ||
            parsed?.email ||
            "—"
        );
    } catch {
        return "—";
    }
}