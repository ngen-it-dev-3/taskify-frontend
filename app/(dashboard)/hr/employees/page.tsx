// app/hr/employees/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Building2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  UserCheck,
  UserX,
  Eye,
  LayoutGrid,
  List,
  Crown,
  Shield,
  UserCog,
  User as UserIcon,
  Home,
  ChevronRight,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Employee {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  departmentId?:
  | {
    _id: string;
    name: string;
    code: string;
  }
  | string;
  position?: string;
  phone?: string;
  location?: string;
  bio?: string;
  profilePhoto?: string;
  isActive: boolean;
  joinDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  employeeCount: number;
}

type ViewMode = "grid" | "table";

const roleColors: Record<string, string> = {
  super_admin: "bg-[#FAF8F4] text-[#8B5A2B] border-[#A06126]/35",
  admin: "bg-rose-50 text-rose-700 border-rose-200",
  hr_manager: "bg-amber-50 text-amber-800 border-amber-200",
  dept_manager: "bg-blue-50 text-blue-700 border-blue-200",
  project_manager: "bg-emerald-50 text-[#107E57] border-emerald-200",
  line_manager: "bg-[#FAF8F4] text-[#8B5A2B] border-[#A06126]/25",
  employee: "bg-emerald-50/80 text-[#107E57] border-emerald-200/80",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  hr_manager: "HR Manager",
  dept_manager: "Department Manager",
  project_manager: "Project Manager",
  line_manager: "Line Manager",
  employee: "Employee",
};

const roleIcons: Record<string, any> = {
  super_admin: Crown,
  admin: Shield,
  hr_manager: UserCog,
  dept_manager: Building2,
  project_manager: Briefcase,
  line_manager: UserCheck,
  employee: UserIcon,
};

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "employee",
    departmentId: "",
    position: "",
    phone: "",
    location: "",
    bio: "",
    isActive: true,
  });

  const isHR =
    user?.role === "hr_manager" ||
    user?.role === "admin" ||
    user?.role === "super_admin";

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");

      if (response.data.success) {
        setEmployees(response.data.data || []);
      } else {
        setEmployees(getFallbackEmployees());
        toast.error("Using sample employee data");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          const altResponse = await api.get("/users/users");
          if (altResponse.data.success) {
            setEmployees(altResponse.data.data || []);
            return;
          }
        } catch (altError) {
          console.error("Alternative endpoint also failed:", altError);
        }
      }

      setEmployees(getFallbackEmployees());

      if (error.response?.status === 401) {
        toast.error("Authentication required. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view employees.");
      } else if (error.response?.status === 404) {
        toast.error("Employee API not found. Showing sample data.");
      } else {
        toast.error("Failed to load employees. Showing sample data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments(getFallbackDepartments());
      }
    } catch {
      setDepartments(getFallbackDepartments());
    }
  };

  const getFallbackEmployees = (): Employee[] => {
    const names = [
      "John Doe",
      "Jane Smith",
      "Michael Johnson",
      "Emily Brown",
      "David Wilson",
      "Sarah Martinez",
      "James Anderson",
      "Lisa Taylor",
      "Robert Thomas",
      "Maria Garcia",
    ];
    const roles = [
      "employee",
      "employee",
      "employee",
      "hr_manager",
      "dept_manager",
      "employee",
      "project_manager",
      "employee",
      "line_manager",
      "employee",
    ];
    const depts = [
      "Engineering",
      "Marketing",
      "Sales",
      "HR",
      "Finance",
      "Operations",
      "IT",
      "Support",
    ];

    return names.map((name, index) => ({
      _id: `emp${String(index + 1).padStart(3, "0")}`,
      fullName: name,
      email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
      role: roles[index % roles.length],
      employeeId: `EMP${String(index + 1).padStart(3, "0")}`,
      departmentId: {
        _id: `dept${(index % 4) + 1}`,
        name: depts[index % depts.length],
        code: depts[index % depts.length].substring(0, 3).toUpperCase(),
      },
      position: [
        "Senior Developer",
        "Marketing Manager",
        "Sales Lead",
        "HR Specialist",
        "Finance Analyst",
      ][index % 5],
      phone: `+1 555-${String(100 + index * 2).padStart(3, "0")}-${String(
        1000 + index * 3
      ).padStart(4, "0")}`,
      location: ["New York", "London", "Sydney", "Toronto", "Singapore"][
        index % 5
      ],
      bio: `${name} is a dedicated professional with over ${5 + (index % 10)} years of experience.`,
      isActive: index % 4 !== 0,
      joinDate: new Date(
        Date.now() - (100 + index * 50) * 24 * 60 * 60 * 1000
      ).toISOString(),
      createdAt: new Date(
        Date.now() - (100 + index * 50) * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  const getFallbackDepartments = (): Department[] => {
    return [
      { _id: "dept1", name: "Engineering", code: "ENG", employeeCount: 15 },
      { _id: "dept2", name: "Marketing", code: "MKT", employeeCount: 10 },
      { _id: "dept3", name: "Sales", code: "SAL", employeeCount: 12 },
      { _id: "dept4", name: "HR", code: "HR", employeeCount: 8 },
      { _id: "dept5", name: "Finance", code: "FIN", employeeCount: 6 },
      { _id: "dept6", name: "Operations", code: "OPS", employeeCount: 9 },
      { _id: "dept7", name: "IT", code: "IT", employeeCount: 7 },
      { _id: "dept8", name: "Support", code: "SUP", employeeCount: 5 },
    ];
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const deptValue = formData.departmentId || null;

      const response = await api.post("/auth/admin/create-user", {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        departmentId: deptValue,
        department: deptValue,
        position: formData.position?.trim() || "",
        phone: formData.phone?.trim() || "",
        location: formData.location?.trim() || "",
        bio: formData.bio?.trim() || "",
        isActive: Boolean(formData.isActive),
        password: "Temp@123",
      });

      if (response.data?.success) {
        toast.success("Employee created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (error: any) {
      console.error("Create Employee Error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create employee"
      );
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const deptValue = formData.departmentId || null;
      const payload: Record<string, any> = {
        fullName: formData.fullName.trim(),
        isActive: Boolean(formData.isActive),
        departmentId: deptValue,
        department: deptValue,
        phone: formData.phone?.trim() || "",
        location: formData.location?.trim() || "",
        bio: formData.bio?.trim() || "",
        position: formData.position?.trim() || "",
      };

      const response = await api.put(`/users/${selectedEmployee._id}`, payload);

      if (formData.role !== selectedEmployee.role) {
        await api.put(`/users/${selectedEmployee._id}/role`, {
          role: formData.role,
        });
      }

      if (response.data?.success) {
        toast.success("Employee updated successfully!");
        setShowEditModal(false);
        setSelectedEmployee(null);
        resetForm();
        fetchEmployees();
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const message =
        data?.message ||
        data?.error ||
        error?.message ||
        `Update failed (status: ${status ?? "unknown"})`;

      console.warn("Update Employee Failed:", {
        status,
        message,
        data: data && Object.keys(data).length ? data : String(data),
      });
      toast.error(message);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await api.delete(`/users/${selectedEmployee._id}`);

      if (response.data?.success) {
        toast.success("Employee deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedEmployee(null);
        fetchEmployees();
      }
    } catch (error: any) {
      console.error("Delete Employee Error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete employee"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      role: "employee",
      departmentId: "",
      position: "",
      phone: "",
      location: "",
      bio: "",
      isActive: true,
    });
  };

  const openEditModal = (employee: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent row click
    setSelectedEmployee(employee);

    const rawDept = employee.departmentId || (employee as any).department;

    const deptId =
      typeof rawDept === "object" && rawDept !== null
        ? rawDept._id
        : rawDept || "";

    setFormData({
      fullName: employee.fullName || "",
      email: employee.email || "",
      role: employee.role || "employee",
      departmentId: deptId,
      position: employee.position || "",
      phone: employee.phone || "",
      location: employee.location || "",
      bio: employee.bio || "",
      isActive: Boolean(employee.isActive),
    });
    setShowEditModal(true);
  };

  const openViewModal = (employee: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent row click if clicked on button explicitly
    setSelectedEmployee(employee);
    setShowEmployeeDetail(true);
  };

  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return "?";
    return name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDepartmentName = (emp: any) => {
    if (!emp) return "—";
    if (typeof emp === "string") {
      const found = departments.find((d) => d._id === emp);
      return found?.name || "—";
    }
    const dept = emp.departmentId || emp.department;
    if (!dept) return "—";
    if (typeof dept === "object") return dept.name || "—";
    const found = departments.find((d) => d._id === dept);
    return found?.name || "—";
  };

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return employees.filter((emp) => {
      if (!emp) return false;
      const matchesSearch =
        !q ||
        (emp.fullName || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.employeeId || "").toLowerCase().includes(q) ||
        (emp.position || "").toLowerCase().includes(q);

      const deptId =
        typeof emp.departmentId === "object"
          ? emp.departmentId?._id
          : emp.departmentId;
      const matchesDepartment =
        filterDepartment === "all" || deptId === filterDepartment;

      const matchesRole = filterRole === "all" || emp.role === filterRole;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" ? emp.isActive : !emp.isActive);

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });
  }, [employees, searchTerm, filterDepartment, filterRole, filterStatus]);

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.isActive).length,
      inactive: employees.filter((e) => !e.isActive).length,
      departments: departments.length,
    }),
    [employees, departments]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F6F8F7]">
        <div className="text-center">
          <Loader2 className="w-9 h-9 animate-spin text-[#107E57] mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Loading employees...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F8F7] pb-12">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200/90 pb-4">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2"
            >
              <Link
                href="/dashboard"
                className="hover:text-[#107E57] flex items-center gap-1 transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-gray-400" /> Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <Link href="/hr" className="hover:text-[#107E57] transition-colors">
                HR &amp; Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-[#8B5A2B] font-semibold">Employees</span>
            </nav>

            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#107E57]" />
              Employees Directory
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage and organize workforce profiles, roles, and departments.
            </p>
          </div>

          {isHR && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-lg transition-all text-xs font-semibold shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-4 hover:border-[#107E57]/35 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Employees
              </p>
              <div className="p-1.5 bg-[#FAF8F4] border border-[#A06126]/20 rounded-lg">
                <Users className="w-4 h-4 text-[#8B5A2B]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {stats.total}
            </p>
            <p className="text-[11px] text-[#8B5A2B] font-medium mt-0.5">
              Registered staff
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-4 hover:border-[#107E57]/35 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Active
              </p>
              <div className="p-1.5 bg-emerald-50 border border-emerald-200/70 rounded-lg">
                <UserCheck className="w-4 h-4 text-[#107E57]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#107E57] tabular-nums">
              {stats.active}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Currently active</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-4 hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Inactive
              </p>
              <div className="p-1.5 bg-rose-50 border border-rose-200/70 rounded-lg">
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600 tabular-nums">
              {stats.inactive}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Disabled / on hold</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-4 hover:border-[#A06126]/35 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Departments
              </p>
              <div className="p-1.5 bg-[#FAF8F4] border border-[#A06126]/20 rounded-lg">
                <Building2 className="w-4 h-4 text-[#A06126]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {stats.departments}
            </p>
            <p className="text-[11px] text-[#8B5A2B] font-medium mt-0.5">
              Active units
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex-1 relative min-w-[220px]">
              <Search className="w-4 h-4 text-[#8B5A2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, ID, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-gray-800 placeholder:text-gray-400 w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] bg-[#FAFBFB] hover:bg-white transition-colors text-sm"
              />
            </div>

            <div className="flex gap-2.5 flex-wrap items-center">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                aria-label="Filter by department"
                className="cursor-pointer text-gray-700 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] bg-[#FAFBFB] hover:bg-white transition-colors text-sm min-w-[155px]"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                aria-label="Filter by role"
                className="cursor-pointer text-gray-700 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] bg-[#FAFBFB] hover:bg-white transition-colors text-sm min-w-[140px]"
              >
                <option value="all">All Roles</option>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
                className="cursor-pointer text-gray-700 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#107E57]/25 focus:border-[#107E57] bg-[#FAFBFB] hover:bg-white transition-colors text-sm min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterDepartment("all");
                  setFilterRole("all");
                  setFilterStatus("all");
                  fetchEmployees();
                }}
                title="Reset & Refresh"
                className="cursor-pointer px-3 py-2 text-[#8B5A2B] bg-[#FAF8F4] hover:bg-[#f4efe6] border border-[#A06126]/25 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <div className="flex gap-1 bg-[#FAF8F4] border border-gray-200/80 rounded-lg p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  aria-label="Table View"
                  className={`cursor-pointer p-1.5 rounded-md transition-all ${viewMode === "table"
                    ? "bg-[#107E57] text-white shadow-2xs"
                    : "text-gray-500 hover:text-[#8B5A2B]"
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid View"
                  className={`cursor-pointer p-1.5 rounded-md transition-all ${viewMode === "grid"
                    ? "bg-[#107E57] text-white shadow-2xs"
                    : "text-gray-500 hover:text-[#8B5A2B]"
                    }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Display */}
        {filteredEmployees.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEmployees.map((employee) => {
                const RoleIcon = roleIcons[employee.role] || UserIcon;
                const roleColor =
                  roleColors[employee.role] ||
                  "bg-gray-100 text-gray-700 border-gray-200";
                const isCurrentUser = employee._id === user?._id;

                return (
                  <div
                    key={employee._id}
                    onClick={() => openViewModal(employee)}
                    className="bg-white rounded-xl shadow-2xs border border-gray-200/80 hover:shadow-md hover:border-[#107E57]/35 transition-all p-4 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-[#107E57] flex items-center justify-center text-white text-xs font-bold">
                              {getInitials(employee.fullName)}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${employee.isActive
                                ? "bg-emerald-500"
                                : "bg-gray-400"
                                }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1.5">
                              <span className="truncate">
                                {employee.fullName}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-emerald-50 text-[#107E57] border border-emerald-200 px-1.5 py-0.2 rounded-full shrink-0">
                                  You
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border inline-flex items-center gap-1 shrink-0 ${roleColor}`}
                        >
                          <RoleIcon className="w-2.5 h-2.5" />
                          {roleLabels[employee.role] || employee.role}
                        </span>
                      </div>

                      {employee.position && (
                        <p className="mt-3 text-xs font-medium text-[#8B5A2B] flex items-center gap-1.5 truncate">
                          <Briefcase className="w-3.5 h-3.5 text-[#A06126] shrink-0" />
                          {employee.position}
                        </p>
                      )}

                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-gray-600">
                        {employee.employeeId && (
                          <span className="bg-[#FAF8F4] border border-gray-200/70 px-2 py-0.5 rounded-md font-medium">
                            ID: {employee.employeeId}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 bg-[#FAF8F4] border border-gray-200/70 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3 text-[#8B5A2B]" />
                          {getDepartmentName(employee)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => openViewModal(employee, e)}
                        className="cursor-pointer flex-1 px-2.5 py-1.5 text-xs font-semibold text-[#107E57] hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Profile
                      </button>
                      {isHR && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => openEditModal(employee, e)}
                            title="Edit Employee"
                            className="cursor-pointer p-1.5 text-gray-400 hover:text-[#8B5A2B] hover:bg-[#FAF8F4] rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(employee);
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete Employee"
                            className="cursor-pointer p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAF8F4] border-b border-gray-200/80">
                      {[
                        "Employee",
                        "Department",
                        "Role",
                        "Status",
                        "Join Date",
                        "Actions",
                      ].map((heading, idx) => (
                        <th
                          key={heading}
                          className={`px-3.5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${idx === 5 ? "text-right" : "text-left"
                            }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEmployees.map((employee) => {
                      const RoleIcon = roleIcons[employee.role] || UserIcon;
                      const roleColor =
                        roleColors[employee.role] ||
                        "bg-gray-100 text-gray-700 border-gray-200";
                      const isCurrentUser = employee._id === user?._id;

                      return (
                        <tr
                          key={employee._id}
                          onClick={() => openViewModal(employee)}
                          className="hover:bg-[#FAF8F4]/75 transition-colors cursor-pointer group"
                        >
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#107E57] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                {getInitials(employee.fullName)}
                              </div>
                              <div className="leading-tight min-w-0">
                                <p className="font-semibold text-gray-900 text-xs sm:text-[13px] flex items-center gap-1.5 whitespace-nowrap">
                                  <span>{employee.fullName}</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-emerald-50 text-[#107E57] border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate max-w-[210px]">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3.5 py-2 leading-tight whitespace-nowrap">
                            <p className="text-xs font-medium text-gray-700">
                              {getDepartmentName(employee)}
                            </p>
                            {employee.position && (
                              <p className="text-[10px] text-[#8B5A2B]/80">
                                {employee.position}
                              </p>
                            )}
                          </td>

                          <td className="px-3.5 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${roleColor}`}
                            >
                              <RoleIcon className="w-2.5 h-2.5" />
                              {roleLabels[employee.role] || employee.role}
                            </span>
                          </td>

                          <td className="px-3.5 py-2 whitespace-nowrap">
                            {employee.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border bg-emerald-50 text-[#107E57] border-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-3.5 py-2 text-xs text-gray-600 whitespace-nowrap tabular-nums">
                            {formatDate(employee.joinDate || employee.createdAt)}
                          </td>

                          <td className="px-3.5 py-2 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {isHR && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => openEditModal(employee, e)}
                                    title="Edit Employee"
                                    className="cursor-pointer p-1 text-gray-400 hover:text-[#8B5A2B] hover:bg-[#FAF8F4] rounded-md transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEmployee(employee);
                                      setShowDeleteConfirm(true);
                                    }}
                                    title="Delete Employee"
                                    className="cursor-pointer p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
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

              <div className="bg-[#FAF8F4]/70 border-t border-gray-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing <b className="text-gray-800">{filteredEmployees.length}</b> of{" "}
                  <b className="text-gray-800">{employees.length}</b> employees
                </span>
                <span className="text-[11px] text-[#8B5A2B] font-medium">
                  Orvix Enterprise • Workforce Directory
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="w-12 h-12 bg-[#FAF8F4] border border-[#A06126]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-[#8B5A2B]/60" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              No employees found
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* MODERN EMPLOYEE DETAIL MODAL              */}
      {/* ========================================= */}
      {showEmployeeDetail && selectedEmployee && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowEmployeeDetail(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Cover */}
            <div className="relative">
              <div className="h-24 bg-gradient-to-r from-[#107E57] to-[#0D6848]" />
              <button
                type="button"
                onClick={() => setShowEmployeeDetail(false)}
                className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-6 pb-4 relative flex flex-col items-center -mt-10">
                <div className="w-20 h-20 rounded-full bg-white p-1 shadow-md shrink-0">
                  <div className="w-full h-full rounded-full bg-[#FAF8F4] text-[#107E57] flex items-center justify-center font-bold text-2xl border border-[#A06126]/20">
                    {getInitials(selectedEmployee.fullName)}
                  </div>
                </div>

                <div className="text-center mt-3">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {selectedEmployee.fullName}
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-0.5">
                    {selectedEmployee.position ||
                      roleLabels[selectedEmployee.role] ||
                      "Employee"}
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${roleColors[selectedEmployee.role] ||
                        "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                    >
                      {roleLabels[selectedEmployee.role] || selectedEmployee.role}
                    </span>
                    {selectedEmployee.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border bg-emerald-50 text-[#107E57] border-emerald-200 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border bg-rose-50 text-rose-700 border-rose-200 uppercase tracking-wider">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Body Details */}
            <div className="px-6 py-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAFBFB] border border-gray-100 p-3 rounded-xl flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Employee ID
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {selectedEmployee.employeeId || "—"}
                  </span>
                </div>

                <div className="bg-[#FAFBFB] border border-gray-100 p-3 rounded-xl flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Department
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {getDepartmentName(selectedEmployee)}
                  </span>
                </div>

                <div className="col-span-2 bg-[#FAFBFB] border border-gray-100 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedEmployee.email}
                    </span>
                  </div>
                </div>

                {selectedEmployee.phone && (
                  <div className="col-span-2 bg-[#FAFBFB] border border-gray-100 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {selectedEmployee.phone}
                      </span>
                    </div>
                  </div>
                )}

                {selectedEmployee.location && (
                  <div className="col-span-2 bg-[#FAFBFB] border border-gray-100 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {selectedEmployee.location}
                      </span>
                    </div>
                  </div>
                )}

                <div className="col-span-2 bg-[#FAFBFB] border border-gray-100 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Joined {formatDate(selectedEmployee.joinDate || selectedEmployee.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEmployee.bio && (
                <div className="pt-1">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" /> About
                  </p>
                  <p className="text-xs text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                    {selectedEmployee.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowEmployeeDetail(false)}
                className="cursor-pointer px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
              >
                Close
              </button>
              {isHR && (
                <button
                  type="button"
                  onClick={(e) => {
                    setShowEmployeeDetail(false);
                    openEditModal(selectedEmployee, e);
                  }}
                  className="cursor-pointer px-5 py-2 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Edit className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && selectedEmployee && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 max-w-sm w-full p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">
              Delete Employee
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to remove{" "}
              <b className="text-gray-900">{selectedEmployee.fullName}</b>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="cursor-pointer px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                className="cursor-pointer px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {(showCreateModal || showEditModal) && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#FAF8F4] to-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {showEditModal ? (
                    <>
                      <Edit className="w-5 h-5 text-[#8B5A2B]" />
                      Edit Employee Profile
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-[#107E57]" />
                      Add New Employee
                    </>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {showEditModal
                    ? "Update employee details, role and department information."
                    : "Create a new workforce profile for your organization."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              id="employee-form"
              onSubmit={showEditModal ? handleUpdateEmployee : handleCreateEmployee}
              className="flex-1 overflow-y-auto max-h-[65vh] p-6 space-y-5 custom-scrollbar"
            >
              {/* Personal Information Group */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] transition-all text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@company.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] transition-all text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] transition-all text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., New York, USA"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] transition-all text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Details Group */}
              <div className="space-y-4 pt-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                  Professional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] text-sm text-gray-800 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_16px_center] bg-no-repeat pr-10"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] text-sm text-gray-800 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_16px_center] bg-no-repeat pr-10"
                    >
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                      Position / Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107E57]/20 focus:border-[#107E57] transition-all text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Account Status Group */}
              <div className="pt-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-4">
                  Account Status
                </h3>

                <div className="flex items-center gap-3 p-4 bg-[#FAF8F4] border border-[#A06126]/15 rounded-xl">
                  <input
                    id="emp-active"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-[#107E57] focus:ring-[#107E57] cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="emp-active" className="text-sm font-semibold text-gray-800 cursor-pointer">
                      Active Employee Account
                    </label>
                    <span className="text-[11px] text-gray-500">
                      {formData.isActive
                        ? "Employee can access the system and submit requests."
                        : "Employee account is disabled and cannot log in."}
                    </span>
                  </div>
                </div>
              </div>
            </form>

            {/* Sticky Footer Actions */}
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:border-gray-400 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="employee-form"
                className="px-6 py-2.5 bg-[#107E57] hover:bg-[#0D6848] text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-900/10 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                {showEditModal ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Employee
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}