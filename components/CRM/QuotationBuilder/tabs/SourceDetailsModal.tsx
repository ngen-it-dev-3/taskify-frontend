'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { QuotationSourceData } from '../types';

interface Props {
  sourceName: string;
  data: QuotationSourceData;
  onClose: () => void;
  onSave: (updatedData: QuotationSourceData) => void;
}

export default function SourceDetailsModal({ sourceName, data, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<QuotationSourceData>({
    name: data.name || '',
    price: data.price || '',
    currency: data.currency || 'BDT',
    targetCurrency: data.targetCurrency || 'BDT',
    exchangeRate: data.exchangeRate || 1,
    address: data.address || '',
    email: data.email || '',
    phone: data.phone || '',
    reference: data.reference || '',
    category: data.category || '',
    documents: data.documents || [],
  });

  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof QuotationSourceData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ⭐ Helper to check if a URL is an image
  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(url);
  };

  // ⭐ Real Backend Upload Logic
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const formPayload = new FormData();
    Array.from(files).forEach((file) => formPayload.append('files', file));

    try {
      // Update this URL to match your backend route
      const response = await fetch('https://taskify-server-5gat.onrender.com/api/v1/crm/quotation/upload-source-docs', {
        method: 'POST',
        body: formPayload,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const resData = await response.json();
      const uploadedUrls = resData.data?.files || []; 

      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error(error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  // ⭐ Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeDoc = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Source Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">Editing details for <strong>{sourceName}</strong></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Source Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#A06126]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Category Type</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#A06126]"
              >
                <option value="">Select Category...</option>
                <option value="principle">Principle</option>
                <option value="reseller">Reseller</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="supplier@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#A06126]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+880 1..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#A06126]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Street, City, Zip..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#A06126] resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Reference</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              placeholder="Reference details or PO number..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#A06126]"
            />
          </div>

          {/* Documents Upload */}
          <div className="pt-2">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Documents (PDF, IMG)</label>

            {/* ⭐ DRAG & DROP ZONE */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition cursor-pointer relative ${
                isDragging ? 'border-[#A06126] bg-[#FAF6EE]' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                ref={fileInputRef}
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="space-y-1 text-center">
                <UploadCloud className={`mx-auto h-8 w-8 ${isDragging ? 'text-[#A06126]' : 'text-slate-400'}`} />
                <div className="flex text-xs text-slate-600 justify-center">
                  <span className="font-semibold text-[#A06126]">
                    {isDragging ? 'Drop files here' : 'Click to upload'}
                  </span>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
              </div>
            </div>

            {uploading && <p className="text-[10px] text-[#A06126] mt-2 animate-pulse font-semibold">Uploading files to server...</p>}

            {/* ⭐ Uploaded File List / Image Previews */}
            {formData.documents && formData.documents.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3">
                {formData.documents.map((doc, i) => (
                  <li key={i} className="group relative flex flex-col bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    
                    {/* Image Preview or File Icon */}
                    <div className="h-24 w-full bg-slate-200 flex items-center justify-center relative overflow-hidden">
                      {isImage(doc) ? (
                        <img src={doc} alt="Document preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-[10px] uppercase font-bold">{doc.split('.').pop()}</span>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                        <a href={doc} target="_blank" rel="noreferrer" className="p-1.5 bg-white rounded-full text-slate-700 hover:text-[#A06126] transition" title="View Full Size">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Filename & Delete */}
                    <div className="p-2 flex items-center justify-between gap-2 bg-white">
                      <span className="text-[10px] text-slate-600 truncate flex-1" title={doc.split('/').pop()}>
                        {doc.split('/').pop() || 'Document'}
                      </span>
                      <button type="button" onClick={() => removeDoc(i)} className="text-slate-400 hover:text-rose-500 transition shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D4A] hover:bg-[#1C3760] rounded-lg transition disabled:opacity-50">
              Save Source Info
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}