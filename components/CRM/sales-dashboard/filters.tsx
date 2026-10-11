// components/CRM/sales-dashboard/filters.tsx
'use client';
import { ChevronDown } from 'lucide-react';

interface FilterSelectProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: FilterSelectProps<T>) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none bg-white border border-[#E2DBD1] text-xs font-medium rounded-lg pl-3 pr-7 py-2 text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}