// components/Header.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Flag,
  MessageSquare,
  XCircle,
  Briefcase,
  FileCheck,
  Zap,
  X,
  Loader2,
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  TrendingUp,
  BarChart3,
  Home,
  FolderKanban,
  Award,
  ChevronRight,
  Copy,
  Check,
  ListTodo,
  Sparkles,
  MessageCircle,
  UserPlus,
  LineChart,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "task" | "comment" | "approval" | "system" | "reminder";
  isRead: boolean;
  taskId?: string;
  taskTitle?: string;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  _id: string;
  title: string;
  type: "task" | "project" | "user";
  url: string;
  description?: string;
}

const PROFILE_MENU_ITEMS = [
  { label: "Account Settings", href: "/profile", icon: <Settings size={16} /> },
  { label: "Onboarding", href: "/onboarding", icon: <UserPlus size={16} /> },
  { label: "My Performance", href: "/kpi/dashboard", icon: <LineChart size={16} /> },
  { label: "Notifications", href: "/notifications", icon: <Bell size={16} /> },
  { label: "AI Assistant", href: "/ai-assistant", icon: <Sparkles size={16} />, badge: "New" },
  { label: "Team Chat", href: "/team-chat", icon: <MessageCircle size={16} /> },
];

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isBellBuzzing, setIsBellBuzzing] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const prevUnreadCountRef = useRef(0);
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isNotificationsInitialized = useRef(false);

  const imagePathKey = user?.profilePhoto || "default";
  const imageError = imageErrorMap[imagePathKey] || false;

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSidebarToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.collapsed !== undefined) {
        setSidebarCollapsed(customEvent.detail.collapsed);
      } else {
        const saved = localStorage.getItem("sidebarCollapsed");
        if (saved !== null) setSidebarCollapsed(saved === "true");
      }
    };
    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsBellBuzzing(true);
      const timer = setTimeout(() => setIsBellBuzzing(false), 1500);
      prevUnreadCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const getImageUrl = useCallback((imagePath: string | undefined): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:image/")) return imagePath;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://taskify-server-5gat.onrender.com/api/v1";
    const baseUrl = apiUrl.replace("/api/v1", "");
    const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${baseUrl}${path}?v=${user?._id || Date.now()}`;
  }, [user?._id]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get("/notifications?limit=20");
      if (response.data.success) {
        const formatted = (response.data.data || []).map((notif: any) => ({
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          type: notif.type || "info",
          category: notif.category || "system",
          isRead: notif.isRead || false,
          taskId: notif.taskId,
          taskTitle: notif.taskTitle,
          actionUrl: notif.actionUrl,
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
        }));
        setNotifications(formatted);
        setUnreadCount(formatted.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isNotificationsInitialized.current) {
      isNotificationsInitialized.current = true;
      fetchNotifications();
    }
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Notification deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete notification");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) await markAsRead(notification._id);
    if (notification.actionUrl) router.push(notification.actionUrl);
    else if (notification.taskId) router.push(`/tasks/${notification.taskId}`);
    else if (notification.category === "approval") router.push("/tasks?filter=pending_approval");
    setShowNotifications(false);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      setSearchResults([{ _id: "1", title: `View all results for "${query}"`, type: "task", url: `/tasks?search=${query}` }]);
      setShowSearchResults(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => handleSearch(searchQuery), 500);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    const handleClickOutside = () => setShowSearchResults(false);
    if (showSearchResults) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSearchResults]);

  const getNotificationIcon = (category: string, type: string) => {
    switch (category) {
      case "task": return <CheckCircle size={14} className="text-emerald-500" />;
      case "comment": return <MessageSquare size={14} className="text-blue-500" />;
      case "approval": return <FileCheck size={14} className="text-purple-500" />;
      case "reminder": return <Clock size={14} className="text-amber-500" />;
      case "system": return <Zap size={14} className="text-green-500" />;
      default:
        if (type === "success") return <CheckCircle size={14} className="text-emerald-500" />;
        if (type === "warning") return <AlertCircle size={14} className="text-amber-500" />;
        if (type === "error") return <XCircle size={14} className="text-rose-500" />;
        return <Bell size={14} className="text-green-500" />;
    }
  };

  const getNotificationColor = (category: string, type: string) => {
    if (category === "task") return "bg-emerald-50 border-emerald-200";
    if (category === "comment") return "bg-blue-50 border-blue-200";
    if (category === "approval") return "bg-purple-50 border-purple-200";
    if (category === "reminder") return "bg-amber-50 border-amber-200";
    if (type === "success") return "bg-emerald-50 border-emerald-200";
    if (type === "warning") return "bg-amber-50 border-amber-200";
    if (type === "error") return "bg-rose-50 border-rose-200";
    return "bg-green-50 border-green-200";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPageTitle = () => {
    const path = pathname || "";
    if (path === "/dashboard") return "Dashboard";
    if (path === "/tasks") return "Task Workspace";
    if (path === "/users") return "User Management";
    if (path === "/departments") return "Departments";
    if (path === "/profile") return "My Profile";
    if (path === "/attendance") return "Attendance Records";
    if (path === "/reports") return "Reports & Analytics";
    if (path === "/settings") return "System Settings";
    if (path === "/kpi/dashboard") return "KPI Dashboard";
    return "Workspace";
  };

  const getPageIcon = () => {
    const path = pathname || "";
    if (path === "/dashboard") return <LayoutDashboard size={16} />;
    if (path === "/tasks") return <CheckSquare size={16} />;
    if (path === "/users") return <Users size={16} />;
    if (path === "/settings") return <Settings size={16} />;
    if (path === "/kpi/dashboard") return <TrendingUp size={16} />;
    return <Home size={16} />;
  };

  const profileImageUrl = getImageUrl(user?.profilePhoto);
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (!user) return null;

  return (
    <header
      className={`fixed top-0 right-0 z-40 h-16 transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[left] left-0 ${sidebarCollapsed ? "lg:left-[72px]" : "lg:left-64"}`}
      style={{ backgroundColor: "#ebf2e4" }}
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-black/[0.06]" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="h-full px-4 lg:px-6 flex items-center justify-between relative">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuClick} aria-label="Open navigation menu" className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-black/5">
            <Menu size={20} />
          </button>

          <div className="hidden lg:flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center border border-black/5 text-green-600 shadow-sm">
              {getPageIcon()}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800 tracking-tight">{getPageTitle()}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">{formattedDate}</span>
                <span className="w-1 h-1 rounded-full bg-black/10" />
                <span className="text-[10px] text-slate-500 font-medium">{user?.role?.replace(/_/g, " ").toUpperCase()}</span>
                <span className="w-1 h-1 rounded-full bg-black/10" />
                <span className="text-[10px] text-slate-500 font-mono">{formattedTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Search Results Dropdown */}
        <div className="hidden md:block flex-1 max-w-md mx-4 lg:mx-8">
          <AnimatePresence>
            {showSearchResults && (searchResults.length > 0 || searchQuery.length >= 2) && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-black/5 z-50 overflow-hidden"
              >
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 mx-auto mb-3 flex items-center justify-center">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500">No results found for</p>
                      <p className="text-sm text-slate-800 font-medium">"{searchQuery}"</p>
                    </div>
                  )}
                  {searchResults.map((result, index) => (
                    <motion.div key={result._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                      <Link href={result.url} onClick={() => { setShowSearchResults(false); setSearchQuery(""); }} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-green-50 flex items-center justify-center transition-colors">
                          {result.type === "task" && <CheckCircle size={14} className="text-emerald-600" />}
                          {result.type === "project" && <Briefcase size={14} className="text-blue-600" />}
                          {result.type === "user" && <User size={14} className="text-amber-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate group-hover:text-green-600 transition-colors font-medium">{result.title}</p>
                          {result.description && <p className="text-xs text-slate-400 truncate">{result.description}</p>}
                        </div>
                        <span className="text-[9px] uppercase text-slate-400 tracking-wider px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">{result.type}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(!showSearch)} aria-label="Toggle search" className="md:hidden text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-black/5 transition-colors">
            <Search size={18} />
          </button>

          <Link href="/tasks/my" title="My Tasks" className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm">
            <ListTodo size={15} />
            <span className="hidden sm:inline">Tasks</span>
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileDropdown(false); setIsBellBuzzing(false); }}
              className="relative cursor-pointer text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-xl hover:bg-black/5 group"
            >
              <div className="relative flex items-center justify-center w-5 h-5">
                <Bell size={18} className={`transition-colors duration-200 ${isBellBuzzing ? "text-amber-500 animate-bell-ring" : unreadCount > 0 ? "text-green-600 group-hover:text-green-700" : "text-slate-500 group-hover:text-slate-800"}`} />
                {isBellBuzzing && <span className="absolute inset-0 rounded-full border border-amber-500/60 animate-ping pointer-events-none" />}
              </div>
              {unreadCount > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 min-w-[17px] h-4 px-1 bg-gradient-to-r from-rose-500 to-red-500 rounded-full text-white text-[9px] font-bold tracking-tight flex items-center justify-center shadow-md shadow-rose-500/30 border border-[#ebf2e4] ${isBellBuzzing ? "animate-badge-bounce" : ""}`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-black/5 z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                        <p className="text-[10px] text-slate-500">Stay updated with your tasks</p>
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} disabled={markingAll} className="text-[10px] font-medium text-green-600 hover:text-green-800 transition-colors disabled:opacity-50">
                          {markingAll ? "..." : "Mark all read"}
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {loading ? (
                        <div className="p-8 text-center">
                          <Loader2 className="w-6 h-6 text-green-500 animate-spin mx-auto mb-2" />
                          <p className="text-xs text-slate-400">Loading notifications...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 rounded-full bg-slate-50 mx-auto mb-3 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="text-sm text-slate-500">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <motion.div key={notification._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.isRead ? "bg-green-50/50" : ""}`} onClick={() => handleNotificationClick(notification)}>
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-lg border ${getNotificationColor(notification.category, notification.type)}`}>
                                {getNotificationIcon(notification.category, notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-semibold text-slate-800">{notification.title}</h4>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[9px] text-slate-400 whitespace-nowrap">{formatTime(notification.createdAt)}</span>
                                    <button onClick={(e) => deleteNotification(notification._id, e)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                                {notification.taskTitle && (
                                  <p className="text-[9px] text-green-600 mt-1 flex items-center gap-1 font-medium">
                                    <Flag size={9} />{notification.taskTitle}
                                  </p>
                                )}
                              </div>
                              {!notification.isRead && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1 animate-pulse" />}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                        <Link href="/notifications" className="w-full text-center text-[10px] font-medium text-green-600 hover:text-green-800 transition-colors block" onClick={() => setShowNotifications(false)}>
                          View all notifications
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifications(false); }}
              className="flex items-center cursor-pointer gap-2 text-slate-700 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-black/5"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-green-500 to-purple-600 flex items-center justify-center shadow-md shrink-0 ring-2 ring-white">
                  {profileImageUrl && !imageError ? (
                    <img src={profileImageUrl} alt={user?.fullName || "Profile"} className="w-full h-full object-cover" onError={() => setImageErrorMap(prev => ({ ...prev, [imagePathKey]: true }))} />
                  ) : (
                    <span className="text-white text-xs font-bold">{user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U"}</span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#ebf2e4]" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">{user?.fullName?.split(" ")[0] || "User"}</p>
                <p className="text-[9px] text-slate-500 capitalize truncate max-w-[120px]">{user?.role?.replace(/_/g, " ") || "Employee"}</p>
              </div>
              <ChevronDown size={14} className={`hidden lg:block text-slate-400 transition-transform duration-200 ${showProfileDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-black/5 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-purple-50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-green-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0 ring-2 ring-white">
                            {profileImageUrl && !imageError ? (
                              <img src={profileImageUrl} alt={user?.fullName || "Profile"} className="w-full h-full object-cover" onError={() => setImageErrorMap(prev => ({ ...prev, [imagePathKey]: true }))} />
                            ) : (
                              <span className="text-white text-sm font-bold">{user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U"}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName || "User"}</p>
                          <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <button onClick={() => copyToClipboard(user?.email || "")} className="p-1.5 rounded-lg bg-white/50 hover:bg-white/80 transition-colors shadow-sm" title="Copy email">
                          {showCopySuccess ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    <div className="py-2">
                      {PROFILE_MENU_ITEMS.map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="text-slate-400 group-hover:text-green-600 transition-colors">
                            {item.icon}
                          </div>
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-sm">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}

                      <div className="h-px bg-slate-100 my-1" />

                      <button
                        onClick={() => { setShowProfileDropdown(false); logout(); }}
                        className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors group"
                      >
                        <div className="text-rose-400 group-hover:text-rose-600 transition-colors">
                          <LogOut size={16} />
                        </div>
                        <span className="font-medium">Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="md:hidden border-t border-black/5 bg-[#ebf2e4]">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search tasks, projects, users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-black/5 rounded-lg focus:outline-none focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 text-slate-800 placeholder:text-slate-400 transition-colors shadow-sm" autoFocus />
              </div>
              {searchResults.length > 0 && searchQuery.length >= 2 && (
                <div className="mt-2 bg-white rounded-lg border border-black/5 max-h-60 overflow-y-auto shadow-lg">
                  {searchResults.map((result) => (
                    <Link key={result._id} href={result.url} onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                      {result.type === "task" && <CheckCircle size={14} className="text-emerald-500" />}
                      {result.type === "project" && <Briefcase size={14} className="text-blue-500" />}
                      {result.type === "user" && <User size={14} className="text-amber-500" />}
                      <div className="flex-1">
                        <p className="text-sm text-slate-800 font-medium">{result.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }
        @keyframes bellBuzz { 0%, 100% { transform: rotate(0deg); } 10% { transform: rotate(15deg); } 20% { transform: rotate(-15deg); } 30% { transform: rotate(12deg); } 40% { transform: rotate(-12deg); } 50% { transform: rotate(8deg); } 60% { transform: rotate(-8deg); } 70% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 90% { transform: rotate(2deg); } }
        @keyframes pingRing { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes pingRingDelayed { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } 75% { transform: scale(0.95); } }
        .animate-bell-buzz { animation: bellBuzz 0.8s ease-in-out; }
        .animate-ping-ring { animation: pingRing 0.8s ease-out; }
        .animate-ping-ring-delayed { animation: pingRingDelayed 0.8s ease-out 0.15s; }
        .animate-bounce { animation: bounce 0.4s ease-in-out 2; }
      `}</style>
    </header>
  );
}