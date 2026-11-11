// components/tender/site-directory/SiteDirectory.tsx
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import toast from "react-hot-toast";
import {
    Search,
    X,
    Loader2,
    Plus,
    Trash2,
    Pencil,
    Save,
    Power,
    Globe,
    ExternalLink,
    Lock,
    Unlock,
    Copy,
    Play,
    CheckCircle2,
    AlertCircle,
    Clock,
    Cpu,
    Zap,
    Eye,
} from "lucide-react";
import { useTenderStats } from "@/hooks/tender/useTenders";

/* ============================================================
   TYPES
   ============================================================ */
type RenderMode = "auto" | "cheerio" | "puppeteer";
type MainTab = "directory" | "credentials" | "crawler"; // ⭐ নতুন ট্যাব "crawler"
type CredentialTab = "sites" | "access" | "activity";

interface SiteSource {
    _id: string;
    name: string;
    url: string;
    domain?: string;
    listSelector: string;
    titleSelector: string;
    linkSelector: string;
    dateSelector: string;
    linkAttr: string;
    absoluteLinks?: boolean;
    active: boolean;
    renderMode: RenderMode;
    sector?: string;
    portalUrl?: string;
    popular?: boolean;
    popularShort?: string;
    popularColor?: string;
    popularSubtitle?: string;
    siteInfoSector?: string;
    siteInfoPortalType?: string;
    siteInfoContact?: string;
    sectionSelector?: string;
    
    username?: string;
    password?: string;
    credentialType?: "Enlisted" | "Open bid";
    registeredAs?: string;
    registeredEmail?: string;
    registrationRenewal?: string;
    notes?: string;

    lastCrawledAt?: string | null;
    lastCrawlStatus?: "idle" | "success" | "error" | "";
    lastCrawlError?: string;
    lastItemCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface DraftSite {
    _id?: string;
    name: string;
    url: string;
    listSelector: string;
    titleSelector: string;
    linkSelector: string;
    dateSelector: string;
    linkAttr: string;
    active: boolean;
    renderMode: RenderMode;
    sector: string;
    portalUrl: string;
    popular: boolean;
    popularShort: string;
    popularColor: string;
    popularSubtitle: string;
    siteInfoSector: string;
    siteInfoPortalType: string;
    siteInfoContact: string;
    sectionSelector: string;
    username: string;
    password: string;
    credentialType: "Enlisted" | "Open bid";
    registeredAs: string;
    registeredEmail: string;
    registrationRenewal: string;
    notes: string;
}

interface RelatedRow {
    tender: string;
    stage: string;
    value: string;
    status: string;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "https://taskify-server-5gat.onrender.com/api/v1";

const SECTORS: { id: string; label: string }[] = [
    { id: "banks", label: "Banks" },
    { id: "power", label: "Power & Energy" },
    { id: "oilgas", label: "Oil & Gas" },
    { id: "govt", label: "Government" },
];

const SECTOR_PRESETS: Record<string, { displaySector: string; contact: string }> = {
    banks: { displaySector: "Central Bank · Financial", contact: "Procurement Cell" },
    power: { displaySector: "Power & Energy · Utility", contact: "Procurement Division" },
    oilgas: { displaySector: "Oil & Gas · Energy", contact: "Contracts & Procurement" },
    govt: { displaySector: "Government · Public Sector", contact: "Public Procurement Cell" },
};

const EMPTY_DRAFT: DraftSite = {
    name: "", url: "", listSelector: "", titleSelector: "", linkSelector: "", dateSelector: "",
    linkAttr: "href", active: true, renderMode: "auto", sector: "banks", portalUrl: "",
    popular: false, popularShort: "", popularColor: "#1F3864", popularSubtitle: "",
    siteInfoSector: SECTOR_PRESETS.banks.displaySector, siteInfoPortalType: "", siteInfoContact: SECTOR_PRESETS.banks.contact,
    sectionSelector: "", username: "", password: "", credentialType: "Enlisted",
    registeredAs: "", registeredEmail: "", registrationRenewal: "", notes: "",
};

function authHeaders(): HeadersInit {
    if (typeof window === "undefined") return { "Content-Type": "application/json" };
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || sessionStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function formatDateTime(iso: string | null | undefined) {
    if (!iso) return "Never";
    try {
        return new Date(iso).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    } catch { return "—"; }
}

function StagePill({ stage }: { stage: string }) {
    const s = stage.toLowerCase();
    const cls =
        s === "submitted" ? "bg-[#1e3a5f] text-white" :
        s === "active" ? "bg-[#f5ecd8] text-[#a97400]" :
        "bg-[#fff3d6] text-[#8a5a00]";
    return (
        <span className={`inline-block rounded-full px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.04em] ${cls}`}>
            {stage}
        </span>
    );
}

/* ============================================================
   RELATED PANEL
   ============================================================ */
function RelatedPanel({ title, rows, emptyMessage }: { title: string; rows: RelatedRow[]; emptyMessage?: string; }) {
    return (
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e2e8f0", marginTop: 16 }}>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-900">{title}</div>
            {rows.length === 0 ? (
                <div className="text-[12.5px] text-slate-500">{emptyMessage ?? "No Active or Potential tenders currently tracked."}</div>
            ) : (
                <div className="overflow-hidden rounded-md border" style={{ borderColor: "#e2e8f0" }}>
                    <table className="w-full border-collapse text-left text-[12.5px]">
                        <thead>
                            <tr style={{ background: "#fbfaf6" }}>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Tender</th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Stage</th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Value</th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                                    <td className="px-4 py-3 text-slate-800">{r.tender}</td>
                                    <td className="px-4 py-3"><StagePill stage={r.stage} /></td>
                                    <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{r.value}</td>
                                    <td className="px-4 py-3 text-slate-600">{r.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   SITE MODAL (Add / Edit)
   ============================================================ */
function SiteModal({
    draft, setDraft, onClose, onSave, saving,
}: {
    draft: DraftSite; setDraft: (d: DraftSite) => void; onClose: () => void; onSave: () => void; saving: boolean;
}) {
    const patch = (p: Partial<DraftSite>) => setDraft({ ...draft, ...p });
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
        const onMouseDown = (e: MouseEvent) => {
            if (saving) return;
            const el = dialogRef.current;
            if (!el) return;
            if (!el.contains(e.target as Node)) onClose();
        };
        window.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onMouseDown);
        return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onMouseDown); };
    }, [onClose, saving]);

    const inputCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50";
    const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[5vh] backdrop-blur-sm">
            <div ref={dialogRef} className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{draft._id ? "Edit site" : "Add site"}</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">External site with its own login. Do not paste personal passwords.</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Site Name *</label>
                            <input type="text" value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. UNGM" disabled={saving} className={inputCls} autoFocus />
                        </div>
                        <div>
                            <label className={labelCls}>Full Name</label>
                            <input type="text" value={draft.siteInfoSector || ""} onChange={(e) => patch({ siteInfoSector: e.target.value })} placeholder="e.g. United Nations Global Marketplace" disabled={saving} className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Type</label>
                            <select value={draft.credentialType} onChange={(e) => patch({ credentialType: e.target.value as "Enlisted" | "Open bid" })} disabled={saving} className={inputCls}>
                                <option value="Enlisted">Enlisted</option>
                                <option value="Open bid">Open bid</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Registered As</label>
                            <select value={draft.registeredAs} onChange={(e) => patch({ registeredAs: e.target.value })} disabled={saving} className={inputCls}>
                                <option value="">Select entity...</option>
                                <option value="NGL-26">NGL-26</option>
                                <option value="NG-26">NG-26</option>
                                <option value="JT">JT</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Website Address</label>
                        <input type="url" value={draft.url} onChange={(e) => patch({ url: e.target.value })} placeholder="https://www.ungm.org" disabled={saving} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Username *</label>
                            <input type="text" value={draft.username} onChange={(e) => patch({ username: e.target.value })} placeholder="sample-user-ungm" disabled={saving} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Password *</label>
                            <input type="password" value={draft.password} onChange={(e) => patch({ password: e.target.value })} placeholder="••••••••••" disabled={saving} className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Registered email / phone</label>
                            <input type="text" value={draft.registeredEmail} onChange={(e) => patch({ registeredEmail: e.target.value })} placeholder="tender@ngemit.com" disabled={saving} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Registration renewal date</label>
                            <input type="date" value={draft.registrationRenewal} onChange={(e) => patch({ registrationRenewal: e.target.value })} disabled={saving} className={inputCls} />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Notes (OTP, digital signature, who holds the token)</label>
                        <input type="text" value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Sample entry. Replace with the real login." disabled={saving} className={inputCls} />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <button type="button" onClick={onSave} disabled={saving} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   CRAWLER SITE MODAL (Add / Edit with Selectors)
   ============================================================ */
function CrawlerSiteModal({
    draft, setDraft, onClose, onSave, saving, onPreview, preview, previewing
}: {
    draft: DraftSite; setDraft: (d: DraftSite) => void; onClose: () => void; onSave: () => void; saving: boolean;
    onPreview: () => void; preview: any; previewing: boolean;
}) {
    const patch = (p: Partial<DraftSite>) => setDraft({ ...draft, ...p });
    const inputCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50";
    const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[5vh] backdrop-blur-sm">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{draft._id ? "Edit Crawler Site" : "Add Crawler Site"}</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">Fill in the site URL, render mode, and CSS selectors.</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Site Name *</label>
                            <input type="text" value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. BPDB" disabled={saving} className={inputCls} autoFocus />
                        </div>
                        <div>
                            <label className={labelCls}>Status</label>
                            <button type="button" onClick={() => patch({ active: !draft.active })} disabled={saving} className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border text-[12px] font-semibold transition ${draft.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
                                <Power className="h-3.5 w-3.5" /> {draft.active ? "Active" : "Inactive"}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Tender Listing URL *</label>
                        <input type="url" value={draft.url} onChange={(e) => patch({ url: e.target.value })} placeholder="https://example.gov.bd/tenders" disabled={saving} className={inputCls} />
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                        <label className={labelCls}>Render Mode</label>
                        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button type="button" onClick={() => patch({ renderMode: "cheerio" })} disabled={saving} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${draft.renderMode === "cheerio" ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                                <Zap className={`mt-0.5 h-4 w-4 shrink-0 ${draft.renderMode === "cheerio" ? "text-blue-600" : "text-slate-400"}`} />
                                <div className="min-w-0">
                                    <p className="text-[12px] font-bold text-slate-800">Cheerio</p>
                                    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">Fast. Fetches HTML only. Use for static sites.</p>
                                </div>
                            </button>
                            <button type="button" onClick={() => patch({ renderMode: "puppeteer" })} disabled={saving} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${draft.renderMode === "puppeteer" ? "border-purple-300 bg-purple-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                                <Cpu className={`mt-0.5 h-4 w-4 shrink-0 ${draft.renderMode === "puppeteer" ? "text-purple-600" : "text-slate-400"}`} />
                                <div className="min-w-0">
                                    <p className="text-[12px] font-bold text-slate-800">Puppeteer</p>
                                    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">Slow but powerful. Runs a real browser.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">CSS Selectors</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div><label className={labelCls}>Row Selector *</label><input type="text" value={draft.listSelector} onChange={(e) => patch({ listSelector: e.target.value })} placeholder="e.g. #dataTable tbody tr" disabled={saving} className={`${inputCls} font-mono`} /></div>
                            <div><label className={labelCls}>Title Selector</label><input type="text" value={draft.titleSelector} onChange={(e) => patch({ titleSelector: e.target.value })} placeholder="td.title a" disabled={saving} className={`${inputCls} font-mono`} /></div>
                            <div><label className={labelCls}>Link Selector</label><input type="text" value={draft.linkSelector} onChange={(e) => patch({ linkSelector: e.target.value })} placeholder="td.title a" disabled={saving} className={`${inputCls} font-mono`} /></div>
                            <div><label className={labelCls}>Date Selector</label><input type="text" value={draft.dateSelector} onChange={(e) => patch({ dateSelector: e.target.value })} placeholder="td.date" disabled={saving} className={`${inputCls} font-mono`} /></div>
                        </div>
                        <div className="mt-3">
                            <label className={labelCls}>Link Attribute</label>
                            <input type="text" value={draft.linkAttr} onChange={(e) => patch({ linkAttr: e.target.value })} placeholder="href" disabled={saving} className={`${inputCls} font-mono sm:w-40`} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-[11px] text-slate-500">Test the selectors before saving.</p>
                        <button type="button" onClick={onPreview} disabled={previewing || saving} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                            {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />} {previewing ? "Testing…" : "Preview"}
                        </button>
                    </div>

                    {preview && (
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Preview — {preview.count} items</p>
                                {preview.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            </div>
                            {!preview.ok && preview.error && <p className="rounded-md border border-rose-100 bg-rose-50/50 p-2 text-[11px] text-rose-700">{preview.error}</p>}
                            {preview.ok && preview.tenders.length > 0 && (
                                <ul className="max-h-[220px] space-y-1.5 overflow-y-auto">
                                    {preview.tenders.slice(0, 10).map((t: any, i: number) => (
                                        <li key={i} className="rounded border border-slate-100 bg-slate-50/60 px-2.5 py-1.5 text-[11px]">
                                            <p className="font-semibold text-slate-800">{t.title || "(no title)"}</p>
                                            <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{t.tenderLink || "(no link)"}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <button type="button" onClick={onClose} disabled={saving} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                    <button type="button" onClick={onSave} disabled={saving} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving…" : "Save Site"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function SiteDirectory() {
    const [mainTab, setMainTab] = useState<MainTab>("directory");
    const [credTab, setCredTab] = useState<CredentialTab>("sites");

    const [sites, setSites] = useState<SiteSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    const [category, setCategory] = useState<string>("banks");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [openDetailId, setOpenDetailId] = useState<string | null>(null);
    const [infoKey, setInfoKey] = useState<string | null>(null);

    // Main Site Modal (Credentials / Directory)
    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState<DraftSite>(EMPTY_DRAFT);
    const [modalSaving, setModalSaving] = useState(false);

    // ⭐ Crawler Modal (Selectors)
    const [crawlerModalOpen, setCrawlerModalOpen] = useState(false);
    const [crawlerDraft, setCrawlerDraft] = useState<DraftSite>(EMPTY_DRAFT);
    const [preview, setPreview] = useState<any>(null);
    const [previewing, setPreviewing] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);

    // Credential states
    const [credUsers, setCredUsers] = useState<any[]>([]);
    const [credLogs, setCredLogs] = useState<any[]>([]);
    const [loadingCreds, setLoadingCreds] = useState(false);
    const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
    const [credTypeFilter, setCredTypeFilter] = useState("All types");

    const { groups } = useTenderStats();

    // Load Sites
    const loadSites = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE}/tenders/sites`, { headers: authHeaders() });
            const json = await r.json();
            if (json.success) setSites(json.data);
        } catch (err) { toast.error("Failed to load sites"); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadSites(); }, [loadSites]);

    // Load Credential Data
    const loadCredData = useCallback(async () => {
        setLoadingCreds(true);
        try {
            const [uRes, lRes] = await Promise.all([
                fetch(`${API_BASE}/credentials/users`, { headers: authHeaders() }),
                fetch(`${API_BASE}/credentials/logs`, { headers: authHeaders() }),
            ]);
            const uJson = await uRes.json();
            const lJson = await lRes.json();
            if (uJson.success) setCredUsers(uJson.data);
            if (lJson.success) setCredLogs(lJson.data);
        } catch (err) { toast.error("Failed to load credential data"); } 
        finally { setLoadingCreds(false); }
    }, []);

    useEffect(() => {
        if (mainTab === "credentials") loadCredData();
    }, [mainTab, loadCredData]);

    // Filters
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = sites.filter((s) => (s.sector ?? "banks") === category);
        if (!q) return list;
        return list.filter((s) => s.name.toLowerCase().includes(q));
    }, [sites, category, search]);

    const credSites = useMemo(() => {
        let list = sites.filter((s) => (s.sector ?? "banks") === category);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(s => s.name.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q));
        }
        if (credTypeFilter !== "All types") list = list.filter(s => s.credentialType === credTypeFilter);
        return list;
    }, [sites, search, credTypeFilter, category]);

    // Popular list
    const popularAll = useMemo(() => sites.filter((s) => s.popular === true && s.active !== false), [sites]);
    const popular = useMemo(() => popularAll.slice(page * 3, page * 3 + 3), [popularAll, page]);
    const hasPrev = page > 0;
    const hasNext = (page + 1) * 3 < popularAll.length;

    const openSite = useMemo(() => openDetailId ? sites.find((s) => s._id === openDetailId) : null, [openDetailId, sites]);

    // Info modal data
    const info = useMemo(() => {
        if (!infoKey) return null;
        const s = sites.find((x) => x._id === infoKey);
        if (!s) return null;
        return {
            title: s.name,
            rows: [
                { label: "Sector", value: s.siteInfoSector || s.sector || "—" },
                { label: "Tender Portal Type", value: s.siteInfoPortalType || "—" },
                { label: "Site Contact", value: s.siteInfoContact || "—" },
            ],
        };
    }, [infoKey, sites]);

    const relatedRows = useMemo<RelatedRow[]>(() => {
        if (!openSite) return [];
        const all = [...(groups.potential ?? []), ...(groups.active ?? []), ...(groups.submitted ?? [])];
        return all.filter((t) => t.tenderer === openSite.name).map((t) => ({
            tender: t.title,
            stage: t.stage === "potential" ? "Potential" : t.stage === "active" ? "Active" : "Submitted",
            value: t.tentativeBudget ? `৳${t.tentativeBudget.toLocaleString("en-IN")}` : "—",
            status: t.stage === "submitted" ? "Awaiting result" : t.stage === "active" ? `Docs: ${t.docStatus ?? "—"}` : "Under review",
        }));
    }, [openSite, groups]);

    // ✅ AUTO-SELECT FIRST ROW
    useEffect(() => {
        if (openDetailId && filtered.some(s => s._id === openDetailId)) return;
        setOpenDetailId(filtered[0]?._id ?? null);
    }, [filtered, openDetailId]);

    // Handlers
    const openNew = () => { setDraft({ ...EMPTY_DRAFT, sector: category }); setModalOpen(true); };
    
    const openEdit = (site: SiteSource) => {
        setDraft({
            _id: site._id, name: site.name, url: site.url, listSelector: site.listSelector || "", titleSelector: site.titleSelector || "",
            linkSelector: site.linkSelector || "", dateSelector: site.dateSelector || "", linkAttr: site.linkAttr || "href",
            active: site.active, renderMode: site.renderMode || "auto", sector: site.sector || "banks", portalUrl: site.portalUrl || "",
            popular: !!site.popular, popularShort: site.popularShort || "", popularColor: site.popularColor || "#1F3864", popularSubtitle: site.popularSubtitle || "",
            siteInfoSector: site.siteInfoSector || "", siteInfoPortalType: site.siteInfoPortalType || "", siteInfoContact: site.siteInfoContact || "",
            sectionSelector: site.sectionSelector || "", username: site.username || "", password: site.password || "",
            credentialType: site.credentialType || "Enlisted", registeredAs: site.registeredAs || "", registeredEmail: site.registeredEmail || "",
            registrationRenewal: site.registrationRenewal ? new Date(site.registrationRenewal).toISOString().split("T")[0] : "", notes: site.notes || "",
        });
        setModalOpen(true);
    };

    // ⭐ Crawler Handlers
    const openNewCrawler = () => { 
        setCrawlerDraft({ ...EMPTY_DRAFT, renderMode: "cheerio" }); 
        setPreview(null);
        setCrawlerModalOpen(true); 
    };

    const openEditCrawler = (site: SiteSource) => {
        setCrawlerDraft({
            ...EMPTY_DRAFT,
            _id: site._id,
            name: site.name,
            url: site.url,
            listSelector: site.listSelector || "",
            titleSelector: site.titleSelector || "",
            linkSelector: site.linkSelector || "",
            dateSelector: site.dateSelector || "",
            linkAttr: site.linkAttr || "href",
            active: site.active,
            renderMode: site.renderMode || "cheerio",
        });
        setPreview(null);
        setCrawlerModalOpen(true);
    };

    const handlePreviewCrawler = async () => {
        if (!crawlerDraft.url.trim() || !crawlerDraft.listSelector.trim()) {
            toast.error("URL and List Selector are required");
            return;
        }
        setPreviewing(true);
        setPreview(null);
        const loadingId = toast.loading(crawlerDraft.renderMode === "puppeteer" ? "Launching browser..." : "Fetching page...");
        try {
            const r = await fetch(`${API_BASE}/tenders/sites/preview`, {
                method: "POST", headers: authHeaders(),
                body: JSON.stringify({
                    url: crawlerDraft.url, listSelector: crawlerDraft.listSelector,
                    titleSelector: crawlerDraft.titleSelector, linkSelector: crawlerDraft.linkSelector,
                    dateSelector: crawlerDraft.dateSelector, linkAttr: crawlerDraft.linkAttr,
                    renderMode: crawlerDraft.renderMode,
                }),
            });
            const json = await r.json();
            if (!json.success) throw new Error(json.data?.error || "Preview failed");
            setPreview(json.data);
            toast.success(`Found ${json.data.count} items`, { id: loadingId });
        } catch (e) {
            toast.error((e as Error).message || "Preview failed", { id: loadingId });
        } finally { setPreviewing(false); }
    };

    const handleSaveCrawler = async () => {
        if (!crawlerDraft.name.trim() || !crawlerDraft.url.trim() || !crawlerDraft.listSelector.trim()) {
            toast.error("Name, URL, and List Selector are required");
            return;
        }
        setModalSaving(true);
        const isEdit = !!crawlerDraft._id;
        const loadingId = toast.loading(isEdit ? "Updating site..." : "Creating site...");
        try {
            const url = isEdit ? `${API_BASE}/tenders/sites/${crawlerDraft._id}` : `${API_BASE}/tenders/sites`;
            const r = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(crawlerDraft) });
            const json = await r.json();
            if (!json.success) throw new Error(json.message || "Save failed");
            toast.success(isEdit ? "Site updated" : "Site added", { id: loadingId });
            setCrawlerModalOpen(false);
            loadSites();
        } catch (e) {
            toast.error((e as Error).message || "Save failed", { id: loadingId });
        } finally { setModalSaving(false); }
    };

    const handleDeleteCrawler = async (site: SiteSource) => {
        if (!window.confirm(`Delete "${site.name}"? This won't delete any tenders already crawled.`)) return;
        setDeletingId(site._id);
        try {
            const r = await fetch(`${API_BASE}/tenders/sites/${site._id}`, { method: "DELETE", headers: authHeaders() });
            const json = await r.json();
            if (!json.success) throw new Error(json.message || "Delete failed");
            toast.success("Site deleted");
            loadSites();
        } catch (e) {
            toast.error((e as Error).message || "Delete failed");
        } finally { setDeletingId(null); }
    };

    const handleToggleCrawlerActive = async (site: SiteSource) => {
        const snapshot = sites;
        setSites((prev) => prev.map((s) => s._id === site._id ? { ...s, active: !s.active } : s));
        try {
            const r = await fetch(`${API_BASE}/tenders/sites/${site._id}`, {
                method: "PUT", headers: authHeaders(), body: JSON.stringify({ active: !site.active }),
            });
            const json = await r.json();
            if (!json.success) throw new Error(json.message || "Update failed");
        } catch (e) {
            setSites(snapshot);
            toast.error((e as Error).message || "Update failed");
        }
    };

    const handleTestCrawler = async (site: SiteSource) => {
        setTestingId(site._id);
        const loadingId = toast.loading(`Testing ${site.name}...`);
        try {
            const r = await fetch(`${API_BASE}/tenders/sites/preview`, {
                method: "POST", headers: authHeaders(),
                body: JSON.stringify({
                    url: site.url, listSelector: site.listSelector,
                    titleSelector: site.titleSelector, linkSelector: site.linkSelector,
                    dateSelector: site.dateSelector, linkAttr: site.linkAttr,
                    renderMode: site.renderMode || "cheerio",
                }),
            });
            const json = await r.json();
            if (!json.success) throw new Error(json.data?.error || "Test failed");
            toast.success(`Found ${json.data.count} items on ${site.name}`, { id: loadingId });
        } catch (e) {
            toast.error((e as Error).message || "Test failed", { id: loadingId });
        } finally { setTestingId(null); }
    };

    const handleSaveDraft = async () => {
        if (!draft.name.trim() || !draft.url.trim()) return toast.error("Name and URL are required");
        setModalSaving(true);
        const isEdit = !!draft._id;
        try {
            const payload = {
                ...draft,
                registrationRenewal: draft.registrationRenewal ? new Date(draft.registrationRenewal).toISOString() : null,
            };
            const url = isEdit ? `${API_BASE}/tenders/sites/${draft._id}` : `${API_BASE}/tenders/sites`;
            const r = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(payload) });
            const json = await r.json();
            if (!json.success) throw new Error(json.message);
            toast.success(isEdit ? "Site updated" : "Site added");
            setModalOpen(false);
            loadSites();
        } catch (e: any) { toast.error(e.message || "Save failed"); } 
        finally { setModalSaving(false); }
    };

    const handleDelete = async (site: SiteSource) => {
        if (!window.confirm(`Delete "${site.name}"?`)) return;
        setDeletingId(site._id);
        try {
            await fetch(`${API_BASE}/tenders/sites/${site._id}`, { method: "DELETE", headers: authHeaders() });
            toast.success("Site deleted");
            loadSites();
        } catch (e) { toast.error("Delete failed"); } 
        finally { setDeletingId(null); }
    };

    const handleToggleAccess = async (userId: string, hasAccess: boolean) => {
        try {
            const r = await fetch(`${API_BASE}/credentials/users/${userId}/access`, {
                method: "PATCH", headers: authHeaders(), body: JSON.stringify({ hasAccess }),
            });
            const json = await r.json();
            if (!json.success) throw new Error(json.message);
            toast.success(`Access ${hasAccess ? "granted" : "revoked"}`);
            loadCredData();
        } catch (err: any) { toast.error(err.message || "Failed to update access"); }
    };

    const logAction = async (action: "reveal" | "copy", site: SiteSource) => {
        try {
            await fetch(`${API_BASE}/credentials/log`, {
                method: "POST", headers: authHeaders(),
                body: JSON.stringify({ action, siteId: site._id, siteName: site.name, details: `${action === "reveal" ? "Revealed" : "Copied"} credentials for ${site.name}` }),
            });
        } catch (err) { console.error("Log failed", err); }
    };

    const copyToClipboard = (text: string, site: SiteSource) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied");
        logAction("copy", site);
    };

    const handleReveal = (site: SiteSource) => {
        setShowPasswordId(site._id);
        logAction("reveal", site);
    };

    // Filter crawler sites
    const crawlerSites = useMemo(() => {
        if (!search.trim()) return sites;
        const q = search.trim().toLowerCase();
        return sites.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
    }, [sites, search]);

    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#a97400]">TENDER DASHBOARD</p>
                    <h1 className="mt-0.5 font-serif text-2xl font-bold tracking-tight text-slate-900">Site Directory &amp; Credentials</h1>
                    <p className="mt-1 text-[12px] text-slate-500">Every organisation that publishes tenders, and the logins for the tender sites we use.</p>
                </div>
                <button onClick={openNew} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100]">
                    <Plus className="h-3.5 w-3.5" /> Add site
                </button>
            </div>

            {/* MAIN TABS */}
            <div className="flex items-center gap-3">
                <button onClick={() => setMainTab("directory")} className={`inline-flex h-9 items-center rounded-full px-4 text-[12px] font-semibold transition-colors ${mainTab === "directory" ? "bg-white border border-slate-300 shadow-sm text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}>Site Directory</button>
                <button onClick={() => setMainTab("credentials")} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold transition-colors ${mainTab === "credentials" ? "bg-[#f4ebd8] border border-[#d5b98a] text-[#a97400]" : "text-slate-600 hover:bg-slate-100"}`}><Lock className="h-3.5 w-3.5" /> Credentials</button>
                {/* ⭐ নতুন ট্যাব */}
                <button onClick={() => setMainTab("crawler")} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold transition-colors ${mainTab === "crawler" ? "bg-[#f4ebd8] border border-[#d5b98a] text-[#a97400]" : "text-slate-600 hover:bg-slate-100"}`}><Globe className="h-3.5 w-3.5" /> Crawler Sites</button>
            </div>

            {/* DIRECTORY TAB */}
            {mainTab === "directory" && (
                <>
                    <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-white px-4 py-3" style={{ borderColor: "#e2e8f0" }}>
                        <div className="relative w-1/3 min-w-[220px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-slate-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company name…" className="h-[38px] w-full rounded-lg border bg-white pl-8 pr-3 text-[12.5px] text-slate-800 focus:border-slate-900 focus:outline-none" style={{ borderColor: "#e2e8f0" }} />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 border-b" style={{ borderColor: "#e2e8f0" }}>
                        {SECTORS.map((c) => (
                            <button key={c.id} onClick={() => { setCategory(c.id); setSearch(""); }} className={`relative -mb-px pb-2 text-[12px] font-semibold transition ${category === c.id ? "text-[#a97400]" : "text-slate-500 hover:text-slate-800"}`}>
                                {c.label}
                                {category === c.id && <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#a97400]" />}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#e2e8f0" }}>
                            {loading && sites.length === 0 && <div className="p-10 text-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>}
                            {!loading && filtered.map((e, idx) => {
                                const isHighlighted = e._id === openDetailId;
                                return (
                                    <div key={e._id} style={{ borderTop: idx === 0 ? "none" : "1px solid #f1f5f9" }}>
                                        <div 
                                            role="button" 
                                            tabIndex={0} 
                                            onClick={() => setOpenDetailId(e._id)} 
                                            className={`group flex cursor-pointer items-center justify-between px-4 py-[11px] transition ${isHighlighted ? "bg-[#f5ecd8]" : "hover:bg-slate-50/60"}`}
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span className="truncate text-[12.5px] font-bold text-slate-900">{e.name}</span>
                                                {!e.active && <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[9.5px] font-bold text-slate-500">Inactive</span>}
                                            </div>
                                            
                                            <div className="flex items-center gap-3" onClick={(ev) => ev.stopPropagation()}>
                                                <span className={`rounded-full px-2.5 py-[3px] text-[10.5px] font-bold ${(e.lastItemCount ?? 0) > 0 ? "bg-[#f5ecd8] text-[#a97400]" : "bg-[#e6ebf3] text-[#1e3a5f]"}`}>
                                                    {e.lastItemCount ?? 0} {(e.lastItemCount ?? 0) === 1 ? "Tender" : "Tenders"}
                                                </span>
                                                <a href={e.portalUrl || e.url} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-[#1e3a5f] hover:underline">Open Portal →</a>
                                                <button type="button" onClick={() => setInfoKey(e._id)} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1e3a5f] hover:underline">
                                                    <span className="text-[13px] leading-none">ⓘ</span> Info
                                                </button>
                                                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                                    <button onClick={() => openEdit(e)} className="p-1 text-slate-600 hover:bg-slate-100 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDelete(e)} disabled={deletingId === e._id} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <aside className="rounded-xl border bg-white p-4" style={{ borderColor: "#e2e8f0" }}>
                            <h3 className="text-[13.5px] font-bold text-[#a97400] mb-3">Popular Tenderers</h3>
                            {popular.map((p, i) => (
                                <div key={p._id} className="flex items-start gap-3 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid #f1f5f9" }}>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg text-[14px] font-bold text-white" style={{ background: p.popularColor || "#1F3864" }}>{(p.popularShort || p.name.slice(0, 2)).toUpperCase()}</div>
                                    <div><p className="text-[12.5px] font-bold text-slate-900">{p.name}</p><p className="text-[11px] text-slate-500">{p.popularSubtitle || "—"}</p></div>
                                </div>
                            ))}
                        </aside>
                    </div>
                    {openSite && <RelatedPanel title={`Related Tenders — ${openSite.name}`} rows={relatedRows} />}
                </>
            )}

            {/* CREDENTIALS TAB */}
            {mainTab === "credentials" && (
                <div className="space-y-4">
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                        <Unlock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div><p className="text-[12px] font-bold text-amber-800">Restricted page.</p><p className="text-[11.5px] text-amber-700">Only people granted access by Management or Admin can see it, and every reveal or copy is logged.</p></div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setCredTab("sites")} className={`inline-flex h-8 items-center rounded-full px-4 text-[11px] font-bold ${credTab === "sites" ? "bg-[#f4ebd8] text-[#a97400]" : "text-slate-600 hover:bg-slate-100"}`}>Sites</button>
                        <button onClick={() => setCredTab("access")} className={`inline-flex h-8 items-center rounded-full px-4 text-[11px] font-bold ${credTab === "access" ? "bg-[#f4ebd8] text-[#a97400]" : "text-slate-600 hover:bg-slate-100"}`}>Who has access</button>
                        <button onClick={() => setCredTab("activity")} className={`inline-flex h-8 items-center rounded-full px-4 text-[11px] font-bold ${credTab === "activity" ? "bg-[#f4ebd8] text-[#a97400]" : "text-slate-600 hover:bg-slate-100"}`}>Activity log</button>
                    </div>

                    {credTab === "sites" && (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search site, username or person" className="h-[34px] w-[250px] rounded border px-3 text-[12px]" />
                                <select value={credTypeFilter} onChange={(e) => setCredTypeFilter(e.target.value)} className="h-[34px] rounded border px-3 text-[12px]"><option>All types</option><option>Enlisted</option><option>Open bid</option></select>
                            </div>
                            {credSites.map(site => (
                                <div key={site._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                                    <div className="flex justify-between mb-3">
                                        <div>
                                            <h3 className="font-serif text-[16px] font-bold">{site.name}</h3>
                                            <p className="text-[11px] text-slate-500">{site.registeredAs ? `Registered as ${site.registeredAs}` : "Global"}</p>
                                        </div>
                                        <button onClick={() => openEdit(site)} className="h-8 rounded border px-3 text-[11px]">Edit</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mb-3">
                                        <div><p className="text-[10px] text-slate-400 mb-1">Username</p><div className="flex gap-2"><span className="text-[12.5px] font-semibold">{site.username || "—"}</span>{site.username && <button onClick={() => copyToClipboard(site.username!, site)} className="text-[10px] font-bold text-[#1e3a5f]">Copy</button>}</div></div>
                                        <div><p className="text-[10px] text-slate-400 mb-1">Password</p><div className="flex gap-2"><span className="font-mono text-[12px] tracking-widest">{showPasswordId === site._id ? site.password : "••••••••••"}</span><button onClick={() => showPasswordId === site._id ? setShowPasswordId(null) : handleReveal(site)} className="text-[10px] font-bold text-[#1e3a5f]">{showPasswordId === site._id ? "Hide" : "Reveal"}</button></div></div>
                                        <div><p className="text-[10px] text-slate-400 mb-1">Email / phone</p><span className="text-[12.5px] font-semibold">{site.registeredEmail || "—"}</span></div>
                                        <div><p className="text-[10px] text-slate-400 mb-1">Renewal</p><span className="text-[12.5px] font-semibold">{site.registrationRenewal ? new Date(site.registrationRenewal).toLocaleDateString() : "—"}</span></div>
                                    </div>
                                    <div className="bg-slate-50 rounded px-3 py-2 text-[11px] text-slate-600">{site.notes || "No notes."}</div>
                                </div>
                            ))}
                        </>
                    )}

                    {credTab === "access" && (
                        <div className="overflow-hidden rounded-xl border bg-white">
                            {loadingCreds ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : (
                                <table className="w-full text-left text-xs">
                                    <thead><tr className="bg-slate-50 text-[9px] font-bold uppercase text-slate-500"><th className="px-5 py-3">Person</th><th className="px-5 py-3">Employment</th><th className="px-5 py-3">Credentials access</th><th className="px-5 py-3">Granted</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
                                    <tbody>
                                        {credUsers.map(u => (
                                            <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="px-5 py-3"><p className="font-bold text-[12px]">{u.fullName}</p><p className="text-[10px] text-slate-500">{u.role}</p></td>
                                                <td className="px-5 py-3 text-[12px]">Active</td>
                                                <td className="px-5 py-3">{u.hasCredentialAccess ? <span className="bg-[#e8f4ea] text-[#2e7d32] px-2 py-0.5 rounded-full text-[9px] font-bold">Has access</span> : <span className="bg-[#fdf0e6] text-[#c25e00] px-2 py-0.5 rounded-full text-[9px] font-bold">No access</span>}</td>
                                                <td className="px-5 py-3 text-[11px] text-slate-500">{u.hasCredentialAccess ? `by ${u.credentialAccessGrantedBy?.fullName || "System"}` : "-"}</td>
                                                <td className="px-5 py-3 text-right">
                                                    {u.hasCredentialAccess ? <button onClick={() => handleToggleAccess(u._id, false)} className="h-7 px-3 border rounded text-[10px]">Revoke</button> : <button onClick={() => handleToggleAccess(u._id, true)} className="h-7 px-3 bg-[#a97400] text-white rounded text-[10px] font-bold">Grant access</button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {credTab === "activity" && (
                        <div className="overflow-hidden rounded-xl border bg-white">
                            {loadingCreds ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : (
                                <table className="w-full text-left text-xs">
                                    <thead><tr className="bg-slate-50 text-[9px] font-bold uppercase text-slate-500"><th className="px-5 py-3 w-1/4">When</th><th className="px-5 py-3 w-1/4">Who</th><th className="px-5 py-3">What</th></tr></thead>
                                    <tbody>
                                        {credLogs.length === 0 ? <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-400">No activity yet.</td></tr> : credLogs.map(log => (
                                            <tr key={log._id} className="border-t border-slate-100">
                                                <td className="px-5 py-3 text-[11px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                                <td className="px-5 py-3 font-bold text-[12px]">{log.userName}</td>
                                                <td className="px-5 py-3 text-[12px] text-slate-700">{log.details}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ⭐ CRAWLER TAB */}
            {mainTab === "crawler" && (
                <>
                    <section className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-700">How to add a site</h3>
                        <ol className="mt-2 list-inside list-decimal space-y-1 text-[12px] leading-relaxed text-sky-800">
                            <li>Open the target site in Chrome and find the tender listing page.</li>
                            <li>Right-click a tender row → <b>Inspect</b> to see the HTML structure.</li>
                            <li>Note the CSS selectors: the row, the title link, and the date.</li>
                            <li>Pick a <b>render mode</b>: <b>Cheerio</b> for static pages, <b>Puppeteer</b> for pages that load rows via JavaScript.</li>
                            <li>Fill the form, click <b>Preview</b> to verify, then <b>Save</b>.</li>
                        </ol>
                    </section>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="relative w-full max-w-xs">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sites..." className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#a97400] focus:outline-none focus:ring-2 focus:ring-amber-300/40" />
                        </div>
                        <button onClick={openNewCrawler} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100]">
                            <Plus className="h-3.5 w-3.5" /> Add Crawler Site
                        </button>
                    </div>

                    {loading && sites.length === 0 ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-[140px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />))}
                        </div>
                    ) : crawlerSites.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                            <Globe className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-3 text-[14px] font-semibold text-slate-700">No sites yet</p>
                            <p className="mt-1 text-[12px] text-slate-500">Add your first site to start crawling.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {crawlerSites.map((site) => {
                                const status = site.lastCrawlStatus;
                                return (
                                    <article key={site._id} className={`rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition ${site.active ? "border-slate-200/80" : "border-slate-200 bg-slate-50/40"}`}>
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Globe className="h-4 w-4 shrink-0 text-[#a97400]" />
                                                    <h3 className="truncate text-[14px] font-bold text-slate-900">{site.name}</h3>
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${site.renderMode === "puppeteer" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                                        {site.renderMode === "puppeteer" ? <Cpu className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                                                        {site.renderMode === "puppeteer" ? "Puppeteer" : "Cheerio"}
                                                    </span>
                                                    {!site.active && (<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inactive</span>)}
                                                    {status === "success" && (<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />{site.lastItemCount} items</span>)}
                                                    {status === "error" && (<span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700"><AlertCircle className="h-3 w-3" />Error</span>)}
                                                </div>
                                                <a href={site.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[12px] text-slate-500 hover:text-slate-800 hover:underline">
                                                    <span className="truncate font-mono">{site.url}</span>
                                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                                </a>
                                                <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">
                                                    <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">List</p><code className="block truncate font-mono text-[11px] text-slate-700">{site.listSelector || "—"}</code></div>
                                                    <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Title</p><code className="block truncate font-mono text-[11px] text-slate-700">{site.titleSelector || "—"}</code></div>
                                                    <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Link</p><code className="block truncate font-mono text-[11px] text-slate-700">{site.linkSelector || "—"}</code></div>
                                                    <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Date</p><code className="block truncate font-mono text-[11px] text-slate-700">{site.dateSelector || "—"}</code></div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Last crawled: {formatDateTime(site.lastCrawledAt)}</span>
                                                </div>
                                                {status === "error" && site.lastCrawlError && (<p className="mt-2 rounded-md border border-rose-100 bg-rose-50/50 px-2.5 py-1.5 text-[11px] text-rose-700">{site.lastCrawlError}</p>)}
                                            </div>
                                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                <button type="button" onClick={() => handleToggleCrawlerActive(site)} className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold transition ${site.active ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                                                    <Power className="h-3 w-3" /> {site.active ? "Active" : "Inactive"}
                                                </button>
                                                <button type="button" onClick={() => handleTestCrawler(site)} disabled={testingId === site._id} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                                                    {testingId === site._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Test
                                                </button>
                                                <button type="button" onClick={() => openEditCrawler(site)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">
                                                    <Pencil className="h-3 w-3" /> Edit
                                                </button>
                                                <button type="button" onClick={() => handleDeleteCrawler(site)} disabled={deletingId === site._id} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                                                    {deletingId === site._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Delete
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* MODAL */}
            {modalOpen && (
                <SiteModal draft={draft} setDraft={setDraft} onClose={() => setModalOpen(false)} onSave={handleSaveDraft} saving={modalSaving} />
            )}

            {/* ⭐ CRAWLER MODAL */}
            {crawlerModalOpen && (
                <CrawlerSiteModal draft={crawlerDraft} setDraft={setCrawlerDraft} onClose={() => setCrawlerModalOpen(false)} onSave={handleSaveCrawler} saving={modalSaving} onPreview={handlePreviewCrawler} preview={preview} previewing={previewing} />
            )}

            {/* INFO MODAL */}
            {info && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInfoKey(null)} />
                    <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-3 border-b px-5 py-3">
                            <h3 className="text-sm font-bold text-slate-900">{info.title}</h3>
                            <button type="button" onClick={() => setInfoKey(null)} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="px-5 py-4">
                            {info.rows.map((r, i) => (
                                <div key={r.label} className="flex items-start justify-between gap-4 py-2.5 text-[12.5px]" style={{ borderTop: i === 0 ? "none" : "1px solid #f1f5f9" }}>
                                    <span className="text-slate-500">{r.label}</span>
                                    <span className="text-right font-medium text-slate-800">{r.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
                            <button type="button" onClick={() => setInfoKey(null)} className="inline-flex h-8 items-center rounded-lg border bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}