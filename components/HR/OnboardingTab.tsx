"use client";

import React, { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  OnboardingHireItem,
  createOnboardingHire,
  updateOnboardingHire,
  formatDisplayDate,
} from "@/lib/recruitment";

interface OnboardingTabProps {
  hires: OnboardingHireItem[];
  onRefresh: () => Promise<void>;
  isSampleMode?: boolean;
}

export default function OnboardingTab({
  hires,
  onRefresh,
  isSampleMode = false,
}: OnboardingTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add New Hire Form State
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("Supply Chain");
  const [positionTitle, setPositionTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [completedSteps, setCompletedSteps] = useState("3");
  const [totalSteps, setTotalSteps] = useState("6");
  const [ndaStatus, setNdaStatus] = useState<"Signed" | "Pending">("Signed");
  const [status, setStatus] = useState<
    "In Progress" | "Completed" | "On Hold"
  >("In Progress");
  const [saving, setSaving] = useState(false);

  const handleCreateHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !department.trim() || !startDate) {
      toast.error("New hire name, department, and start date are required.");
      return;
    }

    const totalVal = Math.max(1, Number(totalSteps) || 6);
    const doneVal = Math.min(
      totalVal,
      Math.max(0, Number(completedSteps) || 0)
    );

    try {
      setSaving(true);
      await createOnboardingHire({
        employeeName: employeeName.trim(),
        department: department.trim(),
        positionTitle: positionTitle.trim() || undefined,
        startDate,
        completedSteps: doneVal,
        totalSteps: totalVal,
        ndaStatus,
        status: doneVal >= totalVal ? "Completed" : status,
      });
      toast.success("New hire onboarding added.");
      setEmployeeName("");
      setDepartment("Supply Chain");
      setPositionTitle("");
      setStartDate("");
      setCompletedSteps("3");
      setTotalSteps("6");
      setNdaStatus("Signed");
      setStatus("In Progress");
      setShowAddModal(false);
      await onRefresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to add onboarding record."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceStep = async (hire: OnboardingHireItem) => {
    if (isSampleMode || hire._id.startsWith("sample-")) {
      toast.error("Sample record. Add a live new hire to update checklist.");
      return;
    }

    const nextSteps =
      hire.completedSteps >= hire.totalSteps ? 0 : hire.completedSteps + 1;
    const nextStatus: "In Progress" | "Completed" =
      nextSteps >= hire.totalSteps ? "Completed" : "In Progress";

    try {
      setUpdatingId(hire._id);
      await updateOnboardingHire(hire._id, {
        completedSteps: nextSteps,
        status: nextStatus,
      });
      toast.success(
        `${hire.employeeName}: ${nextSteps} of ${hire.totalSteps} steps`
      );
      await onRefresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update checklist progress."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleNda = async (hire: OnboardingHireItem) => {
    if (isSampleMode || hire._id.startsWith("sample-")) {
      toast.error("Sample record. Add a live new hire to toggle NDA.");
      return;
    }

    const nextNda: "Signed" | "Pending" =
      hire.ndaStatus === "Signed" ? "Pending" : "Signed";

    try {
      setUpdatingId(hire._id);
      await updateOnboardingHire(hire._id, { ndaStatus: nextNda });
      toast.success(`NDA marked as ${nextNda}`);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update NDA.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar matching screenshot */}
      <div className="bg-white border border-[#EAE4D7] rounded-xl px-5 py-3.5 flex items-center justify-end shadow-2xs">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9A6B26] hover:bg-[#82581E] text-white text-xs font-semibold shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Hire</span>
        </button>
      </div>

      {/* Onboarding Table */}
      <div className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[11px] font-bold uppercase tracking-wider text-[#7D786E]">
                <th className="py-3 px-5">New Hire</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">Checklist Progress</th>
                <th className="py-3 px-4">NDA</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE3] text-xs">
              {hires.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 px-5 text-center text-[#7D786E]"
                  >
                    No new hires in onboarding yet. Click &ldquo;+ Add New
                    Hire&rdquo; to start.
                  </td>
                </tr>
              ) : (
                hires.map((hire) => {
                  const busy = updatingId === hire._id;
                  return (
                    <tr
                      key={hire._id}
                      className="hover:bg-[#FCFBF8] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-bold text-[#1E1E1E]">
                        {hire.employeeName}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A554E]">
                        {hire.department}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A554E] font-medium">
                        {formatDisplayDate(hire.startDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleAdvanceStep(hire)}
                          title="Click to increment checklist step"
                          className="cursor-pointer font-medium text-[#1E1E1E] hover:text-[#9A6B26] transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>
                            {hire.completedSteps} of {hire.totalSteps} steps
                          </span>
                          {busy && (
                            <Loader2 className="w-3 h-3 animate-spin text-[#9A6B26]" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleToggleNda(hire)}
                          title="Click to toggle NDA status"
                          className={`cursor-pointer px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                            hire.ndaStatus === "Signed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {hire.ndaStatus}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                            hire.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-[#FFF3EB] text-[#C2592B] border-[#F8D7C4]"
                          }`}
                        >
                          {hire.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Hire Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#EAE4D7] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1E1E]">
                Add New Hire
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHire} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  New Hire Name *
                </label>
                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g., Farhana Yasmin"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Supply Chain"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Steps Done
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={completedSteps}
                    onChange={(e) => setCompletedSteps(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Total Steps
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalSteps}
                    onChange={(e) => setTotalSteps(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">NDA</label>
                  <select
                    value={ndaStatus}
                    onChange={(e) =>
                      setNdaStatus(e.target.value as "Signed" | "Pending")
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                  >
                    <option value="Signed">Signed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "In Progress"
                        | "Completed"
                        | "On Hold"
                    )
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5DFD3] bg-white"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
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
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}