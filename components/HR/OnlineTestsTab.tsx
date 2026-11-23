"use client";

import React, { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  OnlineTestItem,
  TestSubmissionItem,
  JobPositionItem,
  QuestionPaperItem,
  createOnlineTest,
  formatDisplayDate,
} from "@/lib/recruitment";

export interface OnlineTestsTabProps {
  tests: OnlineTestItem[];
  submissions: TestSubmissionItem[];
  positions: JobPositionItem[];
  papers: QuestionPaperItem[];
  onRefresh: () => Promise<void>;
}

export default function OnlineTestsTab({
  tests,
  submissions,
  positions,
  papers,
  onRefresh,
}: OnlineTestsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<TestSubmissionItem | null>(null);

  const [title, setTitle] = useState("");
  const [positionId, setPositionId] = useState("");
  const [questionPaperId, setQuestionPaperId] = useState("");
  const [candidatesTaken, setCandidatesTaken] = useState("6");
  const [candidatesTotal, setCandidatesTotal] = useState("6");
  const [status, setStatus] = useState<"Active" | "Completed" | "Draft">(
    "Active"
  );
  const [saving, setSaving] = useState(false);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Test title is required.");
      return;
    }

    try {
      setSaving(true);
      await createOnlineTest({
        title: title.trim(),
        positionId: positionId || undefined,
        questionPaperId: questionPaperId || undefined,
        candidatesTaken: Math.max(0, Number(candidatesTaken) || 0),
        candidatesTotal: Math.max(0, Number(candidatesTotal) || 0),
        status,
      });
      toast.success("Screening test created.");
      setTitle("");
      setPositionId("");
      setQuestionPaperId("");
      setCandidatesTaken("0");
      setCandidatesTotal("0");
      setStatus("Active");
      setShowCreateModal(false);
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create test.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#EAE4D7] rounded-xl px-5 py-3.5 flex items-center justify-end shadow-2xs">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9A6B26] hover:bg-[#82581E] text-white text-xs font-semibold shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Test</span>
        </button>
      </div>

      <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                <th className="py-3 px-5">Test</th>
                <th className="py-3 px-4">Candidates Taken</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE3] text-xs">
              {tests.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 px-5 text-center text-[#7D786E]"
                  >
                    No screening tests configured yet.
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr
                    key={test._id}
                    className="hover:bg-[#FCFBF8] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-bold text-[#1E1E1E]">
                      {test.title}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A554E] font-medium">
                      {test.candidatesTaken} of {test.candidatesTotal}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${test.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                      >
                        {test.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6E6A63]">
          SUBMISSIONS
        </h2>

        <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                  <th className="py-3 px-5">Candidate</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE3] text-xs">
                {submissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 px-5 text-center text-[#7D786E]"
                    >
                      No test submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr
                      key={sub._id}
                      className="hover:bg-[#FCFBF8] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-bold text-[#1E1E1E]">
                        {sub.candidateName}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A554E] font-medium">
                        {formatDisplayDate(sub.submittedDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1E1E1E]">
                        {sub.score}%
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(sub)}
                          className="cursor-pointer text-xs font-medium text-[#3B5BDB] hover:underline"
                        >
                          View Answers
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1E1E]">
                Create Screening Test
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Accounting Fundamentals — Screening"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Position</label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="">General</option>
                    {positions
                      .filter((p) => !p._id.startsWith("sample-"))
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Question Paper
                  </label>
                  <select
                    value={questionPaperId}
                    onChange={(e) => setQuestionPaperId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="">Select paper</option>
                    {papers
                      .filter((p) => !p._id.startsWith("sample-"))
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Taken</label>
                  <input
                    type="number"
                    min={0}
                    value={candidatesTaken}
                    onChange={(e) => setCandidatesTaken(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Total</label>
                  <input
                    type="number"
                    min={0}
                    value={candidatesTotal}
                    onChange={(e) => setCandidatesTotal(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as "Active" | "Completed" | "Draft"
                      )
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  <span>Save Test</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE3] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1E1E1E]">
                  {selectedSubmission.candidateName} — Submitted Answers
                </h3>
                <p className="text-xs font-medium text-[#6E6A63] mt-0.5">
                  Score: {selectedSubmission.score}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="cursor-pointer w-7 h-7 rounded-full bg-[#F5F2EB] hover:bg-[#EAE4D7] flex items-center justify-center text-[#5A554E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-[#F0ECE3]">
              {selectedSubmission.answers.length === 0 ? (
                <p className="py-6 text-xs text-center text-[#7D786E]">
                  No individual answer breakdown available for this submission.
                </p>
              ) : (
                selectedSubmission.answers.map((item, idx) => (
                  <div key={item._id || idx} className="py-3.5 space-y-1">
                    <p className="text-xs font-bold text-[#1E1E1E]">
                      {idx + 1}. {item.question}
                    </p>
                    <p className="text-xs text-[#6E6A63]">
                      Answered: {item.answered}
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${item.isCorrect ? "text-emerald-600" : "text-rose-600"
                        }`}
                    >
                      {item.isCorrect ? "✓ Correct" : "✗ Incorrect"}
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