// @/lib/menuItems.ts

import {
  LayoutDashboard,
  Users,
  UserCog,
  UserPlus,
  UserX,
  CheckSquare,
  Kanban,
  GanttChart,
  ListTodo,
  ClipboardList,
  ListChecks,
  Calendar,
  CalendarRange,
  FileText,
  FileCheck,
  FileSpreadsheet,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Activity,
  Settings,
  ShieldCheck,
  Network,
  Code2,
  DollarSign,
  Download,
  DownloadCloud,
  Upload,
  HelpCircle,
  LifeBuoy,
  BookOpen,
  GraduationCap,
  CheckCircle,
  HandHelping,
  Building2,
  Clock,
  CalendarDays,
  BarChart4,
  Settings2,
  MessageCircle,
  Newspaper,
  Trophy,
  Globe,
  ShoppingCart,
  FolderOpen,
  FolderKanban,
  Sparkles,
  Wallet,
  Receipt,
  CreditCard,
  FileBarChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type BadgeKey = "notifications" | "pendingLeaves" | "pendingApprovals" | "myTasks" | "messages";

export type UserRole =
  | "super_admin"
  | "admin"
  | "hr_manager"
  | "dept_manager"
  | "project_manager"
  | "line_manager"
  | "employee"
  | "tender_user"
  | "crm_user"
  | "accountant"
  | "all";

export interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  section?: SectionId;
  badge?: string;
  badgeKey?: BadgeKey;
  badgeColor?: string;
  description?: string;
  children?: SubNavItem[];
}

export interface SubNavItem extends Omit<NavItem, "section"> {
  parent: string;
  target?: string;
  rel?: string;
  children?: SubNavItem[];
}

export interface SectionConfig {
  id: SectionId;
  title: string;
  icon: LucideIcon;
  priority: number;
}

export type SectionId = "main" | "crm" | "projects" | "tasks" | "team" | "hr" | "reports" | "system" | "support" | "kpi" | "tender" | "accounts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  HR_MANAGER: "hr_manager",
  DEPT_MANAGER: "dept_manager",
  PROJECT_MANAGER: "project_manager",
  LINE_MANAGER: "line_manager",
  EMPLOYEE: "employee",
  TENDER_USER: "tender_user",
  CRM_USER: "crm_user",
  ACCOUNTANT: "accountant",
  ALL: "all",
} as const;

export const SECTIONS: Record<SectionId, SectionConfig> = {
  main: { id: "main", title: "MAIN MENU", icon: LayoutDashboard, priority: 0 },
  crm: { id: "crm", title: "CRM DASHBOARD", icon: HandHelping, priority: 6 },
  accounts: { id: "accounts", title: "ACCOUNTS & FINANCE", icon: Wallet, priority: 8 },
  projects: { id: "projects", title: "PROJECT MANAGEMENT", icon: FolderKanban, priority: 10 },
  tasks: { id: "tasks", title: "TASK MANAGEMENT", icon: ClipboardList, priority: 20 },
  team: { id: "team", title: "TEAM COLLABORATION", icon: Users, priority: 30 },
  hr: { id: "hr", title: "HUMAN RESOURCES", icon: Users, priority: 40 },
  reports: { id: "reports", title: "REPORTS & ANALYTICS", icon: BarChart4, priority: 50 },
  kpi: { id: "kpi", title: "PERFORMANCE & KPI", icon: Trophy, priority: 55 },
  system: { id: "system", title: "SYSTEM ADMINISTRATION", icon: Settings2, priority: 60 },
  support: { id: "support", title: "HELP & SUPPORT", icon: LifeBuoy, priority: 70 },
  tender: { id: "tender", title: "TENDER MANAGEMENT", icon: FileText, priority: 80 },
};

// ============================================================================
// BUILDERS
// ============================================================================

const createNavItem = (
  id: string, name: string, href: string, icon: LucideIcon, roles: UserRole[],
  options: Partial<Omit<NavItem, "id" | "name" | "href" | "icon" | "roles">> = {},
): NavItem => ({ id, name, href, icon, roles, section: options.section || "main", ...options });

const createSubNavItem = (
  id: string, name: string, href: string, icon: LucideIcon, parent: string, roles: UserRole[],
  options: Partial<Omit<SubNavItem, "id" | "name" | "href" | "icon" | "parent" | "roles">> = {},
): SubNavItem => ({ id, name, href, icon, parent, roles, ...options });

// ============================================================================
// PERSONAL ITEMS
// ============================================================================

export const PERSONAL_ITEMS = {
  dashboard: createNavItem(
    "dashboard", "Dashboard", "/dashboard", LayoutDashboard,
    [ROLES.ALL],
    { section: "main" }
  ),
} as const;

// ============================================================================
// MAIN ITEMS
// ============================================================================

export const MAIN_ITEMS = {
  administration: createNavItem(
    "administration", "Administration", "#", Settings2,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER, ROLES.EMPLOYEE, ROLES.CRM_USER],
    { section: "main", description: "Manage users, roles, tasks, and team settings" }
  ),

  accountsManagement: createNavItem(
    "accounts-management", "Accounts", "/accounts", Wallet,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT],
    { section: "accounts", description: "Manage invoices, expenses, and financials" }
  ),

  // ⭐ REMOVED: kpiManagement is no longer a top-level item

  tenderManagement: createNavItem(
    "tender-management", "Tender Management", "/tenders", FileText,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER],
    { section: "tender", description: "Manage tender processes and submissions" }
  ),

  crmManagement: createNavItem(
    "crm-management", "CRM", "/crm", HandHelping,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER, ROLES.DEPT_MANAGER],
    { section: "crm", description: "Manage contacts, deals, clients, and sales" }
  ),

  humanResources: createNavItem(
    "human-resources", "HR Management", "/hr", Users,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
    { section: "hr", description: "HR management and employee self-service" }
  ),

  system: createNavItem(
    "system", "System Settings", "/settings", Settings2,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { section: "system", description: "System administration and configuration" }
  ),

  support: createNavItem(
    "support", "Help & Support", "/support", LifeBuoy,
    [ROLES.ALL],
    { section: "support", description: "Get help, documentation, and support" }
  ),
} as const;

// ============================================================================
// SUB-NAVIGATION ITEMS
// ============================================================================

export const SUB_ITEMS = {
  // ==========================================================================
  // ADMINISTRATION (Level 2 Folders)
  // ==========================================================================
  adminUserMgmt: createSubNavItem("admin-user-mgmt", "User Management", "/users", Users, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  adminRoles: createSubNavItem("admin-roles", "Roles & Permissions", "/roles", ShieldCheck, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  adminDepts: createSubNavItem("admin-depts", "Departments", "/departments", Building2, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER]),
  adminManagementReport: createSubNavItem("admin-mgmt-report", "Management Report", "/management-report", FileText, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  adminProjects: createSubNavItem("admin-projects", "Projects", "/projects", FolderKanban, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),
  adminReports: createSubNavItem("admin-reports", "Reports", "/reports", BarChart4, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.HR_MANAGER]),
  adminTasks: createSubNavItem("admin-tasks", "Tasks", "/tasks", ClipboardList, "Administration", [ROLES.ALL]),
  adminTeam: createSubNavItem("admin-team", "Team", "/team", Users, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),

  // ⭐ NEW: KPI Dashboard moved here as Level 2
  adminKpi: createSubNavItem("admin-kpi", "KPI Dashboard", "/kpi/dashboard", Trophy, "Administration", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE, ROLES.CRM_USER]),

  // ==========================================================================
  // ACCOUNTS (Level 2 & 3 - Under Main "Accounts")
  // ==========================================================================
  accountsExpenses: createSubNavItem("accounts-expenses", "Expense Management", "/expense", DollarSign, "Accounts", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.HR_MANAGER]),
  accountsOverview: createSubNavItem("accounts-overview", "Financial Overview", "/accounts/overview", LayoutDashboard, "Accounts", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]),
  accountsInvoices: createSubNavItem("accounts-invoices", "Invoices", "/accounts/invoices", Receipt, "Accounts", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]),
  accountsPayments: createSubNavItem("accounts-payments", "Payments", "/accounts/payments", CreditCard, "Accounts", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]),
  accountsReports: createSubNavItem("accounts-reports", "Financial Reports", "/accounts/reports", FileBarChart, "Accounts", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]),

  // ==========================================================================
  // USER MANAGEMENT (Level 3)
  // ==========================================================================
  allUsers: createSubNavItem("all-users", "All Users", "/users/all", Users, "User Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  pendingApprovals: createSubNavItem("pending-approvals", "Pending Approvals", "/users/pending", UserPlus, "User Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER], { badgeKey: "pendingApprovals", badgeColor: "bg-amber-500" }),
  inactiveUsers: createSubNavItem("inactive-users", "Inactive Users", "/users/inactive", UserX, "User Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  bulkImport: createSubNavItem("bulk-import", "Bulk Import", "/users/import", FileSpreadsheet, "User Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  bulkExport: createSubNavItem("bulk-export", "Bulk Export", "/users/export", Download, "User Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),

  // ==========================================================================
  // ROLES & PERMISSIONS (Level 3)
  // ==========================================================================
  allRoles: createSubNavItem("all-roles", "All Roles", "/roles", UserCog, "Roles & Permissions", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  permissions: createSubNavItem("permissions", "Permissions", "/permissions", ShieldCheck, "Roles & Permissions", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),

  // ==========================================================================
  // DEPARTMENTS (Level 3)
  // ==========================================================================
  allDepartments: createSubNavItem("all-departments", "All Departments", "/departments/all", Building2, "Departments", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER]),
  departmentHierarchy: createSubNavItem("department-hierarchy", "Department Hierarchy", "/departments/hierarchy", Network, "Departments", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER]),
  departmentBudgets: createSubNavItem("department-budgets", "Department Budgets", "/departments/budget", DollarSign, "Departments", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER]),

  // ==========================================================================
  // KPI DASHBOARD (Level 3 - Under Administration -> KPI Dashboard)
  // ==========================================================================
  kpiOverview: createSubNavItem("kpi-overview", "KPI Overview", "/kpi/dashboard", LayoutDashboard, "KPI Dashboard", [ROLES.ALL]),
  kpiConfiguration: createSubNavItem("kpi-configuration", "KPI Configuration", "/kpi/management", Settings, "KPI Dashboard", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  kpiLeaderboard: createSubNavItem("kpi-leaderboard", "Leaderboard", "/kpi/leaderboard", Trophy, "KPI Dashboard", [ROLES.ALL]),
  kpiReports: createSubNavItem("kpi-reports", "KPI Reports", "/kpi/reports", FileText, "KPI Dashboard", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  kpiAnalytics: createSubNavItem("kpi-analytics", "KPI Analytics", "/kpi/analytics", BarChart3, "KPI Dashboard", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  kpiTrends: createSubNavItem("kpi-trends", "KPI Trends", "/kpi/trends", TrendingUp, "KPI Dashboard", [ROLES.ALL]),

  // ==========================================================================
  // PROJECTS (Level 3)
  // ==========================================================================
  activeProjects: createSubNavItem("active-projects", "All Active Projects", "/projects/active", FolderOpen, "Projects", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),
  completedProjects: createSubNavItem("completed-projects", "Completed Projects", "/projects/completed", CheckCircle, "Projects", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),

  // ==========================================================================
  // TASKS (Level 3)
  // ==========================================================================
  myTasks: createSubNavItem("my-tasks", "My Tasks", "/tasks/my", CheckSquare, "Tasks", [ROLES.ALL], { badgeKey: "myTasks", badgeColor: "bg-blue-500" }),
  allTasks: createSubNavItem("all-tasks", "All Tasks", "/tasks/tasks-board", ListTodo, "Tasks", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),
  kanbanBoard: createSubNavItem("kanban-board", "Kanban Board", "/tasks/kanban", Kanban, "Tasks", [ROLES.ALL]),
  taskWorkload: createSubNavItem("task-workload", "Task Workload", "/workload", BarChart3, "Tasks", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),
  taskCalendar: createSubNavItem("task-calendar", "Task Calendar", "/tasks/calendar", CalendarDays, "Tasks", [ROLES.ALL]),
  ganttChart: createSubNavItem("gantt-chart", "Gantt Chart", "/tasks/gantt", GanttChart, "Tasks", [ROLES.ALL]),
  bulkUpload: createSubNavItem("bulk-upload", "Bulk Upload", "/tasks/bulk-upload", Upload, "Tasks", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER]),
  timerLog: createSubNavItem("timer-log", "Timer Log", "/tasks/timerlog", Clock, "Tasks", [ROLES.ALL]),

  // ==========================================================================
  // TEAM (Level 3)
  // ==========================================================================
  allTeams: createSubNavItem("all-teams", "All Teams", "/teams/all-teams", Users, "Team", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),
  myTeams: createSubNavItem("my-teams", "My Teams", "/my-teams", Users, "Team", [ROLES.ALL]),
  teamTasks: createSubNavItem("team-tasks", "Team Tasks", "/teams/tasks", ListChecks, "Team", [ROLES.ALL]),
  teamCalendar: createSubNavItem("team-calendar", "Team Calendar", "/teams/calendar", CalendarRange, "Team", [ROLES.ALL]),

  // ==========================================================================
  // REPORTS (Level 3)
  // ==========================================================================
  taskReports: createSubNavItem("task-reports", "Task Reports", "/reports/tasks", CheckSquare, "Reports", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),
  projectReports: createSubNavItem("project-reports", "Project Reports", "/reports/projects", FolderKanban, "Reports", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER]),
  performanceReports: createSubNavItem("performance-reports", "Performance Reports", "/reports/performance", TrendingUp, "Reports", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  financialReports: createSubNavItem("financial-reports", "Financial Reports", "/reports/financial", DollarSign, "Reports", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]),
  exportCenter: createSubNavItem("export-center", "Export Center", "/reports/export", DownloadCloud, "Reports", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),

  // ==========================================================================
  // HR (Level 3)
  // ==========================================================================
  leaveManagement: createSubNavItem("leave-management", "Leave Management", "/hr/leaves", FileCheck, "HR Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER], { badgeKey: "pendingLeaves", badgeColor: "bg-green-500" }),
  myLeaves: createSubNavItem("my-leaves", "My Leaves", "/hr/leaves/my", Calendar, "HR Management", [ROLES.ALL]),
  leaveHistory: createSubNavItem("leave-history", "Leave History", "/hr/leaves/history", Clock, "HR Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER]),
  myAttendance: createSubNavItem("my-attendance", "My Attendance", "/hr/attendance/my", CalendarRange, "HR Management", [ROLES.ALL]),
  employeeDirectory: createSubNavItem("employee-directory", "Employee Directory", "/hr/employees", Users, "HR Management", [ROLES.ALL]),
  attendanceManagement: createSubNavItem("attendance-management", "Attendance Management", "/hr/attendance", Clock, "HR Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  recruitment: createSubNavItem("recruitment", "Recruitment", "/recruitment", UserPlus, "HR Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  employeeOnboarding: createSubNavItem("employee-onboarding", "Employee Onboarding", "/onboarding", HandHelping, "HR Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  trainingPrograms: createSubNavItem("training-programs", "Training Programs", "/training", GraduationCap, "HR Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER]),
  payrollManagement: createSubNavItem("payroll-management", "Payroll Management", "/payroll", DollarSign, "HR Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.ACCOUNTANT]),

  // ==========================================================================
  // SYSTEM SETTINGS (Level 3)
  // ==========================================================================
  generalSettings: createSubNavItem("general-settings", "General Settings", "/settings/general", Settings, "System Settings", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  emailSettings: createSubNavItem("email-settings", "Email Settings", "/settings/email", MessageSquare, "System Settings", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  auditLogs: createSubNavItem("audit-logs", "Audit Logs", "/settings/audit-logs", Activity, "System Settings", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  pricingPlans: createSubNavItem("pricing-plans", "Pricing Plans", "/settings/pricing", DollarSign, "System Settings", [ROLES.SUPER_ADMIN, ROLES.ADMIN]),

  // ==========================================================================
  // HELP & SUPPORT (Level 3)
  // ==========================================================================
  helpCenter: createSubNavItem("help-center", "Help Center", "/help/support", HelpCircle, "Help & Support", [ROLES.ALL]),
  documentation: createSubNavItem("documentation", "Documentation", "https://sajungenitdev.github.io/task-documentation/", BookOpen, "Help & Support", [ROLES.ALL], { target: "_blank", rel: "noopener noreferrer" }),
  featurePage: createSubNavItem("feature-page", "Feature Page", "https://sajungenitdev.github.io/taskify-feature-page/", BookOpen, "Help & Support", [ROLES.ALL], { target: "_blank", rel: "noopener noreferrer" }),
  apiDocs: createSubNavItem("api-docs", "API Documentation", "/help/api-docs", Code2, "Help & Support", [ROLES.ALL]),
  supportTickets: createSubNavItem("support-tickets", "Support Tickets", "/help/support/tickets", LifeBuoy, "Help & Support", [ROLES.ALL]),
  submitFeedback: createSubNavItem("submit-feedback", "Submit Feedback", "/feedback", MessageCircle, "Help & Support", [ROLES.ALL]),
  releaseNotes: createSubNavItem("release-notes", "Release Notes", "/help/changelog", Newspaper, "Help & Support", [ROLES.ALL]),

  // ==========================================================================
  // TENDER MANAGEMENT (Level 3)
  // ==========================================================================
  tenderOverview: createSubNavItem("tender-overview", "Tender Overview", "/tenders", LayoutDashboard, "Tender Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderModules: createSubNavItem("tender-modules", "Tender Modules", "/tenders/manage", Settings, "Tender Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderManage: createSubNavItem("tender-manage", "Manage Tenders", "/tenders/manage", Settings, "Tender Modules", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderSubmissions: createSubNavItem("tender-submissions", "Tender Submissions", "/tenders/submissions", FileText, "Tender Modules", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderSecurity: createSubNavItem("tender-security", "Payment & Security", "/tenders/security", ShieldCheck, "Tender Modules", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderDocuments: createSubNavItem("tender-documents", "Required Documents", "/tenders/documents", FileText, "Tender Modules", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderSites: createSubNavItem("tender-sites", "Site Directory & Credentials", "/tenders/sites", Globe, "Tender Modules", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderClients: createSubNavItem("tender-clients", "Client Management", "/tenders/clients", Users, "Tender Modules", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),
  tenderSettings: createSubNavItem("tender-settings", "Tender Settings", "/tenders/settings", Settings2, "Tender Management", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TENDER_USER]),

  // ==========================================================================
  // CRM (Level 3)
  // ==========================================================================
  crmSalesDashboard: createSubNavItem("crm-sales-dashboard", "Sales Dashboard", "/crm", LayoutDashboard, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmRfqDashboard: createSubNavItem("crm-rfq-dashboard", "RFQ Dashboard", "/crm/rfq", FileText, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmQuotationBuilder: createSubNavItem("crm-quotation-builder", "Quotation Builder", "/crm/quotation-builder", FileText, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmSales: createSubNavItem("crm-sales", "Sales CRM", "/crm/sales-crm", Globe, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmOnline: createSubNavItem("crm-online", "Online CRM", "/crm/online-crm", Globe, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmDirectMarketing: createSubNavItem("crm-direct-marketing", "DMAR", "/crm/direct-marketing", Building2, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmClients: createSubNavItem("crm-clients", "Clients 360", "/crm/client-360", Users, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmSalesOrder: createSubNavItem("crm-sales-order", "Sales Order", "/crm/sales-orders", ShoppingCart, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
  crmSalesLeaderboard: createSubNavItem("crm-sales-leaderboard", "Sales Leaderboard", "/crm/sales-leaderboard", Trophy, "CRM", [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CRM_USER]),
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const hasAccess = (userRole: string, allowedRoles: UserRole[]): boolean => {
  if (allowedRoles.includes(ROLES.ALL)) return true;
  if (userRole === ROLES.SUPER_ADMIN) return true;
  return allowedRoles.includes(userRole as UserRole);
};

export const getPersonalItems = (userRole: string): NavItem[] => {
  return Object.values(PERSONAL_ITEMS).filter((item) => hasAccess(userRole, item.roles));
};

export const getMainItems = (userRole: string): NavItem[] => {
  return Object.values(MAIN_ITEMS).filter((item) => hasAccess(userRole, item.roles));
};

export const getMenuItemsForRole = (userRole: string): NavItem[] => {
  return [...getPersonalItems(userRole), ...getMainItems(userRole)];
};

export const getSubMenuItems = (parentName: string, userRole: string): SubNavItem[] => {
  return Object.values(SUB_ITEMS).filter(
    (item) => item.parent === parentName && hasAccess(userRole, item.roles)
  );
};

export const hasSubMenuItems = (parentName: string, userRole: string): boolean => {
  return getSubMenuItems(parentName, userRole).length > 0;
};

export const getVisibleSections = (userRole: string): SectionId[] => {
  const sections = new Set<SectionId>();
  Object.values(MAIN_ITEMS).forEach((item) => {
    if (hasAccess(userRole, item.roles) && item.section) sections.add(item.section);
  });
  if (userRole === ROLES.EMPLOYEE) sections.add("hr");
  return Array.from(sections);
};

export const getMenuItemsGroupedBySection = (userRole: string): Record<SectionId, NavItem[]> => {
  const grouped: Record<SectionId, NavItem[]> = {} as Record<SectionId, NavItem[]>;
  const items = getMenuItemsForRole(userRole);

  items.forEach((item) => {
    const section = (item.section || "main") as SectionId;
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(item);
  });

  const sorted: Record<SectionId, NavItem[]> = {} as Record<SectionId, NavItem[]>;
  Object.keys(grouped)
    .sort((a, b) => (SECTIONS[a as SectionId]?.priority || 999) - (SECTIONS[b as SectionId]?.priority || 999))
    .forEach((key) => {
      sorted[key as SectionId] = grouped[key as SectionId];
    });

  return sorted;
};

export const getSectionConfig = (sectionId: SectionId): SectionConfig | undefined => {
  return SECTIONS[sectionId];
};

export const hasDynamicBadge = (item: NavItem | SubNavItem): boolean => !!item.badgeKey;
export const hasAnyBadge = (item: NavItem | SubNavItem): boolean => !!(item.badge || item.badgeKey);

export const findNavItem = (id: string): NavItem | undefined => {
  return MAIN_ITEMS[id as keyof typeof MAIN_ITEMS] || PERSONAL_ITEMS[id as keyof typeof PERSONAL_ITEMS];
};

export const findSubNavItem = (id: string): SubNavItem | undefined => {
  return SUB_ITEMS[id as keyof typeof SUB_ITEMS];
};

export const getParentNavItem = (subItem: SubNavItem): NavItem | undefined => {
  return Object.values(MAIN_ITEMS).find((item) => item.name === subItem.parent);
};

export const getSubItemsForParent = (parentName: string): SubNavItem[] => {
  return Object.values(SUB_ITEMS).filter((item) => item.parent === parentName);
};

export const hasAnyMenuItems = (userRole: string): boolean => getMenuItemsForRole(userRole).length > 0;
export const getVisibleItemsCount = (userRole: string): number => getMenuItemsForRole(userRole).length;

export default {
  ROLES, SECTIONS, PERSONAL_ITEMS, MAIN_ITEMS, SUB_ITEMS,
  hasAccess, getPersonalItems, getMainItems, getMenuItemsForRole, getSubMenuItems,
  hasSubMenuItems, getVisibleSections, getMenuItemsGroupedBySection, getSectionConfig,
  hasDynamicBadge, hasAnyBadge, findNavItem, findSubNavItem, getParentNavItem,
  getSubItemsForParent, hasAnyMenuItems, getVisibleItemsCount,
};