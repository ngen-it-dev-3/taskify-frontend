"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    FileText, Upload, Trash2, Calendar, Award, BookOpen, ShieldCheck,
    Loader2, Plus, X, User, ChevronDown, File, Image as ImageIcon,
    FileSpreadsheet, Search, CheckCircle2, ShieldAlert, BadgeCheck, Tag,
    Download, Eye, ArrowRight, MoreHorizontal, Filter
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// --- Interfaces ---
interface FileRecord {
    _id: string; title: string; category: string; documentNumber?: string;
    fileUrl: string; fileType: string; fileSize?: number; issueDate: string;
    expiryDate?: string; isVerified: boolean; tags?: string[]; description?: string;
    notes?: string;
    verifiedBy?: { fullName: string };
}
interface Employee { _id: string; fullName: string; employeeId?: string; }

const TABS = [
    { id: "documents", label: "Documents", icon: FileText },
    { id: "cv", label: "CV / Resume", icon: User },
    { id: "bluebook", label: "Blue Book", icon: BookOpen },
    { id: "analysis", label: "360 Analysis", icon: ShieldCheck },
    { id: "evaluation", label: "Pre-Evaluation", icon: Award },
];

const CATEGORY_OPTIONS = [
    "CV / Resume", "Certification", "Award", "Document", "Blue Book",
    "360 Analysis", "Pre-Evaluation", "NDA", "Passport", "Other"
];

// Helper to get icon based on MIME type
const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes("pdf")) return <FileText className="w-5 h-5 text-[#8D6E63]" />;
    if (mimeType?.includes("image")) return <ImageIcon className="w-5 h-5 text-emerald-600" />;
    if (mimeType?.includes("sheet") || mimeType?.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-slate-500" />;
};

const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    const k = 1024, sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function EmployeeFilePage() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Data States
    const [activeTab, setActiveTab] = useState("documents");
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [allFiles, setAllFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Employee States
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Modal States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [viewingFile, setViewingFile] = useState<FileRecord | null>(null);

    // Upload Form State
    const [uploading, setUploading] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("Document");
    const [customCategory, setCustomCategory] = useState("");
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [newExpiryDate, setNewExpiryDate] = useState("");
    const [newDocNumber, setNewDocNumber] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newTags, setNewTags] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Role Check
    const canSelectEmployee = useMemo(() => {
        const allowedRoles = ["super_admin", "admin", "hr_manager", "manager", "hr"];
        const userRole = String(user?.role || "").toLowerCase().replace(/\s+/g, '_');
        return Boolean(userRole && allowedRoles.includes(userRole));
    }, [user?.role]);

    useEffect(() => {
        if (!canSelectEmployee) {
            if (user?._id) setSelectedEmployeeId(String(user._id));
            return;
        }
        const fetchEmployees = async () => {
            try {
                setLoadingEmployees(true);
                const res = await api.get("/leaves/substitutes");
                if (res.data.success) {
                    const list = res.data.data || [];
                    setEmployees(list);
                    if (list.length > 0 && !selectedEmployeeId) setSelectedEmployeeId(String(list[0]._id));
                }
            } catch { toast.error("Failed to load employees"); }
            finally { setLoadingEmployees(false); }
        };
        fetchEmployees();
    }, [canSelectEmployee, user?._id]);

    const fetchFiles = async () => {
        if (!selectedEmployeeId) return;
        try {
            setLoading(true);
            const res = await api.get(`/employee-files/${selectedEmployeeId}`);
            const all = res.data.data || [];
            setAllFiles(all);

            let filtered = all;
            if (activeTab === "documents") filtered = all.filter((f: any) => ["Certification", "Award", "Document", "Other", "General", "NDA", "Passport"].includes(f.category));
            else if (activeTab === "cv") filtered = all.filter((f: any) => f.category === "CV / Resume");
            else if (activeTab === "bluebook") filtered = all.filter((f: any) => f.category === "Blue Book");
            else if (activeTab === "analysis") filtered = all.filter((f: any) => f.category === "360 Analysis");
            else if (activeTab === "evaluation") filtered = all.filter((f: any) => f.category === "Pre-Evaluation");

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter((f: any) =>
                    f.title.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) ||
                    (f.documentNumber && f.documentNumber.toLowerCase().includes(q)) ||
                    (f.tags && f.tags.some((t: string) => t.toLowerCase().includes(q)))
                );
            }
            setFiles(filtered);
        } catch { toast.error("Failed to load files"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFiles(); }, [activeTab, selectedEmployeeId, searchQuery]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = isCustomCategory ? customCategory : newCategory;

        if (!selectedFile || !newTitle || !selectedEmployeeId || !finalCategory) {
            toast.error("Title, file, and category are required");
            return;
        }

        const formData = new FormData();
        formData.append("title", newTitle);
        formData.append("category", finalCategory);
        formData.append("issueDate", newDate || new Date().toISOString());
        if (newExpiryDate) formData.append("expiryDate", newExpiryDate);
        formData.append("employeeId", selectedEmployeeId);
        formData.append("documentNumber", newDocNumber);
        formData.append("notes", newNotes);
        formData.append("description", newDescription);
        formData.append("tags", newTags);
        formData.append("file", selectedFile);

        try {
            setUploading(true);
            await api.post("/employee-files", formData, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success("File uploaded successfully!");
            setIsUploadModalOpen(false);
            resetForm();
            fetchFiles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Upload failed");
        } finally { setUploading(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            await api.delete(`/employee-files/${id}`);
            toast.success("File deleted");
            fetchFiles();
            if (viewingFile?._id === id) setViewingFile(null);
        } catch { toast.error("Failed to delete"); }
    };

    const handleVerify = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/employee-files/${id}/verify`, { isVerified: !currentStatus });
            toast.success(currentStatus ? "Verification removed" : "File verified!");
            fetchFiles();
            if (viewingFile && viewingFile._id === id) {
                setViewingFile({ ...viewingFile, isVerified: !currentStatus });
            }
        } catch { toast.error("Failed to update verification"); }
    };

    const resetForm = () => {
        setNewTitle(""); setNewCategory("Document"); setIsCustomCategory(false);
        setCustomCategory(""); setNewDate(""); setNewExpiryDate(""); setNewDocNumber("");
        setNewNotes(""); setNewDescription(""); setNewTags("");
        setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getTabCount = (tabId: string) => {
        if (tabId === "documents") return allFiles.filter(f => ["Certification", "Award", "Document", "Other", "General", "NDA", "Passport"].includes(f.category)).length;
        if (tabId === "cv") return allFiles.filter(f => f.category === "CV / Resume").length;
        if (tabId === "bluebook") return allFiles.filter(f => f.category === "Blue Book").length;
        if (tabId === "analysis") return allFiles.filter(f => f.category === "360 Analysis").length;
        if (tabId === "evaluation") return allFiles.filter(f => f.category === "Pre-Evaluation").length;
        return 0;
    };

    // Find selected employee name for header context
    const selectedEmployeeName = employees.find(e => e._id === selectedEmployeeId)?.fullName || "Employee";

    return (
        <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section - Clean & Professional */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-slate-200 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold tracking-widest text-[#8D6E63] uppercase">HR & Admin</span>
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-[#3E2723] tracking-tight">
                            {canSelectEmployee ? `${selectedEmployeeName}'s Files` : "My Files"}
                        </h1>
                        <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
                            Central repository for employee records, certifications, CVs, and performance evaluations.
                            Securely manage documents and track verification status.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {canSelectEmployee && (
                            <div className="relative min-w-[240px] group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-[#8D6E63]" />
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    disabled={loadingEmployees}
                                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none cursor-pointer appearance-none hover:border-slate-300 transition-all"
                                >
                                    {loadingEmployees && <option value="">Loading...</option>}
                                    {!loadingEmployees && employees.map((emp) => (
                                        <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            disabled={!selectedEmployeeId}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white text-sm font-semibold rounded-lg shadow-sm shadow-[#5D4037]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" /> Upload Document
                        </button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                    {/* Tabs Navigation */}
                    <div className="flex overflow-x-auto border-b border-slate-100 px-6 pt-4 gap-6 hide-scrollbar">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const count = getTabCount(tab.id);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all whitespace-nowrap relative ${isActive ? "text-[#5D4037]" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-[#5D4037]" : "text-slate-400"}`} />
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-[#5D4037]/10 text-[#5D4037]" : "bg-slate-100 text-slate-500"}`}>
                                            {count}
                                        </span>
                                    )}
                                    {isActive && (
                                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5D4037]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none transition-shadow"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Filter className="w-3.5 h-3.5" />
                            <span>{files.length} records found</span>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="min-h-[400px]">
                        {loading ? (
                            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-[#8D6E63]" />
                                <span className="text-sm font-medium">Loading records...</span>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                    <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">No documents found</p>
                                <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or upload a new file.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200">
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Issued</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {files.map((file) => (
                                            <tr
                                                key={file._id}
                                                onClick={() => setViewingFile(file)}
                                                className="hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm group-hover:border-[#8D6E63]/30 transition-colors">
                                                            {getFileIcon(file.fileType)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800 group-hover:text-[#5D4037] transition-colors">{file.title}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className="text-[11px] text-slate-400">{formatBytes(file.fileSize)}</p>
                                                                {file.documentNumber && (
                                                                    <>
                                                                        <span className="text-slate-300">•</span>
                                                                        <p className="text-[11px] text-slate-400 font-mono">{file.documentNumber}</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-md border border-slate-200">
                                                        {file.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {file.isVerified ? (
                                                        <div className="flex items-center gap-1.5 text-emerald-700">
                                                            <BadgeCheck className="w-4 h-4" />
                                                            <span className="text-xs font-semibold">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-amber-600">
                                                            <ShieldAlert className="w-4 h-4" />
                                                            <span className="text-xs font-semibold">Pending</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {new Date(file.issueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setViewingFile(file); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:border-[#5D4037] hover:text-[#5D4037] transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        View Details <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================= */}
            {/* UPLOAD MODAL                              */}
            {/* ========================================= */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 bg-[#3E2723]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-[#3E2723]">Upload New Document</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Fill in the details below to add a record.</p>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                                {canSelectEmployee && (
                                    <div className="bg-[#5D4037]/5 border border-[#5D4037]/10 p-4 rounded-lg mb-2">
                                        <label className="block text-[10px] font-bold text-[#5D4037] uppercase tracking-wider mb-2">Assign To Employee</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D4037] pointer-events-none" />
                                            <select
                                                value={selectedEmployeeId}
                                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                                required
                                                className="w-full pl-9 pr-8 py-2 bg-white border border-[#5D4037]/20 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037] outline-none cursor-pointer appearance-none"
                                            >
                                                {employees.map((emp) => (
                                                    <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D4037] pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Document Title <span className="text-rose-500">*</span></label>
                                        <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., NDA Agreement"
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={isCustomCategory ? "custom" : newCategory}
                                                onChange={(e) => {
                                                    if (e.target.value === "custom") setIsCustomCategory(true);
                                                    else { setIsCustomCategory(false); setNewCategory(e.target.value); }
                                                }}
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none cursor-pointer appearance-none"
                                            >
                                                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                <option value="custom" className="font-bold text-[#5D4037]">+ Add Custom Category</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        {isCustomCategory && (
                                            <input type="text" required value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter category name"
                                                className="mt-2 w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none" autoFocus />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Issue Date</label>
                                        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expiry Date</label>
                                        <input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Doc Number</label>
                                        <input type="text" value={newDocNumber} onChange={(e) => setNewDocNumber(e.target.value)} placeholder="Optional"
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tags (Comma separated)</label>
                                    <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="e.g., urgent, legal, 2024"
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] outline-none" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Upload File <span className="text-rose-500">*</span></label>
                                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${selectedFile ? "border-emerald-400 bg-emerald-50/30" : "border-slate-200 hover:border-[#8D6E63] hover:bg-[#8D6E63]/5 bg-slate-50"}`}>
                                        <input type="file" required id="file-upload" ref={fileInputRef} onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
                                        }} className="hidden" />
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-4">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{selectedFile.name}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{formatBytes(selectedFile.size)}</p>
                                                </div>
                                                <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                                    className="ml-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-full shadow-sm transition">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center group">
                                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:border-[#8D6E63]">
                                                    <Upload className="w-5 h-5 text-[#5D4037]" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-[#5D4037] transition-colors">Click to upload file</p>
                                                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX (Max 15MB)</p>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </form>

                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setIsUploadModalOpen(false)}
                                    className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-white transition">Cancel</button>
                                <button type="submit" disabled={uploading}
                                    className="px-5 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50">
                                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Save Document</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================= */}
            {/* VIEW FILE MODAL                           */}
            {/* ========================================= */}
            <AnimatePresence>
                {viewingFile && (
                    <div className="fixed inset-0 bg-[#3E2723]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200">
                                        {getFileIcon(viewingFile.fileType)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#3E2723] leading-tight">{viewingFile.title}</h2>
                                        <p className="text-xs text-slate-500 font-medium mt-1">{viewingFile.category} • {formatBytes(viewingFile.fileSize)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingFile(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className={`flex items-center justify-between p-4 rounded-lg border ${viewingFile.isVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${viewingFile.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {viewingFile.isVerified ? <BadgeCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${viewingFile.isVerified ? 'text-emerald-800' : 'text-amber-800'}`}>
                                                {viewingFile.isVerified ? 'Verified Document' : 'Pending Verification'}
                                            </p>
                                            {viewingFile.verifiedBy && <p className="text-[10px] text-slate-500">by {viewingFile.verifiedBy.fullName}</p>}
                                        </div>
                                    </div>
                                    {canSelectEmployee && (
                                        <button onClick={() => handleVerify(viewingFile._id, viewingFile.isVerified)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors border ${viewingFile.isVerified ? 'bg-white hover:bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white hover:bg-amber-100 border-amber-200 text-amber-700'}`}>
                                            {viewingFile.isVerified ? 'Unverify' : 'Verify Now'}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document No.</p>
                                        <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{viewingFile.documentNumber || "—"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Date</p>
                                        <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            {new Date(viewingFile.issueDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</p>
                                        <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            {viewingFile.expiryDate ? new Date(viewingFile.expiryDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "No Expiry"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</p>
                                        <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100 min-h-[42px] items-center">
                                            {viewingFile.tags && viewingFile.tags.length > 0 ? viewingFile.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-[#5D4037]/10 text-[#5D4037] text-[10px] font-bold rounded-md border border-[#5D4037]/20">
                                                    {tag}
                                                </span>
                                            )) : <span className="text-xs text-slate-400">No tags</span>}
                                        </div>
                                    </div>
                                </div>

                                {(viewingFile.description || viewingFile.notes) && (
                                    <div className="space-y-3">
                                        {viewingFile.description && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</p>
                                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">{viewingFile.description}</p>
                                            </div>
                                        )}
                                        {viewingFile.notes && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Notes</p>
                                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic">{viewingFile.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <button
                                    onClick={(e) => { handleDelete(viewingFile._id, e); setViewingFile(null); }}
                                    className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                                <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${viewingFile.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                                >
                                    <Eye className="w-4 h-4" /> View / Download
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}