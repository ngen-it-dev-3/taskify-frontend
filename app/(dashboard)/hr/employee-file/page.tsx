"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    FileText, Upload, Trash2, Calendar, Award, BookOpen, ShieldCheck,
    Loader2, Plus, X, User, ChevronDown, File, Image as ImageIcon,
    FileSpreadsheet, Search, CheckCircle2, ShieldAlert, BadgeCheck, Tag,
    Download, Eye, ArrowRight, MoreHorizontal, Filter, Edit3, AlertCircle,
    FileType, Briefcase, Users, Clock, CheckSquare
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// --- Interfaces ---
interface FileRecord {
    _id: string;
    title: string;
    category: string;
    documentNumber?: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    issueDate: string;
    expiryDate?: string;
    isVerified: boolean;
    tags?: string[];
    description?: string;
    notes?: string;
    verifiedBy?: { fullName: string };
    createdAt?: string;
}

interface Employee {
    _id: string;
    fullName: string;
    employeeId?: string;
}

const NAV_ITEMS = [
    { id: "documents", label: "Documents & Certs", icon: FileText },
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
const getFileIcon = (mimeType: string, size: number = 5) => {
    const className = `w-${size} h-${size}`;
    if (mimeType?.includes("pdf")) return <FileText className={`${className} text-[#8D6E63]`} />;
    if (mimeType?.includes("image")) return <ImageIcon className={`${className} text-[#5D4037]`} />;
    if (mimeType?.includes("sheet") || mimeType?.includes("excel")) return <FileSpreadsheet className={`${className} text-emerald-700`} />;
    if (mimeType?.includes("word") || mimeType?.includes("document")) return <FileType className={`${className} text-blue-800`} />;
    return <File className={`${className} text-slate-500`} />;
};

const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
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
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [viewingFile, setViewingFile] = useState<FileRecord | null>(null);
    const [editingFile, setEditingFile] = useState<FileRecord | null>(null); 

    // Form State
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "Document",
        customCategory: "",
        isCustomCategory: false,
        issueDate: "",
        expiryDate: "",
        documentNumber: "",
        notes: "",
        description: "",
        tags: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Role Check
    const canSelectEmployee = useMemo(() => {
        const allowedRoles = ["super_admin", "admin", "hr_manager", "manager", "hr"];
        const userRole = String(user?.role || "").toLowerCase().replace(/\s+/g, '_');
        return Boolean(userRole && allowedRoles.includes(userRole));
    }, [user?.role]);

    // Fetch Employees
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
            } catch {
                toast.error("Failed to load employees");
            } finally {
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();
    }, [canSelectEmployee, user?._id]);

    // Fetch Files
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
        } catch {
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [activeTab, selectedEmployeeId, searchQuery]);

    // Handle Form Submission (Create or Update)
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = formData.isCustomCategory ? formData.customCategory : formData.category;

        if (!selectedEmployeeId || !finalCategory || (!editingFile && !selectedFile)) {
            toast.error("Please fill in all required fields.");
            return;
        }
        
        if (editingFile && !formData.title && !selectedFile) {
             toast.error("Title is required");
             return;
        }

        const formPayload = new FormData();
        if (selectedFile) formPayload.append("file", selectedFile);
        
        formPayload.append("title", formData.title || editingFile?.title || "");
        formPayload.append("category", finalCategory);
        formPayload.append("issueDate", formData.issueDate || new Date().toISOString());
        if (formData.expiryDate) formPayload.append("expiryDate", formData.expiryDate);
        formPayload.append("employeeId", selectedEmployeeId);
        formPayload.append("documentNumber", formData.documentNumber);
        formPayload.append("notes", formData.notes);
        formPayload.append("description", formData.description);
        formPayload.append("tags", formData.tags);

        try {
            setSubmitting(true);
            if (editingFile) {
                await api.patch(`/employee-files/${editingFile._id}`, formPayload, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast.success("Document updated successfully!");
            } else {
                await api.post("/employee-files", formPayload, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast.success("File uploaded successfully!");
            }
            closeFormModal();
            fetchFiles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        if (!confirm("Are you sure you want to permanently delete this file?")) return;
        try {
            await api.delete(`/employee-files/${id}`);
            toast.success("File deleted");
            fetchFiles();
            if (viewingFile?._id === id) setViewingFile(null);
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleVerify = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/employee-files/${id}/verify`, { isVerified: !currentStatus });
            toast.success(currentStatus ? "Verification removed" : "File verified!");
            fetchFiles();
            if (viewingFile && viewingFile._id === id) {
                setViewingFile({ ...viewingFile, isVerified: !currentStatus });
            }
        } catch {
            toast.error("Failed to update verification");
        }
    };

    const openEditModal = (file: FileRecord, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingFile(file);
        setFormData({
            title: file.title,
            category: CATEGORY_OPTIONS.includes(file.category) ? file.category : "Document",
            customCategory: !CATEGORY_OPTIONS.includes(file.category) ? file.category : "",
            isCustomCategory: !CATEGORY_OPTIONS.includes(file.category),
            issueDate: file.issueDate ? file.issueDate.split('T')[0] : "",
            expiryDate: file.expiryDate ? file.expiryDate.split('T')[0] : "",
            documentNumber: file.documentNumber || "",
            notes: file.notes || "",
            description: file.description || "",
            tags: file.tags ? file.tags.join(", ") : "",
        });
        setSelectedFile(null);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingFile(null);
        setFormData({
            title: "", category: "Document", customCategory: "", isCustomCategory: false,
            issueDate: "", expiryDate: "", documentNumber: "", notes: "", description: "", tags: ""
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getTabCount = (tabId: string) => {
        if (tabId === "documents") return allFiles.filter(f => ["Certification", "Award", "Document", "Other", "General", "NDA", "Passport"].includes(f.category)).length;
        if (tabId === "cv") return allFiles.filter(f => f.category === "CV / Resume").length;
        if (tabId === "bluebook") return allFiles.filter(f => f.category === "Blue Book").length;
        if (tabId === "analysis") return allFiles.filter(f => f.category === "360 Analysis").length;
        if (tabId === "evaluation") return allFiles.filter(f => f.category === "Pre-Evaluation").length;
        return 0;
    };

    const selectedEmployeeName = employees.find(e => e._id === selectedEmployeeId)?.fullName || "Employee";

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#2C3E50]">

            {/* Main Content Area */}
            <div className="container mx-auto px-8 py-8 space-y-8">
                
                {/* Context Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <span className="px-2 py-0.5 bg-[#8D6E63]/10 text-[#8D6E63] text-[10px] font-bold tracking-widest uppercase rounded-sm">Employee Directory</span>
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">
                            {canSelectEmployee ? `${selectedEmployeeName}'s Profile` : "My Personal Files"}
                        </h2>
                        <p className="text-slate-500 mt-2 text-sm max-w-xl">
                            Employee 360 profile — record, documents & certifications, the evaluation "blue book," and 360-degree performance analysis, all in one place.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {canSelectEmployee && (
                            <div className="relative min-w-[220px]">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    disabled={loadingEmployees}
                                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none cursor-pointer appearance-none transition-all hover:border-slate-400"
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
                            onClick={() => { setEditingFile(null); setIsFormModalOpen(true); }}
                            disabled={!selectedEmployeeId}
                            className="flex items-center justify-center gap-2 px-5 py-2 bg-[#5D4037] hover:bg-[#4E342E] text-white text-sm font-semibold rounded-md shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" /> Add Document
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs (Clean Style) */}
                <div className="border-b border-slate-200">
                    <nav className="flex gap-8 overflow-x-auto hide-scrollbar">
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeTab === item.id;
                            const count = getTabCount(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`pb-3 text-sm font-medium transition-all whitespace-nowrap relative flex items-center gap-2 ${isActive ? "text-[#5D4037]" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    {item.label}
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-[#5D4037] text-white" : "bg-slate-200 text-slate-600"}`}>
                                            {count}
                                        </span>
                                    )}
                                    {isActive && (
                                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5D4037]" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by title, tag, or doc number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Filter className="w-3.5 h-3.5" />
                        <span>{files.length} records found</span>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#8D6E63]" />
                            <span className="text-sm font-medium">Syncing records...</span>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                            <FileText className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm font-medium">No documents found in this category.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#FDFBF7] border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee / Document</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Designation / Category</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Joined / Issued</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {files.map((file) => (
                                        <tr
                                            key={file._id}
                                            onClick={() => setViewingFile(file)}
                                            className="hover:bg-[#FDFBF7] transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-white border border-slate-100 rounded-md shadow-sm group-hover:border-[#8D6E63]/30 transition-colors">
                                                        {getFileIcon(file.fileType)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#5D4037] transition-colors">{file.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[11px] text-slate-400">{formatBytes(file.fileSize)}</span>
                                                            {file.documentNumber && (
                                                                <>
                                                                    <span className="text-slate-300">•</span>
                                                                    <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 rounded">{file.documentNumber}</span>
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
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => openEditModal(file, e)}
                                                        className="p-2 text-slate-500 hover:text-[#5D4037] hover:bg-[#5D4037]/5 rounded-md transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(file._id, e)}
                                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setViewingFile(file); }}
                                                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                                        title="View Details"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================= */}
            {/* UPLOAD / EDIT MODAL                       */}
            {/* ========================================= */}
            <AnimatePresence>
                {isFormModalOpen && (
                    <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#FDFBF7]">
                                <div>
                                    <h2 className="text-lg font-bold text-[#1A1A1A]">
                                        {editingFile ? "Edit Document" : "Upload New Document"}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {editingFile ? "Update details or replace the file." : "Fill in the details below to add a record."}
                                    </p>
                                </div>
                                <button onClick={closeFormModal} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                                {canSelectEmployee && !editingFile && (
                                    <div className="bg-[#5D4037]/5 border border-[#5D4037]/10 p-4 rounded-lg mb-2">
                                        <label className="block text-[10px] font-bold text-[#5D4037] uppercase tracking-wider mb-2">Assign To Employee</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D4037] pointer-events-none" />
                                            <select
                                                value={selectedEmployeeId}
                                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                                required
                                                className="w-full pl-9 pr-8 py-2 bg-white border border-[#5D4037]/20 rounded-md text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037] outline-none cursor-pointer appearance-none"
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
                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Document Title <span className="text-rose-500">*</span></label>
                                        <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., NDA Agreement"
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={formData.isCustomCategory ? "custom" : formData.category}
                                                onChange={(e) => {
                                                    if (e.target.value === "custom") setFormData({...formData, isCustomCategory: true});
                                                    else { setFormData({...formData, isCustomCategory: false, category: e.target.value}); }
                                                }}
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none cursor-pointer appearance-none"
                                            >
                                                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                <option value="custom" className="font-bold text-[#5D4037]">+ Add Custom Category</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        {formData.isCustomCategory && (
                                            <input type="text" required value={formData.customCategory} onChange={(e) => setFormData({...formData, customCategory: e.target.value})} placeholder="Enter category name"
                                                className="mt-2 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none" autoFocus />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Doc Number</label>
                                        <input type="text" value={formData.documentNumber} onChange={(e) => setFormData({...formData, documentNumber: e.target.value})} placeholder="Optional ID"
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Issue Date</label>
                                        <input type="date" value={formData.issueDate} onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expiry Date</label>
                                        <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tags (Comma separated)</label>
                                    <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="e.g., urgent, legal, 2024"
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63] outline-none" />
                                </div>

                                {/* File Upload Section */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        {editingFile ? "Replace File (Optional)" : "Upload File"} <span className="text-rose-500">{!editingFile && "*"}</span>
                                    </label>
                                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${selectedFile ? "border-emerald-400 bg-emerald-50/30" : "border-slate-300 hover:border-[#8D6E63] hover:bg-[#8D6E63]/5 bg-slate-50"}`}>
                                        <input type="file" id="file-upload" ref={fileInputRef} onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
                                        }} className="hidden" {...(!editingFile ? { required: true } : {})} />
                                        
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
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-[#5D4037] transition-colors">
                                                    {editingFile ? "Click to upload new file" : "Click to upload file"}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX (Max 15MB)</p>
                                            </label>
                                        )}
                                    </div>
                                    {editingFile && !selectedFile && (
                                        <p className="text-xs text-slate-400 mt-2 text-center italic">Keeping existing file: {editingFile.title}</p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                    <button type="button" onClick={closeFormModal}
                                        className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
                                    <button type="submit" disabled={submitting}
                                        className="px-6 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-md text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50">
                                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> {editingFile ? "Update Document" : "Save Document"}</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================= */}
            {/* VIEW FILE MODAL WITH PREVIEW              */}
            {/* ========================================= */}
            <AnimatePresence>
                {viewingFile && (
                    <div className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 bg-[#FDFBF7] flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-md shadow-sm border border-slate-200">
                                        {getFileIcon(viewingFile.fileType, 6)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#1A1A1A] leading-tight">{viewingFile.title}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{viewingFile.category}</span>
                                            <span className="text-xs text-slate-400">• {formatBytes(viewingFile.fileSize)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setViewingFile(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row bg-white">
                                {/* Left Side: Preview Area */}
                                <div className="w-full md:w-2/3 bg-slate-100 border-r border-slate-200 flex items-center justify-center min-h-[300px] md:min-h-[500px] relative group">
                                    
                                    {/* Image Preview */}
                                    {viewingFile.fileType?.includes("image") ? (
                                        <img 
                                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${viewingFile.fileUrl}`} 
                                            alt={viewingFile.title}
                                            className="max-w-full max-h-full object-contain shadow-lg"
                                        />
                                    ) : viewingFile.fileType?.includes("pdf") ? (
                                        <iframe 
                                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${viewingFile.fileUrl}#toolbar=0`}
                                            className="w-full h-full min-h-[500px]"
                                            title="PDF Preview"
                                        />
                                    ) : (
                                        /* Fallback for other files */
                                        <div className="text-center p-8">
                                            <div className="w-24 h-24 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-4">
                                                {getFileIcon(viewingFile.fileType, 12)}
                                            </div>
                                            <p className="text-slate-500 font-medium">Preview not available for this file type.</p>
                                            <p className="text-xs text-slate-400 mt-2">Please download to view.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Details Sidebar */}
                                <div className="w-full md:w-1/3 bg-white p-6 space-y-6 overflow-y-auto">
                                    
                                    {/* Verification Status Card */}
                                    <div className={`p-4 rounded-lg border ${viewingFile.isVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${viewingFile.isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                Status
                                            </span>
                                            {canSelectEmployee && (
                                                <button onClick={() => handleVerify(viewingFile._id, viewingFile.isVerified)}
                                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors border ${viewingFile.isVerified ? 'bg-white hover:bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white hover:bg-amber-100 border-amber-200 text-amber-700'}`}>
                                                    {viewingFile.isVerified ? 'Unverify' : 'Verify Now'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {viewingFile.isVerified ? <BadgeCheck className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-amber-600" />}
                                            <span className={`font-semibold ${viewingFile.isVerified ? 'text-emerald-800' : 'text-amber-800'}`}>
                                                {viewingFile.isVerified ? 'Verified Document' : 'Pending Verification'}
                                            </span>
                                        </div>
                                        {viewingFile.verifiedBy && <p className="text-[10px] text-slate-500 mt-1 ml-7">by {viewingFile.verifiedBy.fullName}</p>}
                                    </div>

                                    {/* Meta Data Grid */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document No.</label>
                                            <p className="text-sm font-medium text-slate-800 mt-1">{viewingFile.documentNumber || "—"}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issued</label>
                                                <p className="text-sm font-medium text-slate-800 mt-1">{new Date(viewingFile.issueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expires</label>
                                                <p className="text-sm font-medium text-slate-800 mt-1">{viewingFile.expiryDate ? new Date(viewingFile.expiryDate).toLocaleDateString() : "Never"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {viewingFile.tags && viewingFile.tags.length > 0 && (
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {viewingFile.tags.map((tag, i) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description & Notes */}
                                    {(viewingFile.description || viewingFile.notes) && (
                                        <div className="pt-4 border-t border-slate-100 space-y-4">
                                            {viewingFile.description && (
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{viewingFile.description}</p>
                                                </div>
                                            )}
                                            {viewingFile.notes && (
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Notes</label>
                                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">{viewingFile.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-[#FDFBF7] flex items-center justify-between">
                                <button
                                    onClick={(e) => { handleDelete(viewingFile._id, e); setViewingFile(null); }}
                                    className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 rounded-md text-sm font-semibold transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { setViewingFile(null); openEditModal(viewingFile, e); }}
                                        className="flex items-center gap-2 px-4 py-2 text-[#5D4037] bg-white border border-[#5D4037]/20 hover:bg-[#5D4037]/5 rounded-md text-sm font-semibold transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" /> Edit
                                    </button>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${viewingFile.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-2 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-md text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}