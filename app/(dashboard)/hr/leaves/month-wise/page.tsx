// app/hr/leaves/month-wise/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  User,
  Loader2,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface Employee {
  _id: string;
  fullName: string;
  email: string;
  employeeId?: string;
}

interface LeaveRequest {
  _id: string;
  employeeId: any; 
  employeeName?: string; 
  employeeEmail?: string; 
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  casual: "Casual",
  maternity: "Maternity",
  paternity: "Paternity",
  bereavement: "Bereavement",
  unpaid: "Unpaid",
  earned: "Earned",
  other: "Other",
};

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MonthWiseLeavePage() {
  const [users, setUsers] = useState<Employee[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [allLeaveRecords, setAllLeaveRecords] = useState<LeaveRequest[]>([]); 
  const [loadingData, setLoadingData] = useState(false);

  // Fetch Users List
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get("/leaves/substitutes"); 
        if (response.data.success) {
          setUsers(response.data.data || []);
          if (response.data.data?.length > 0) {
            setSelectedEmployeeId(response.data.data[0]._id);
          }
        }
      } catch (error: any) {
        toast.error("Failed to load employee list");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // ⭐ Fetch ALL Data Once
  const fetchAllLeaveData = async () => {
    try {
      setLoadingData(true);
      const response = await api.get("/leaves/all");
      if (response.data.success) {
        setAllLeaveRecords(response.data.data || []);
      }
    } catch (error: any) {
      toast.error("Failed to load leave records");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllLeaveData();
  }, []);

  // ============================================================================
  // FRONTEND FILTERING LOGIC (ObjectId + Email Fallback)
  // ============================================================================

  const filteredRecords = useMemo(() => {
    if (!selectedEmployeeId || allLeaveRecords.length === 0) return [];

    const selectedEmp = users.find(u => String(u._id) === String(selectedEmployeeId));
    if (!selectedEmp) return [];

    const targetId = String(selectedEmployeeId).trim();
    const targetEmail = (selectedEmp.email || "").trim().toLowerCase();
    const targetName = (selectedEmp.fullName || "").trim().toLowerCase();

    return allLeaveRecords.filter((leave) => {
      // ১. এমপ্লয়ি ম্যাচিং (employeeId ObjectId, Email বা Name)
      let leaveEmpId = "";
      if (leave.employeeId && typeof leave.employeeId === 'object') {
        leaveEmpId = leave.employeeId._id || leave.employeeId.id || "";
      } else if (typeof leave.employeeId === 'string') {
        leaveEmpId = leave.employeeId;
      }
      
      const isIdMatch = String(leaveEmpId).trim() === targetId;

      // ২. ইমেইল ম্যাচিং (Fallback)
      const leaveEmail = (leave.employeeEmail || "").trim().toLowerCase();
      const isEmailMatch = leaveEmail && targetEmail && leaveEmail === targetEmail;

      // ৩. নাম ম্যাচিং (Fallback)
      const leaveName = (leave.employeeName || "").trim().toLowerCase();
      const isNameMatch = leaveName && targetName && leaveName === targetName;

      // ⭐ যদি যেকোনো একটি ম্যাচ করে, তবেই ডেটা নিব
      if (!isIdMatch && !isEmailMatch && !isNameMatch) return false;

      // ৪. তারিখ পরিসীমা (Range) ম্যাচিং
      const leaveStart = new Date(leave.startDate);
      leaveStart.setHours(0, 0, 0, 0); 
      
      const leaveEnd = new Date(leave.endDate);
      leaveEnd.setHours(23, 59, 59, 999); 
      
      const monthStart = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

      return (leaveStart <= monthEnd && leaveEnd >= monthStart);
    });
  }, [allLeaveRecords, selectedEmployeeId, selectedMonth, selectedYear, users]);

  // ============================================================================
  // CALENDAR DATA GENERATION
  // ============================================================================

  const calendarData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(selectedYear, selectedMonth, i);
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const leavesOnThisDay = filteredRecords.filter(leave => {
        if (leave.status !== "approved" && leave.status !== "pending") return false; 
        
        const start = new Date(leave.startDate);
        start.setHours(0,0,0,0);
        
        const end = new Date(leave.endDate);
        end.setHours(23,59,59,999);
        
        const current = new Date(currentDate);
        current.setHours(12,0,0,0);
        
        return current >= start && current <= end;
      });

      days.push({
        date: i,
        dateStr,
        isWeekend: currentDate.getDay() === 5 || currentDate.getDay() === 6,
        leaves: leavesOnThisDay
      });
    }

    return days;
  }, [selectedYear, selectedMonth, filteredRecords]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const selectedEmployee = users.find(u => String(u._id) === String(selectedEmployeeId));
  const totalLeavesTaken = filteredRecords
    .filter(l => l.status === 'approved')
    .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4">
          <Link href="/dashboard" className="hover:text-[#A06126] transition">Dashboard</Link>
          <ChevronRightIcon size={12} className="text-gray-300" />
          <Link href="/hr" className="hover:text-[#A06126] transition">HR</Link>
          <ChevronRightIcon size={12} className="text-gray-300" />
          <span className="text-[#A06126]">Month wise Employee Leave</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              Month wise Employee Leave
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View specific employee leave calendar and records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold shadow-sm flex items-center gap-2">
              <Printer className="w-3.5 h-3.5" /> Print Sheet
            </button>
            <button className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold shadow-sm flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Select Employee</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {loadingUsers ? (
                   <div className="pl-9 text-sm text-gray-400 py-2 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading...</div>
                ) : (
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 hover:bg-white focus:ring-1 focus:ring-[#A06126] outline-none"
                  >
                    <option value="" disabled>Select Employee</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.employeeId || 'No ID'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Month & Year</label>
              <div className="flex items-center gap-2">
                <button onClick={handlePrevMonth} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 hover:bg-white focus:ring-1 focus:ring-[#A06126] outline-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 hover:bg-white focus:ring-1 focus:ring-[#A06126] outline-none"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button onClick={handleNextMonth} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary Stat */}
            <div className="flex items-end">
              <div className="w-full bg-[#faf8f4] border border-[#A06126]/20 rounded-md p-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Leaves (Approved)</p>
                  <p className="text-2xl font-serif font-bold text-[#A06126]">{totalLeavesTaken} Days</p>
                </div>
                <Calendar className="w-8 h-8 text-[#A06126]/30" />
              </div>
            </div>

          </div>
        </div>

        {/* Attendance/Leave Sheet Calendar */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Calendar Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
             <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  {selectedEmployee?.fullName || "Employee"}'s Leave Sheet
                </h2>
                <p className="text-xs text-gray-500">
                  {MONTHS[selectedMonth]} {selectedYear}
                </p>
             </div>
             <div className="flex gap-4 text-xs font-medium text-gray-600">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></span> Approved Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300"></span> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white border border-gray-300"></span> Working Day</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300"></span> Weekend</span>
             </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {loadingData ? (
               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#A06126]" />
                  <p>Loading records...</p>
               </div>
            ) : (
              <>
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarData.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="h-28 border border-transparent bg-gray-50/30 rounded-sm" />;
                    }

                    const hasLeave = day.leaves.length > 0;
                    const leave = day.leaves[0]; 

                    return (
                      <div 
                        key={day.dateStr}
                        className={`h-28 border rounded-sm p-2 flex flex-col relative transition-all group
                          ${hasLeave && leave?.status === 'approved' ? 'border-emerald-300 bg-emerald-50/50' : 
                            hasLeave && leave?.status === 'pending' ? 'border-amber-300 bg-amber-50/50' :
                            day.isWeekend ? 'border-gray-200 bg-gray-50' : 
                            'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                      >
                         <span className={`text-xs font-medium ${hasLeave ? 'text-gray-800' : day.isWeekend ? 'text-gray-400' : 'text-gray-600'}`}>
                           {day.date}
                         </span>

                         {/* Leave Badge */}
                         {hasLeave && leave && (
                           <div className="mt-auto">
                              <div className={`text-[10px] font-semibold px-1.5 py-1 rounded truncate border flex items-center gap-1
                                ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                                  'bg-amber-100 text-amber-800 border-amber-200'}
                              `}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                                {leaveTypeLabels[leave.type] || leave.type}
                              </div>
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer / Details List */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Leave Details for {MONTHS[selectedMonth]}</h3>
            {filteredRecords.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No leaves taken this month.</p>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map(record => (
                  <div key={record._id} className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded-md text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusColors[record.status]}`}>
                        {record.status}
                      </span>
                      <span className="font-semibold text-gray-800">{leaveTypeLabels[record.type] || record.type}</span>
                      <span className="text-gray-500 text-xs">
                        ({new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()})
                      </span>
                    </div>
                    <span className="font-medium text-gray-700">{record.totalDays} days</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}