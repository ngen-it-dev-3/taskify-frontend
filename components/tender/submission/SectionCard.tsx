// components/tender/submission/SectionCard.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import type { TenderSection } from "@/lib/api/tender.api";
import { DocTaskRow, type DocTask } from "./DocTaskRow";

interface Props {
  section: TenderSection;
  tasks: DocTask[];
  isFirst: boolean;
  isLast: boolean;
  onTaskChange: (taskId: string, patch: Partial<DocTask>) => void;
  onTaskSave: (taskId: string) => void;
  onTaskCancel: (taskId: string) => void;
  onTaskRemove: (taskId: string) => void;
  onTaskUploadFile: (taskId: string, file: File) => void;
  onAddTask: () => void;
  onAddTodo: (title: string) => Promise<void> | void;
  onToggleTodo: (todoId: string, done: boolean) => Promise<void> | void;
  onRemoveTodo: (todoId: string) => Promise<void> | void;
  onPrev: () => void;
  onNext: () => void;
  onRemoveSection: () => void;
  fileUrlResolver?: (url: string) => string; // ✅ NEW PROP
}

export function SectionCard({
  section,
  tasks,
  isFirst,
  isLast,
  onTaskChange,
  onTaskSave,
  onTaskCancel,
  onTaskRemove,
  onTaskUploadFile,
  onAddTask,
  onAddTodo,
  onToggleTodo,
  onRemoveTodo,
  onPrev,
  onNext,
  onRemoveSection,
  fileUrlResolver, // ✅ Destructure
}: Props) {
  const ready = section.readyCount ?? 0;
  const total = section.totalCount ?? 0;
  const percent = total > 0 ? Math.round((ready / total) * 100) : 0;
  const todos = section.todoItems ?? [];

  const [todoInput, setTodoInput] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);

  const handleAddTodo = async () => {
    const t = todoInput.trim();
    if (!t) return;
    setAddingTodo(true);
    try {
      await onAddTodo(t);
      setTodoInput("");
    } finally {
      setAddingTodo(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-4">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900">
            {section.title}
          </h3>
          {section.description && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
              {section.description}
            </p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${total > 0 && ready === total
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-orange-200 bg-orange-50 text-orange-700"
            }`}
        >
          {ready} of {total} ready
        </span>
      </div>

      {/* Portal hint */}
      {section.portalHint && (
        <p className="mb-3 inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
          {section.portalHint}
        </p>
      )}

      {/* Progress Bar */}
      {total > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {/* Tasks */}
      <div>
        {tasks.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
            Nothing in this section yet. Add a document or pick from Company Docs.
          </p>
        ) : (
          tasks.map((task) => (
            <DocTaskRow
              key={task.id}
              task={task}
              onChange={(patch) => onTaskChange(task.id, patch)}
              onSave={() => onTaskSave(task.id)}
              onCancel={() => onTaskCancel(task.id)}
              onRemove={() => onTaskRemove(task.id)}
              onUploadFile={(file) => onTaskUploadFile(task.id, file)}
              fileUrlResolver={fileUrlResolver} // ✅ Pass it down
            />
          ))
        )}
      </div>

      {/* Add documents + todo */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#a97400] px-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#8f6100]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add documents
        </button>

        <span className="text-[11px] text-slate-400">or</span>

        <div className="flex items-center gap-1">
          <input
            type="text"
            value={todoInput}
            onChange={(e) => setTodoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTodo();
            }}
            placeholder="add a to-do item with no file yet"
            className="w-[220px] border-0 bg-transparent text-[11px] text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* To-do list */}
      {todos.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50/50 px-2.5 py-1.5"
            >
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => onToggleTodo(todo.id, !todo.done)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
              />
              <span
                className={`min-w-0 flex-1 truncate text-[11px] ${todo.done ? "text-slate-400 line-through" : "text-slate-700"
                  }`}
              >
                {todo.title}
              </span>
              <button
                type="button"
                onClick={() => onRemoveTodo(todo.id)}
                className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            type="button"
            onClick={onRemoveSection}
            className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline"
          >
            Remove this section
          </button>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#a97400] px-4 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next section
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}