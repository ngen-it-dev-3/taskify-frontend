"use client";

import {
  Award,
  Calendar,
  TrendingUp,
  LayoutDashboard,
  Users,
  BarChart3,
  CheckSquare,
  Briefcase,
  UserCheck,
  Building2,
  Crown,
  Shield,
  Sparkles,
  X,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  FileText,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface WelcomeCardProps {
  user: {
    _id?: string;
    fullName: string;
    role: string;
    departmentId?: {
      _id: string;
      name: string;
      code: string;
    };
  } | null;
}

export default function WelcomeCard({ user }: WelcomeCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  const [closeTimestamp, setCloseTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem("welcomeCardVisible");
    const savedCloseTime = localStorage.getItem("welcomeCardCloseTime");

    if (savedState === "false" && savedCloseTime) {
      const closeTime = parseInt(savedCloseTime);
      const currentTime = Date.now();
      const elapsedMinutes = (currentTime - closeTime) / (1000 * 60);

      if (elapsedMinutes >= 5) {
        setIsVisible(true);
        localStorage.setItem("welcomeCardVisible", "true");
        localStorage.removeItem("welcomeCardCloseTime");
      } else {
        setIsVisible(false);
        setCloseTimestamp(closeTime);
      }
    } else {
      setIsVisible(savedState !== "false");
    }
  }, []);

  useEffect(() => {
    if (!isVisible && closeTimestamp) {
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedMinutes = (currentTime - closeTimestamp) / (1000 * 60);
        if (elapsedMinutes >= 5) {
          setIsVisible(true);
          localStorage.setItem("welcomeCardVisible", "true");
          localStorage.removeItem("welcomeCardCloseTime");
          setCloseTimestamp(null);
          clearInterval(interval);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isVisible, closeTimestamp]);

  useEffect(() => {
    const savedState = localStorage.getItem("welcomeCardVisible");
    const savedCloseTime = localStorage.getItem("welcomeCardCloseTime");

    if (savedState === "false" && savedCloseTime) {
      const closeTime = parseInt(savedCloseTime);
      const currentTime = Date.now();
      const elapsedMinutes = (currentTime - closeTime) / (1000 * 60);
      if (elapsedMinutes >= 5) {
        setIsVisible(true);
        localStorage.setItem("welcomeCardVisible", "true");
        localStorage.removeItem("welcomeCardCloseTime");
        setCloseTimestamp(null);
      }
    }
  }, [pathname]);

  const handleClose = () => {
    setIsVisible(false);
    const closeTime = Date.now();
    localStorage.setItem("welcomeCardVisible", "false");
    localStorage.setItem("welcomeCardCloseTime", closeTime.toString());
    setCloseTimestamp(closeTime);
  };

  if (!user) return null;

  // 🎯 Tender user gets the dedicated trial card
  if (user.role === "tender_user") {
    return <TenderUserCard user={user} />;
  }

  // Closed?
  if (!isVisible) return null;

  // ============================================================
  // Role helpers
  // ============================================================
  const getRoleMessage = () => {
    switch (user.role) {
      case "super_admin":
        return "You have full system access. Manage users, departments, and all system settings.";
      case "admin":
        return "You can manage users, departments, and view analytics reports.";
      case "hr_manager":
        return "You can manage employees, attendance, and leaves.";
      case "dept_manager":
        return "You can manage your team tasks and view department reports.";
      case "project_manager":
        return "You can manage project tasks and track project progress.";
      case "line_manager":
        return "You can assign daily tasks and review submissions.";
      case "employee":
        return "You can manage your tasks, track time, and submit work.";
      default:
        return "Welcome to the Task Management System.";
    }
  };

  const getRoleGradient = () => {
    switch (user.role) {
      case "super_admin": return "from-purple-600 via-pink-600 to-rose-600";
      case "admin": return "from-blue-600 via-indigo-600 to-blue-600";
      case "hr_manager": return "from-emerald-500 via-teal-500 to-emerald-500";
      case "dept_manager": return "from-amber-500 via-orange-500 to-amber-500";
      case "project_manager": return "from-cyan-500 via-blue-500 to-cyan-500";
      case "line_manager": return "from-green-500 via-emerald-500 to-green-500";
      case "employee": return "from-indigo-500 via-purple-500 to-indigo-500";
      default: return "from-indigo-500 via-purple-500 to-indigo-500";
    }
  };

  const getRoleEmoji = () => {
    switch (user.role) {
      case "super_admin": return "👑";
      case "admin": return "🛡️";
      case "hr_manager": return "👥";
      case "dept_manager": return "🏢";
      case "project_manager": return "📋";
      case "line_manager": return "👤";
      case "employee": return "💼";
      default: return "⭐";
    }
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case "super_admin": return <Crown className="w-7 h-7 text-white" />;
      case "admin": return <Shield className="w-7 h-7 text-white" />;
      case "hr_manager": return <Users className="w-7 h-7 text-white" />;
      case "dept_manager": return <Building2 className="w-7 h-7 text-white" />;
      case "project_manager": return <Briefcase className="w-7 h-7 text-white" />;
      case "line_manager": return <UserCheck className="w-7 h-7 text-white" />;
      case "employee": return <UserCheck className="w-7 h-7 text-white" />;
      default: return <Award className="w-7 h-7 text-white" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅";
    if (hour < 18) return "☀️";
    return "🌙";
  };

  const getQuickActions = () => {
    const actions: { label: string; href: string; icon: any; color: string }[] = [];
    switch (user.role) {
      case "super_admin":
        actions.push(
          { label: "Users", href: "/users", icon: Users, color: "indigo" },
          { label: "Departments", href: "/departments", icon: Building2, color: "emerald" },
          { label: "Roles", href: "/roles", icon: Shield, color: "purple" },
          { label: "KPI Engine", href: "/kpi/dashboard", icon: BarChart3, color: "amber" },
        );
        break;
      case "admin":
        actions.push(
          { label: "Users", href: "/users", icon: Users, color: "indigo" },
          { label: "Departments", href: "/departments", icon: Building2, color: "emerald" },
          { label: "KPI", href: "/kpi/dashboard", icon: BarChart3, color: "amber" },
        );
        break;
      case "hr_manager":
        actions.push(
          { label: "Employees", href: "/users", icon: Users, color: "indigo" },
          { label: "KPI", href: "/kpi/dashboard", icon: BarChart3, color: "amber" },
          { label: "Reports", href: "/kpi/reports", icon: TrendingUp, color: "purple" },
        );
        break;
      case "dept_manager":
        actions.push(
          { label: "Team Tasks", href: "/tasks/my", icon: CheckSquare, color: "blue" },
          { label: "Department KPIs", href: "/kpi/dashboard", icon: BarChart3, color: "amber" },
        );
        break;
      case "project_manager":
        actions.push(
          { label: "Projects", href: "/projects", icon: Briefcase, color: "cyan" },
          { label: "Tasks", href: "/tasks/my", icon: CheckSquare, color: "blue" },
        );
        break;
      case "line_manager":
        actions.push(
          { label: "Team Tasks", href: "/tasks/my", icon: CheckSquare, color: "blue" },
          { label: "My Tasks", href: "/tasks/my", icon: CheckSquare, color: "emerald" },
        );
        break;
      case "employee":
        actions.push(
          { label: "My Tasks", href: "/tasks/my", icon: CheckSquare, color: "blue" },
          { label: "My KPI", href: "/kpi/dashboard", icon: BarChart3, color: "amber" },
        );
        break;
      default:
        actions.push({
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          color: "slate",
        });
    }
    return actions;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string; border: string }> = {
      indigo: { bg: "bg-indigo-50", text: "text-indigo-700", hover: "hover:bg-indigo-100", border: "border-indigo-200" },
      emerald: { bg: "bg-emerald-50", text: "text-emerald-700", hover: "hover:bg-emerald-100", border: "border-emerald-200" },
      purple: { bg: "bg-purple-50", text: "text-purple-700", hover: "hover:bg-purple-100", border: "border-purple-200" },
      amber: { bg: "bg-amber-50", text: "text-amber-700", hover: "hover:bg-amber-100", border: "border-amber-200" },
      blue: { bg: "bg-blue-50", text: "text-blue-700", hover: "hover:bg-blue-100", border: "border-blue-200" },
      cyan: { bg: "bg-cyan-50", text: "text-cyan-700", hover: "hover:bg-cyan-100", border: "border-cyan-200" },
      slate: { bg: "bg-slate-50", text: "text-slate-700", hover: "hover:bg-slate-100", border: "border-slate-200" },
    };
    return colors[color] || colors.slate;
  };

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ============================================================
  // NON-TENDER-USER CARD (full featured)
  // ============================================================
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-white to-indigo-50/30 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-indigo-500/5 p-6 md:p-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Close */}
        <motion.button
          onClick={handleClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg hover:bg-slate-100/80 transition-all duration-300 text-slate-400 hover:text-slate-700 group"
          aria-label="Close welcome card"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: isHovered ? 50 : 0, y: isHovered ? -30 : 0, scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute -top-32 -right-32 w-96 h-96 bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: isHovered ? -40 : 0, y: isHovered ? 20 : 0, scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-linear-to-tr from-emerald-500/5 to-cyan-500/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-16 h-16 rounded-2xl bg-linear-to-br ${getRoleGradient()} flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 text-white`}
              >
                {getRoleIcon()}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg shadow-emerald-400/30"
                />
              </motion.div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                    {getGreeting()},
                  </h1>
                  <span className="text-xl md:text-2xl font-black bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {user.fullName.split(" ")[0]}
                  </span>
                  <span className="text-2xl">{getGreetingEmoji()}</span>
                </div>
                <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-xl font-medium">
                  {getRoleMessage()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </motion.div>
                <span className="text-xs text-slate-700 font-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/60 shadow-sm">
                <ClockIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-indigo-700 font-mono font-bold">{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border border-indigo-200/60 bg-linear-to-r from-indigo-50/80 to-purple-50/80 text-indigo-900 shadow-sm backdrop-blur-sm"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-2 h-2 rounded-full bg-indigo-600"
              />
              <span>{getRoleEmoji()}</span>
              <span>{user.role.replace(/_/g, " ").toUpperCase()}</span>
              <span className="text-indigo-300">•</span>
              <span className="text-indigo-700 font-semibold">
                {user.departmentId?.name ? user.departmentId.name : "System Unit"}
              </span>
            </motion.div>
          </div>

          {/* Action bar */}
          <div className="mt-6 pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <div className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Welcome To Your Dashboard</span>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getQuickActions().map((action, index) => {
                const colors = getColorClasses(action.color);
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={action.href}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 ${colors.bg} ${colors.text} ${colors.hover} text-xs font-semibold rounded-xl border ${colors.border} transition-all duration-200 shadow-sm`}
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      {action.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// 🎯 TENDER USER CARD
// ============================================================
function TenderUserCard({ user }: { user: NonNullable<WelcomeCardProps["user"]> }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const TRIAL_DAYS = 7;
  const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

  // Robust resolution
  const { trialStartsAt, trialEndsAt } = (() => {
    let end: Date | null = null;
    let start: Date | null = null;

    const u: any = user;
    if (u.trialEndsAt) end = new Date(u.trialEndsAt);
    if (u.trialStartsAt) start = new Date(u.trialStartsAt);

    if (!end || !start) {
      try {
        for (const key of ["orvix_tenant", "tenant"]) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const t = JSON.parse(raw);
          if (!end && t?.trialEndsAt) end = new Date(t.trialEndsAt);
          if (!start && t?.trialStartsAt) start = new Date(t.trialStartsAt);
        }
      } catch { }
    }

    if (end && !start) start = new Date(end.getTime() - TRIAL_MS);
    if (start && !end) end = new Date(start.getTime() + TRIAL_MS);

    return { trialStartsAt: start, trialEndsAt: end };
  })();

  let trialStatus: "active" | "expiring" | "expired" | "unknown" = "unknown";
  let daysLeft = 0, hoursLeft = 0, minutesLeft = 0, secondsLeft = 0;
  let progressPct = 0;

  if (trialEndsAt && trialStartsAt) {
    const diff = trialEndsAt.getTime() - now.getTime();

    if (diff <= 0) {
      trialStatus = "expired";
      progressPct = 100;
    } else {
      const totalSeconds = Math.floor(diff / 1000);
      daysLeft = Math.floor(totalSeconds / 86400);
      hoursLeft = Math.floor((totalSeconds % 86400) / 3600);
      minutesLeft = Math.floor((totalSeconds % 3600) / 60);
      secondsLeft = totalSeconds % 60;

      const realDaysLeft = diff / (1000 * 60 * 60 * 24);
      trialStatus = realDaysLeft <= 2 ? "expiring" : "active";

      const total = trialEndsAt.getTime() - trialStartsAt.getTime();
      const elapsed = now.getTime() - trialStartsAt.getTime();
      progressPct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
  }

  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "—";

  const displayEnd = trialEndsAt
    ? new Date(trialEndsAt.getTime() - 24 * 60 * 60 * 1000)
    : null;

  const startFormatted = fmtDate(trialStartsAt);
  const endFormatted = fmtDate(displayEnd);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const palette = {
    active: {
      bg: "from-emerald-500 to-teal-600",
      soft: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-800",
      label: "Trial Active",
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    expiring: {
      bg: "from-amber-500 to-orange-600",
      soft: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-800",
      label: "Expiring Soon",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    expired: {
      bg: "from-rose-500 to-red-600",
      soft: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      badge: "bg-rose-100 text-rose-800",
      label: "Trial Expired",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    unknown: {
      bg: "from-slate-500 to-slate-600",
      soft: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-800",
      label: "Trial",
      icon: <Zap className="w-3.5 h-3.5" />,
    },
  }[trialStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-emerald-500/5 p-6 md:p-8"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-32 -right-32 w-96 h-96 bg-linear-to-br ${palette.bg} opacity-[0.08] rounded-full blur-3xl`} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-linear-to-tr from-teal-500/5 to-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -3 }}
              className={`relative w-16 h-16 rounded-2xl bg-linear-to-br ${palette.bg} flex items-center justify-center shadow-lg shrink-0 text-white`}
            >
              <FileText className="w-7 h-7" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg"
              />
            </motion.div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">{greeting},</h1>
                <span className="text-xl md:text-2xl font-black bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {user.fullName.split(" ")[0]}
                </span>
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">
                Welcome to your tender workspace. Track your trials, tenders, and submissions here.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-700 font-semibold">
                {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 shadow-sm">
              <ClockIcon className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-mono font-bold">
                {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${palette.badge} ${palette.border}`}>
            {palette.icon}
            {palette.label}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-200/60 bg-indigo-50 text-indigo-700">
            🎯 Tender User
          </span>
          {displayEnd && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500">
              Ends {endFormatted}
            </span>
          )}
        </div>

        {/* Countdown */}
        {trialStartsAt && trialEndsAt && trialStatus !== "expired" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`mt-6 rounded-2xl border ${palette.border} ${palette.soft} p-5`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Your free trial
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Start:</span>{" "}
                  {startFormatted}
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="font-semibold text-slate-700">Ends:</span>{" "}
                  {endFormatted}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <CountdownUnit value={daysLeft} label="Days" palette={palette.text} />
                <span className="text-slate-400 font-bold">:</span>
                <CountdownUnit value={hoursLeft} label="Hrs" palette={palette.text} />
                <span className="text-slate-400 font-bold">:</span>
                <CountdownUnit value={minutesLeft} label="Min" palette={palette.text} />
                <span className="text-slate-400 font-bold">:</span>
                <CountdownUnit value={secondsLeft} label="Sec" palette={palette.text} />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1.5">
                <span>Trial progress</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/70 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full bg-linear-to-r ${palette.bg}`}
                />
              </div>
            </div>
          </motion.div>
        )}

        {trialStatus === "expired" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900">Your trial has expired</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Contact support or upgrade to continue using Orvix Tender.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 pt-5 border-t border-slate-200/60 flex flex-wrap items-center gap-2"
        >
          <Link href="/tenders" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-xl border border-emerald-200 transition-all">
            <FileText className="w-3.5 h-3.5" />
            Tender Overview
          </Link>
          <Link href="/tenders/submissions" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-xl border border-indigo-200 transition-all">
            <CheckSquare className="w-3.5 h-3.5" />
            Submissions
          </Link>
          <Link href="/tenders/security" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold rounded-xl border border-amber-200 transition-all">
            <Shield className="w-3.5 h-3.5" />
            Security
          </Link>
          <Link href="/profile" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl border border-slate-200 transition-all">
            <UserCheck className="w-3.5 h-3.5" />
            My Profile
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------- Countdown helper ---------- */
function CountdownUnit({ value, label, palette }: { value: number; label: string; palette: string }) {
  return (
    <div className="flex flex-col items-center min-w-[46px]">
      <div className="w-full rounded-lg bg-white border border-slate-200/80 px-2 py-1.5 text-center shadow-sm">
        <span className={`text-base font-mono font-bold ${palette}`}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
    </div>
  );
}