"use client";
import { useEffect, useRef, useState } from "react";

function SearchableEmployeeSelect({
    label,
    value,
    onChange,
    options,
    error,
    disabled,
    required,
}: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    error?: string;
    disabled?: boolean;
    required?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter((o) =>
        o.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="relative">
            {label && (
                <label className="block text-[10.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-1.5">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between bg-slate-100 border rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60 ${error ? 'border-rose-400' : 'border-transparent'
                    }`}
            >
                <span className="truncate">
                    {value ? value : <span className="text-slate-400">Select Assignee</span>}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2DBD1] rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-[#A06126]"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((o) => (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() => {
                                        onChange(o);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full flex items-center px-3 py-2 text-xs text-left hover:bg-slate-50 transition ${value === o ? 'bg-amber-50 text-[#A06126] font-semibold' : 'text-slate-700'
                                        }`}
                                >
                                    {o}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                                No employees found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>
            )}
        </div>
    );
}