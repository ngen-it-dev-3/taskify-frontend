// components/CRM/online-crm/KpiCards.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X, Mail, Briefcase, Calendar, TrendingUp } from 'lucide-react';

type CrmUser = {
  name: string;
  email: string;
  role: string;
  /** ⭐ Optional stats — pass these if your API provides them */
  queriesToday?: number;
  queriesThisMonth?: number;
  queriesAllTime?: number;
  status?: 'active' | 'away' | 'offline';
  jobTitle?: string;
};

export function KpiRow({
  activeCount,
  quotedValueBDT,
  quotedValueUSD,
  quotedCount,
  notQuoted,
  overdue,
  crmManager,
  crmUsers = [],
  crmUsersCount = 0,
}: {
  activeCount: number;
  quotedValueBDT: number;
  quotedValueUSD: number;
  quotedCount: number;
  notQuoted: number;
  overdue: number;
  crmManager: string;
  crmUsers?: CrmUser[];
  crmUsersCount?: number;
}) {
  // ⭐ Currently selected user → opens modal
  const [selectedUser, setSelectedUser] = useState<CrmUser | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <Title>Active Queries</Title>
          <Big>{activeCount}</Big>
          <Sub>To Start + Not Quoted + Quoted</Sub>
        </Card>

        <Card>
          <Title>Quoted Value</Title>
          <Big>
            ৳{quotedValueBDT.toLocaleString()}
            {quotedValueUSD > 0 && (
              <span className="text-slate-400">
                {' '}
                + ${quotedValueUSD.toLocaleString()}
              </span>
            )}
          </Big>
          <Sub>{quotedCount} quoted queries</Sub>
        </Card>

        <Card>
          <Title>Not Quoted</Title>
          <Big>{notQuoted}</Big>
          <Sub>Awaiting pricing</Sub>
        </Card>

        <Card>
          <Title>Overdue (&gt;15 days)</Title>
          <Big className="text-rose-600">{overdue}</Big>
          <Sub>Needs follow-up</Sub>
        </Card>

        {/* ⭐ CRM Team — avatar stack with hover tooltip + click to open modal */}
        <Card>
          <Title>
            CRM Team{' '}
            {crmUsersCount > 0 && (
              <span className="text-slate-400 font-normal">
                ({crmUsersCount})
              </span>
            )}
          </Title>

          {crmUsers.length === 0 ? (
            <div className="mt-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-500">
                ?
              </div>
              <div>
                <div className="text-[13px] font-bold text-slate-800">
                  No CRM users
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  ○ Nobody on record
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex items-center">
                {crmUsers.slice(0, 5).map((user, i) => (
                  <AvatarBubble
                    key={`${user.email}-${i}`}
                    user={user}
                    index={i}
                    isFirst={i === 0}
                    onOpen={() => setSelectedUser(user)}
                  />
                ))}

                {crmUsers.length > 5 && (
                  <div
                    className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white ml-[-8px]"
                    title={`${crmUsers.length - 5} more users`}
                  >
                    +{crmUsers.length - 5}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 font-semibold mt-2">
                {crmUsers.length === 1
                  ? '1 active member'
                  : `${crmUsers.length} Available Members`}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ⭐ Person detail modal */}
      {selectedUser && (
        <CrmUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}

/* =========================================================
   AVATAR BUBBLE
   ========================================================= */
function AvatarBubble({
  user,
  index,
  isFirst,
  onOpen,
}: {
  user: CrmUser;
  index: number;
  isFirst: boolean;
  onOpen: () => void;
}) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const palette = [
    'bg-[#1F3864] text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
  ];
  const colorCls = palette[index % palette.length];

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative focus:outline-none ${isFirst ? '' : 'ml-[-8px]'}`}
      style={{ zIndex: 10 - index }}
      title={`View ${user.name}`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-white cursor-pointer transition-transform duration-200 ease-out group-hover:scale-125 group-hover:z-50 group-hover:shadow-lg ${colorCls}`}
      >
        <span className="text-[10px] font-bold leading-none">
          {initials}
        </span>
      </div>

      {/* Hover tooltip */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        <div className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-white shadow-xl">
          <div className="text-[11px] font-bold leading-tight">
            {user.name}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-300 leading-tight mt-0.5">
            {user.role.replace(/_/g, ' ')}
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-1 overflow-hidden">
          <div className="w-2 h-2 bg-slate-900 rotate-45 -translate-y-1" />
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   ⭐ CRM USER DETAIL MODAL
   ========================================================= */
function CrmUserModal({
  user,
  onClose,
}: {
  user: CrmUser;
  onClose: () => void;
}) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Status badge styling
  const status = user.status || 'active';
  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    away: 'bg-amber-50 text-amber-700 ring-amber-200',
    offline: 'bg-slate-100 text-slate-500 ring-slate-200',
  };
  const statusLabels: Record<string, string> = {
    active: 'Active now',
    away: 'Away',
    offline: 'Offline',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header ---- */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            {/* Avatar */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F3864] text-white text-[15px] font-bold shrink-0">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="font-serif text-xl font-bold text-[#0F2D4A] leading-tight truncate">
                {user.name}
              </h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500 truncate">
                {user.jobTitle ||
                  `${user.role.replace(/_/g, ' ')} · Online Query Desk`}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ---- Status row ---- */}
        <div className="flex items-center justify-between py-3 border-t border-b border-[#F0EBE3]">
          <span className="text-[12px] font-semibold text-slate-700">
            Status
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ring-1 ${statusStyles[status]}`}
          >
            {status === 'active' && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {statusLabels[status]}
          </span>
        </div>

        {/* ---- Stats rows ---- */}
        <div className="divide-y divide-[#F0EBE3]">
          <StatRow
            label="Queries Handled Today"
            value={user.queriesToday ?? 0}
          />
          <StatRow
            label="Queries Handled This Month"
            value={user.queriesThisMonth ?? 0}
          />
          <StatRow
            label="Total Queries Handled (All Time)"
            value={user.queriesAllTime ?? 0}
          />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[12px] text-slate-700">{label}</span>
      <span className="font-mono text-[13px] font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   BASE ATOMS
   ========================================================= */
function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#EBE6DF] bg-white p-4 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </div>
  );
}

function Big({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mt-2 font-mono text-2xl font-bold text-[#0F2D4A] ${className}`}
    >
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 text-[10.5px] text-slate-500">{children}</div>
  );
}