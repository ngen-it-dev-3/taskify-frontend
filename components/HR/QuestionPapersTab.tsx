"use client";

import React, { useState } from "react";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  QuestionPaperItem,
  QuestionItem,
  JobPositionItem,
  createQuestionPaper,
} from "@/lib/recruitment";

interface QuestionPapersTabProps {
  papers: QuestionPaperItem[];
  positions: JobPositionItem[];
  onRefresh: () => Promise<void>;
}

export default function QuestionPapersTab({
  papers,
  positions,
  onRefresh,
}: QuestionPapersTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPaper, setViewingPaper] = useState<QuestionPaperItem | null>(
    null
  );

  // Form state
  const [title, setTitle] = useState("");
  const [positionLabel, setPositionLabel] = useState("Junior Accountant");
  const [paperType, setPaperType] = useState("Aptitude");
  const [questionsCountOverride, setQuestionsCountOverride] = useState("15");
  const [qaList, setQaList] = useState<QuestionItem[]>([
    { question: "", answer: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const handleAddQaRow = () => {
    setQaList((prev) => [...prev, { question: "", answer: "" }]);
  };

  const handleRemoveQaRow = (idx: number) => {
    setQaList((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
    );
  };

  const handleQaChange = (
    idx: number,
    field: "question" | "answer",
    val: string
  ) => {
    setQaList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Question paper title is required.");
      return;
    }

    const cleanedQuestions = qaList
      .map((q) => ({
        question: q.question.trim(),
        answer: q.answer.trim(),
      }))
      .filter((q) => q.question && q.answer);

    try {
      setSaving(true);
      await createQuestionPaper({
        title: title.trim(),
        positionLabel: positionLabel.trim() || "All Positions",
        paperType: paperType.trim() || "Aptitude",
        questionsCountOverride:
          questionsCountOverride.trim() !== ""
            ? Math.max(0, Number(questionsCountOverride) || 0)
            : undefined,
        questions: cleanedQuestions,
      });
      toast.success("Question paper saved.");
      setTitle("");
      setPositionLabel("Junior Accountant");
      setPaperType("Aptitude");
      setQuestionsCountOverride("10");
      setQaList([{ question: "", answer: "" }]);
      setShowAddModal(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to save question paper."
      );
    } finally {
      setSaving(false);
    }
  };

  const getQuestionCountDisplay = (paper: QuestionPaperItem) => {
    if (typeof paper.questionsCountOverride === "number") {
      return paper.questionsCountOverride;
    }
    return paper.questions?.length || 0;
  };

  return (
    <div className="space-y-4">
      {/* Helper description matching screenshot */}
      <p className="text-xs text-[#6E6A63]">
        Aptitude and screening question papers, kept separately from live test
        results — reuse the same paper across future openings for the same
        position.
      </p>

      {/* Action Toolbar */}
      <div className="bg-white border border-[#EAE4D7] rounded-xl px-5 py-3.5 flex items-center justify-end shadow-2xs">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9A6B26] hover:bg-[#82581E] text-white text-xs font-semibold shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Question Paper</span>
        </button>
      </div>

      {/* Question Papers Table */}
      <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                <th className="py-3 px-5">Paper</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE3] text-xs">
              {papers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 px-5 text-center text-[#7D786E]"
                  >
                    No question papers added yet.
                  </td>
                </tr>
              ) : (
                papers.map((paper) => (
                  <tr
                    key={paper._id}
                    className="hover:bg-[#FCFBF8] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-bold text-[#1E1E1E]">
                      {paper.title}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A554E]">
                      {paper.positionLabel || "All Positions"}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A554E] font-medium">
                      {getQuestionCountDisplay(paper)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#3B5BDB] border border-[#DCE4FF] text-[11px] font-semibold">
                        {paper.paperType || "Aptitude"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingPaper(paper)}
                        className="cursor-pointer text-xs font-medium text-[#3B5BDB] hover:underline"
                      >
                        View Q&amp;A Sheet →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Question Paper Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0ECE3] pb-3">
              <h3 className="text-base font-bold text-[#1E1E1E]">
                Add Question Paper
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePaper} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Accounting Fundamentals — Screening"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Position</label>
                  <input
                    type="text"
                    list="recruitment-position-suggestions"
                    value={positionLabel}
                    onChange={(e) => setPositionLabel(e.target.value)}
                    placeholder="Junior Accountant"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                  <datalist id="recruitment-position-suggestions">
                    <option value="All Positions" />
                    {positions.map((p) => (
                      <option key={p._id} value={p.title} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Type</label>
                  <input
                    type="text"
                    value={paperType}
                    onChange={(e) => setPaperType(e.target.value)}
                    placeholder="Aptitude"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={questionsCountOverride}
                    onChange={(e) => setQuestionsCountOverride(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1E1E1E]">
                    Q&amp;A Sheet Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQaRow}
                    className="cursor-pointer text-xs font-semibold text-[#9A6B26] hover:underline"
                  >
                    + Add Question Row
                  </button>
                </div>

                {qaList.map((qa, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#6E6A63]">
                        Question {idx + 1}
                      </span>
                      {qaList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQaRow(idx)}
                          className="cursor-pointer text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={qa.question}
                      onChange={(e) =>
                        handleQaChange(idx, "question", e.target.value)
                      }
                      placeholder="What is the accounting equation?"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-white"
                    />
                    <input
                      type="text"
                      value={qa.answer}
                      onChange={(e) =>
                        handleQaChange(idx, "answer", e.target.value)
                      }
                      placeholder="Assets = Liabilities + Equity"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-[#9A6B26] text-white font-semibold inline-flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Paper</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Q&A Sheet Modal matching 4th screenshot */}
      {viewingPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE3] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1E1E1E]">
                  {viewingPaper.title}
                </h3>
                <p className="text-xs text-[#6E6A63] mt-0.5">
                  {viewingPaper.positionLabel || "All Positions"} ·{" "}
                  {viewingPaper.questions?.length || 0} questions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPaper(null)}
                className="cursor-pointer w-7 h-7 rounded-full bg-[#F5F2EB] hover:bg-[#EAE4D7] flex items-center justify-center text-[#5A554E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-[#F0ECE3]">
              {!viewingPaper.questions || viewingPaper.questions.length === 0 ? (
                <p className="py-6 text-xs text-center text-[#7D786E]">
                  No Q&amp;A items added to this paper yet.
                </p>
              ) : (
                viewingPaper.questions.map((qa, idx) => (
                  <div key={qa._id || idx} className="py-3.5 space-y-1">
                    <p className="text-xs font-bold text-[#1E1E1E]">
                      {idx + 1}. {qa.question}
                    </p>
                    <p className="text-xs font-medium text-[#9A6B26]">
                      Answer: {qa.answer}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}