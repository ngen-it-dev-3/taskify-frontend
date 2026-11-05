// components/Layout/Sidebar.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";
import {
  ChevronLeft,
  ChevronDown,
  LogOut,
  CheckSquare,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  getSubMenuItems,
  hasAccess,
  type BadgeKey,
  type NavItem,
  type SubNavItem,
  type UserRole,
  type SectionId,
  getMenuItemsGroupedBySection,
} from "@/lib/menuItems";

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

// ============================================================================
// ⭐ RECURSIVE COMPONENT
// ============================================================================
interface SidebarItemProps {
  item: NavItem | SubNavItem;
  level: number;
  isCollapsed: boolean;
  expandedItems: Set<string>;
  toggleAccordion: (name: string, level: number) => void;
  pathname: string;
  getBadgeCount: (key: BadgeKey) => number;
  onClose?: () => void;
  hoveredTooltip: string | null;
  setHoveredTooltip: (val: string | null) => void;
}

function SidebarItem({
  item,
  level,
  isCollapsed,
  expandedItems,
  toggleAccordion,
  pathname,
  getBadgeCount,
  onClose,
  hoveredTooltip,
  setHoveredTooltip,
}: SidebarItemProps) {
  if (!item) return null;

  const itemName = item.name || "";
  const itemHref = item.href || "#";
  const children = item.children || [];
  const hasChildren = children.length > 0;

  const isExpanded = expandedItems.has(itemName);
  const Icon = item.icon || CheckSquare;

  const isItemActive = (href: string) => {
    if (!href || href === "#") return false;
    if (pathname === href) return true;
    const indexRoutes = ["/tenders", "/crm", "/projects", "/tasks", "/hr", "/accounts"];
    if (indexRoutes.includes(href)) return false;
    return pathname.startsWith(`${href}/`);
  };

  const active = isItemActive(itemHref);
  const isParentActive = children.some((child) => isItemActive(child.href || ""));

  const showBadge = item.badge || (item.badgeKey && getBadgeCount(item.badgeKey as BadgeKey) > 0);
  const badgeText = item.badge || (item.badgeKey ? getBadgeCount(item.badgeKey as BadgeKey).toString() : "");
  const isExternal = itemHref.startsWith("http");

  // ⭐ Light Mode Colors
  const levelStyles = {
    0: {
      padding: isCollapsed ? "justify-center px-0" : "px-3",
      text: "text-[14px] font-semibold",
      iconSize: 18,
      activeBg: "bg-green-600/10 text-green-700 shadow-sm ring-1 ring-green-600/20",
      hoverBg: "hover:bg-black/[0.04] text-slate-600 hover:text-slate-900"
    },
    1: {
      padding: isCollapsed ? "justify-center px-0" : "pl-2 pr-3",
      text: "text-[13px] font-medium",
      iconSize: 16,
      activeBg: "bg-white/60 text-green-700 shadow-sm ring-1 ring-black/5",
      hoverBg: "hover:bg-black/[0.03] text-slate-500 hover:text-slate-800"
    },
    2: {
      padding: isCollapsed ? "justify-center px-0" : "pl-6 pr-3",
      text: "text-[13px] font-medium",
      iconSize: 14,
      activeBg: "bg-green-600/10 text-green-600 ring-1 ring-green-600/20",
      hoverBg: "hover:bg-black/[0.03] text-slate-500 hover:text-slate-800"
    }
  };

  const currentLevel = Math.min(level, 2) as 0 | 1 | 2;
  const styles = levelStyles[currentLevel];

  const content = (
    <div
      onMouseEnter={() => isCollapsed && setHoveredTooltip(itemName)}
      onMouseLeave={() => isCollapsed && setHoveredTooltip(null)}
      className={` ring-olive-300
        group relative flex items-center h-9 mb-1.5 rounded-lg transition-all duration-200 w-full 
        ${styles.padding} ${styles.text}
        ${active || isParentActive ? styles.activeBg : styles.hoverBg}
      `}
    >
      {/* Active Indicator Bar (Level 0 only) */}
      {level === 0 && active && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-green-600 rounded-r-md" />
      )}

      <div className="shrink-0 flex items-center justify-center w-6 h-6">
        <Icon
          size={styles.iconSize}
          className={`transition-colors duration-200 ${active || isParentActive ? (level === 0 ? "text-green-600" : "text-green-500") : "text-slate-400 group-hover:text-slate-600"
            }`}
        />
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex items-center justify-between ml-2 min-w-0 pr-1">
          <span className="truncate">{itemName}</span>
          <div className="flex items-center gap-1.5 ml-auto">
            {isExternal && <ExternalLink size={12} className="text-slate-400 shrink-0" />}
            {showBadge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold tracking-wide ${item.badgeColor || "bg-green-500/20 text-green-700"}`}>
                {badgeText}
              </span>
            )}
            {hasChildren && (
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-slate-600" : ""}`} />
            )}
          </div>
        </div>
      )}

      {/* Tooltip for Collapsed Mode */}
      {isCollapsed && hoveredTooltip === itemName && (
        <div className="fixed left-[80px] z-50 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          {itemName}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {hasChildren ? (
        <button type="button" onClick={() => toggleAccordion(itemName, level)} className="w-full cursor-pointer block text-left outline-none">
          {content}
        </button>
      ) : isExternal ? (
        <a href={itemHref} target="_blank" rel="noopener noreferrer" onClick={onClose} className="block outline-none">
          {content}
        </a>
      ) : (
        <Link href={itemHref} onClick={onClose} className="block outline-none">
          {content}
        </Link>
      )}

      {/* Sub-items Accordion */}
      {hasChildren && !isCollapsed && (
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <ul className="overflow-hidden">
            {/* Vertical border line for nested items */}
            <div className={`relative ${level === 0 ? "ml-[22px] border-l border-black/10 pl-2" : ""}`}>
              {children.map((child, idx) => (
                <li key={`${child.id}-${idx}`}>
                  <SidebarItem
                    item={child}
                    level={level + 1}
                    isCollapsed={isCollapsed}
                    expandedItems={expandedItems}
                    toggleAccordion={toggleAccordion}
                    pathname={pathname}
                    getBadgeCount={getBadgeCount}
                    onClose={onClose}
                    hoveredTooltip={hoveredTooltip}
                    setHoveredTooltip={setHoveredTooltip}
                  />
                </li>
              ))}
            </div>
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN SIDEBAR
// ============================================================================
export default function Sidebar({ isMobileOpen, onClose, onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { getBadgeCount, refreshBadges } = useBadges();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const userRole = (user?.role || "employee") as UserRole;

  // Pre-calculate the entire menu tree
  const menuTree = useMemo(() => {
    try {
      const grouped = getMenuItemsGroupedBySection(userRole);

      const attachChildren = (items: (NavItem | SubNavItem)[], level: number): (NavItem | SubNavItem)[] => {
        if (level > 2) return items; // Max 3 levels deep

        return items.map((item) => {
          const children = getSubMenuItems(item.name, userRole);
          if (children.length > 0) {
            // ⭐ এখানে as NavItem যুক্ত করুন
            return { ...item, children: attachChildren(children, level + 1) } as NavItem;
          }
          // ⭐ এখানেও as NavItem যুক্ত করুন
          return item as NavItem;
        });
      };

      const processedGrouped = Object.entries(grouped).reduce((acc, [key, items]) => {
        acc[key as SectionId] = attachChildren(items, 0) as NavItem[];
        return acc;
      }, {} as Record<SectionId, NavItem[]>);

      return { grouped: processedGrouped };
    } catch (e) {
      console.error("Failed to build menu tree:", e);
      return { grouped: {} as Record<SectionId, NavItem[]> };
    }
  }, [userRole]);

  useEffect(() => {
    if (user) refreshBadges().catch(() => { });
  }, [user, refreshBadges]);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      const initialState = savedState === "true";
      setIsCollapsed(initialState);
      onCollapseChange?.(initialState);
    }
  }, [onCollapseChange]);

  const toggleCollapse = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
    onCollapseChange?.(newState);
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { collapsed: newState } }));
    if (newState) setExpandedItems(new Set());
  }, [isCollapsed, onCollapseChange]);

  // ⭐ STRICT ACCORDION LOGIC
  const toggleAccordion = (name: string, level: number) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      onCollapseChange?.(false);
      setExpandedItems(new Set([name]));
      return;
    }

    setExpandedItems((prev) => {
      const next = new Set(prev);
      const isCurrentlyOpen = next.has(name);

      // If clicking to close, just remove it
      if (isCurrentlyOpen) {
        next.delete(name);
        return next;
      }

      // If clicking to open
      if (level === 0) {
        // Level 0 (Main): Close all other Level 0 items
        return new Set([name]);
      } else {
        // Level 1 & 2 (Sub-items): 
        // Close ALL other Level 1 & 2 items, but keep their Level 0 parents open.

        // 1. Start with the newly opened item.
        const newSet = new Set<string>([name]);

        // 2. Keep all Level 0 items that are currently open. 
        Object.values(menuTree.grouped).flat().forEach((rootItem) => {
          if (prev.has(rootItem.name)) {
            newSet.add(rootItem.name);
          }
        });

        return newSet;
      }
    });
  };

  const sectionOrder: SectionId[] = [
    "main",
    "kpi",
    "crm",
    "tender",
    "projects",
    "tasks",
    "team",
    "hr",
    "reports",
    "accounts",
    "system",
    "support"
  ];

  const sidebarContent = (
    <aside className={`relative bg-[#ebf2e4] h-screen flex flex-col select-none border-r border-black/[0.08] shadow-2xl transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "w-[72px]" : "w-[270px]"}`}>
      {/* Background Gradients (Subtle for light mode) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-green-600/5 blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-purple-600/5 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="relative shrink-0 h-16 flex items-center px-4 border-b border-black/[0.08] z-20">
        {isCollapsed ? (
          <div className="w-full flex items-center justify-center">
            <button type="button" onClick={toggleCollapse} className="w-9 h-9 rounded-lg flex items-center justify-center bg-black/[0.03] hover:bg-black/[0.06] text-slate-600 border border-black/[0.05] transition-all">
              <ChevronLeft size={16} className="rotate-180" />
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between gap-2">
            {/* Logo Container */}
            <div className="flex items-center shrink-0">
              <img
                src="/orvix-logo.png"
                alt="Orvix Logo"
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Collapse Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="w-7 h-7 rounded-md flex items-center justify-center bg-transparent hover:bg-black/[0.05] text-slate-500 hover:text-slate-700 transition-all shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar z-10 ${isCollapsed ? "px-2" : "px-3"}`}>
        {sectionOrder.map((sectionId) => {
          const items = menuTree.grouped[sectionId];
          if (!items || items.length === 0) return null;

          return (
            <div key={sectionId} className="mb-1">
              {isCollapsed && <div className="my-3 mx-auto w-6 h-px bg-black/10" />}
              <div>
                {items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    level={0}
                    isCollapsed={isCollapsed}
                    expandedItems={expandedItems}
                    toggleAccordion={toggleAccordion}
                    pathname={pathname}
                    getBadgeCount={getBadgeCount}
                    onClose={onClose}
                    hoveredTooltip={hoveredTooltip}
                    setHoveredTooltip={setHoveredTooltip}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative shrink-0 p-3 border-t border-black/[0.08] backdrop-blur-md z-20">
        <button
          type="button"
          onClick={logout}
          onMouseEnter={() => isCollapsed && setHoveredTooltip("Sign Out")}
          onMouseLeave={() => isCollapsed && setHoveredTooltip(null)}
          className={`group relative w-full flex cursor-pointer items-center h-10 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-200 border border-transparent hover:border-rose-500/20 ${isCollapsed ? "justify-center px-0" : "px-3"}`}
        >
          <div className="shrink-0 flex items-center justify-center w-5 h-5">
            <LogOut size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between ml-3">
              <span className="text-[13px] font-semibold">Sign Out</span>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}
          {isCollapsed && hoveredTooltip === "Sign Out" && (
            <div className="fixed left-[80px] cursor-pointer z-50 px-3 py-1.5 bg-slate-800 text-rose-300 text-xs font-medium rounded-md shadow-xl border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block fixed left-0 top-0 h-full z-20">{sidebarContent}</div>
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
          <div className="fixed left-0 top-0 h-full z-40 lg:hidden shadow-2xl">{sidebarContent}</div>
        </>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.2); }
      `}</style>
    </>
  );
}