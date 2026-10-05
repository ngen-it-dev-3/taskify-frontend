// components/CRM/online-crm/KpiCards.tsx
'use client';

import React from 'react';

type CrmUser = {
  name: string;
  email: string;
  role: string;
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
  return (
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

      {/* ⭐ CRM Team — avatar stack with hover tooltip */}
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
            {/* Overlapping avatar stack */}
            <div className="flex items-center">
              {crmUsers.slice(0, 5).map((user, i) => (
                <AvatarBubble
                  key={`${user.email}-${i}`}
                  user={user}
                  index={i}
                  isFirst={i === 0}
                />
              ))}

              {/* "+N more" bubble */}
              {crmUsers.length > 5 && (
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white ml-[-8px]"
                  title={`${crmUsers.length - 5} more users`}
                >
                  +{crmUsers.length - 5}
                </div>
              )}
            </div>

            {/* Small helper text under the avatars */}
            <div className="text-[10px] text-slate-400 font-semibold mt-2">
              {crmUsers.length === 1
                ? '1 active member'
                : `${crmUsers.length} active members`}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* =========================================================
   ⭐ AVATAR BUBBLE — rounded profile with hover tooltip
   ========================================================= */
function AvatarBubble({
  user,
  index,
  isFirst,
}: {
  user: CrmUser;
  index: number;
  isFirst: boolean;
}) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Color palette — cycles through for variety
  const palette = [
    'bg-[#1F3864] text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
  ];
  const colorCls = palette[index % palette.length];

  return (
    <div
      className={`group relative ${isFirst ? '' : 'ml-[-8px]'}`}
      style={{ zIndex: 10 - index }}
    >
      {/* Avatar circle */}
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
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-1 overflow-hidden">
          <div className="w-2 h-2 bg-slate-900 rotate-45 -translate-y-1" />
        </div>
      </div>
    </div>
  );
}

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