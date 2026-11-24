"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  FileUp,
  Loader2,
  FileSpreadsheet,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import {
  HrDocumentCategory,
  HrDocumentItem,
  formatFileSize,
  uploadHrDocumentTemplate,
} from "@/lib/hrDocuments";

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".ppt",
  ".pptx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function validateSelectedFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasValidExt) {
    return `Unsupported file type. Allowed: ${ACCEPTED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File size exceeds 10MB limit.";
  }
  if (file.size === 0) {
    return "Selected file is empty.";
  }
  return null;
}

interface UploadTemplateModalProps {
  isOpen: boolean;
  defaultCategory: HrDocumentCategory;
  editDocument?: HrDocumentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadTemplateModal({
  isOpen,
  defaultCategory,
  editDocument = null,
  onClose,
  onSuccess,
}: UploadTemplateModalProps) {
  const isEditMode = Boolean(editDocument);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HrDocumentCategory>(defaultCategory);
  const [version, setVersion] = useState("1.0");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editDocument) {
      setTitle(editDocument.title || "");
      setDescription(editDocument.description || "");
      setCategory(editDocument.category || defaultCategory);
      setVersion(editDocument.version || "1.0");
      setFile(null);
    } else {
      setTitle("");
      setDescription("");
      setCategory(defaultCategory);
      setVersion("1.0");
      setFile(null);
    }
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [editDocument, defaultCategory, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleFilePick = (picked: File | undefined | null) => {
    if (!picked) return;
    const errorMsg = validateSelectedFile(picked);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    setFile(picked);
    if (!title.trim()) {
      const cleanName = picked.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
      setTitle(cleanName);
    }
  };

  const resetAndClose = () => {
    setTitle("");
    setDescription("");
    setVersion("1.0");
    setFile(null);
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a template title.");
      return;
    }

    if (!isEditMode && !file) {
      toast.error("Please choose a template file to upload.");
      return;
    }

    if (file) {
      const validationErr = validateSelectedFile(file);
      if (validationErr) {
        toast.error(validationErr);
        return;
      }
    }

    try {
      setSubmitting(true);

      if (isEditMode && editDocument) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("category", category);
        formData.append("version", version.trim() || "1.0");
        if (file) {
          formData.append("file", file);
        }

        await axios.patch(`/hr-documents/${editDocument._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success(
          `${category === "policy" ? "Policy" : "Form"} template updated successfully.`
        );
      } else if (file) {
        await uploadHrDocumentTemplate({
          title: title.trim(),
          description: description.trim(),
          category,
          version: version.trim() || "1.0",
          file,
        });

        toast.success(
          `${category === "policy" ? "Policy" : "Form"} template uploaded successfully.`
        );
      }

      resetAndClose();
      onSuccess();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        `Failed to ${isEditMode ? "update" : "upload"} template.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4"
      onClick={() => !submitting && resetAndClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white border border-[#E7DEC8] shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-[#FAF8F4] border-b border-[#EAE4D7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF5EB] border border-[#E5DFD3] flex items-center justify-center text-[#9A6B26]">
              {isEditMode ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1E1E]">
                {isEditMode
                  ? category === "policy"
                    ? "Edit Policy Template"
                    : "Edit Form Template"
                  : category === "policy"
                    ? "Upload Policy Template"
                    : "Upload Form Template"}
              </h2>
              <p className="text-[11px] text-[#7D786E]">
                {isEditMode
                  ? `Update details or replace file for "${editDocument?.title}"`
                  : `Add a downloadable ${category} file for employees`}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={resetAndClose}
            className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1E1E1E] mb-1.5">
              Template Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Leave Application Form"
              required
              disabled={submitting}
              className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E] placeholder:text-[#9A9488] focus:outline-none focus:border-[#9A6B26]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#1E1E1E] mb-1.5">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as HrDocumentCategory)
                }
                disabled={submitting}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E] focus:outline-none focus:border-[#9A6B26]"
              >
                <option value="form">Forms</option>
                <option value="policy">Policies</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1E1E1E] mb-1.5">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                disabled={submitting}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E] placeholder:text-[#9A9488] focus:outline-none focus:border-[#9A6B26]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1E1E1E] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief note about when or how to use this template..."
              disabled={submitting}
              className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white text-[#1E1E1E] placeholder:text-[#9A9488] focus:outline-none focus:border-[#9A6B26] resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-[#1E1E1E]">
                {isEditMode
                  ? "Replace Template File (Optional)"
                  : "Template File (.xlsx, .pdf, .docx, etc.)"}{" "}
                {!isEditMode && <span className="text-rose-600">*</span>}
              </label>
              {isEditMode && editDocument && !file && (
                <span className="text-[11px] text-[#7D786E] truncate max-w-[200px]">
                  Current: {editDocument.fileName}
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={(e) => handleFilePick(e.target.files?.[0])}
              className="hidden"
            />

            <div
              onClick={() => !submitting && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!submitting) setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (!submitting) handleFilePick(e.dataTransfer.files?.[0]);
              }}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${dragActive
                  ? "border-[#9A6B26] bg-[#FAF5EB]"
                  : file
                    ? "border-[#9A6B26]/70 bg-[#FCFBF8]"
                    : "border-[#E5DFD3] hover:border-[#9A6B26]/60 bg-[#FAF8F5]"
                }`}
            >
              {file ? (
                <div className="space-y-1">
                  <div className="w-9 h-9 rounded-lg bg-[#FAF5EB] border border-[#E5DFD3] flex items-center justify-center text-[#9A6B26] mx-auto">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-[#1E1E1E] break-all">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-[#7D786E]">
                    {formatFileSize(file.size)} · Ready to{" "}
                    {isEditMode ? "replace" : "upload"}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-1 inline-block text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    {isEditMode ? "Keep existing file" : "Change file"}
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5DFD3] flex items-center justify-center text-[#9A6B26] mx-auto">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-[#1E1E1E]">
                    {isEditMode
                      ? "Click to choose a replacement file or drag & drop"
                      : "Click to select a file or drag & drop"}
                  </p>
                  <p className="text-[11px] text-[#8A8478]">
                    PDF, Excel, Word, PowerPoint, CSV, or Image (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={resetAndClose}
              className="cursor-pointer px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9A6B26] hover:bg-[#82581E] text-white font-semibold transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {submitting
                  ? isEditMode
                    ? "Saving..."
                    : "Uploading..."
                  : isEditMode
                    ? "Save Changes"
                    : "Upload Template"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}