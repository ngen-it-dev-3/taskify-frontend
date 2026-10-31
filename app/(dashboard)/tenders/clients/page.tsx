// app/(dashboard)/tenders/clients/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Plus, Search, ChevronDown, ChevronRight, List, LayoutGrid, X, Loader2, Star, Users, Pencil } from "lucide-react";

/* ============================================================
   TYPES & CONSTANTS
   ============================================================ */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

const SECTORS = [
    "Government", "Government / utility", "Government / energy", "Bank", "Educational", "NGO / development", "International organisation", "Private enterprise"
];
const RELATIONSHIPS = ["Strong", "Good", "New", "Needs work"];
const POTENTIALS = ["High", "Medium", "Low", "Unknown"];
const OWNERS = ["Akramul", "Nahid Hasan", "Unassigned"];

const INITIAL_ROLES = [
    { role: "MD / Admin", lists: "Served, Not attended, Potential", scope: "All", payments: true, notes: true, canEdit: true, rawLists: { served: true, notAttended: true, potential: true } },
    { role: "Super Admin / CEO", lists: "Served, Not attended, Potential", scope: "All", payments: true, notes: true, canEdit: true, rawLists: { served: true, notAttended: true, potential: true } },
    { role: "Accounts / Finance", lists: "Served", scope: "All", payments: true, notes: false, canEdit: false, rawLists: { served: true, notAttended: false, potential: false } },
    { role: "Marketing", lists: "Potential", scope: "All", payments: false, notes: true, canEdit: true, rawLists: { served: false, notAttended: false, potential: true } },
    { role: "Sales Rep", lists: "Served, Not attended, Potential", scope: "Assigned to Akramul", payments: true, notes: true, canEdit: true, rawLists: { served: true, notAttended: true, potential: true } },
    { role: "CRM Territory Manager", lists: "Served, Not attended, Potential", scope: "Assigned to Nahid Hasan", payments: true, notes: true, canEdit: true, rawLists: { served: true, notAttended: true, potential: true } },
];

function authHeaders() {
    if (typeof window === "undefined") return { "Content-Type": "application/json" };
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || sessionStorage.getItem("token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function TenderClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ served: 0, notAttended: 0, potential: 0, mustMake: 0, strong: 0 });
    const [loading, setLoading] = useState(true);

    // View & Filter State
    const [view, setView] = useState<"cards" | "list">("cards");
    const [activeTab, setActiveTab] = useState<"Served" | "Not attended" | "Potential">("Served");
    const [search, setSearch] = useState("");
    const [filterSector, setFilterSector] = useState("All sectors");
    const [filterRelationship, setFilterRelationship] = useState("Any relationship");
    const [filterOwner, setFilterOwner] = useState("All sales owners");

    // Accordion State
    const [showRoles, setShowRoles] = useState(false);
    const [rolesData, setRolesData] = useState(INITIAL_ROLES);
    const [editingRole, setEditingRole] = useState<any>(null);

    // Modals State
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [editClient, setEditClient] = useState<any>(null);
    const [addOpen, setAddOpen] = useState(false);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const [cRes, sRes] = await Promise.all([
                fetch(`${API_BASE}/tender-clients`, { headers: authHeaders() }),
                fetch(`${API_BASE}/tender-clients/stats`, { headers: authHeaders() }),
            ]);
            const cJson = await cRes.json();
            const sJson = await sRes.json();
            if (cJson.success) setClients(cJson.data);
            if (sJson.success) setStats(sJson.data);
        } catch (e) {
            toast.error("Failed to load clients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Filter Logic
    const filtered = useMemo(() => {
        return clients.filter(c => {
            if (c.status !== activeTab) return false;
            if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (filterSector !== "All sectors" && c.sector !== filterSector) return false;
            if (filterRelationship !== "Any relationship" && c.relationship !== filterRelationship) return false;
            if (filterOwner !== "All sales owners" && c.salesOwner !== filterOwner) return false;
            return true;
        });
    }, [clients, activeTab, search, filterSector, filterRelationship, filterOwner]);

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900 font-sans">
            <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#a97400]">TENDER DASHBOARD</p>
                        <h1 className="mt-1 text-[28px] font-serif font-bold tracking-tight text-[#1a202c]">Tender Clients</h1>
                        <p className="mt-1 text-[13px] text-slate-500">Open a client to see our history, relationship and what else we can offer.</p>
                    </div>
                    <button onClick={() => setAddOpen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm hover:bg-[#8f6100]">
                        <Plus className="h-4 w-4" /> Add client
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <StatBox label="Served clients" value={stats.served} active={activeTab === "Served"} onClick={() => setActiveTab("Served")} />
                    <StatBox label="Not attended" value={stats.notAttended} active={activeTab === "Not attended"} onClick={() => setActiveTab("Not attended")} />
                    <StatBox label="Potential clients" value={stats.potential} active={activeTab === "Potential"} onClick={() => setActiveTab("Potential")} />
                    <div className="w-px h-10 bg-slate-300 mx-2" />
                    <StatBox label="Must-make relationships" value={stats.mustMake} readOnly />
                    <StatBox label="Strong relationships" value={stats.strong} readOnly />
                </div>

                {/* Toolbar */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {["Served", "Not attended", "Potential"].map(t => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={`inline-flex h-8 items-center gap-2 rounded-full border px-4 text-[11px] font-bold transition ${activeTab === t ? "bg-[#f4ebd8] border-[#d5b98a] text-[#a97400]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                {t} <span className={`px-1.5 rounded-full text-[10px] ${activeTab === t ? "bg-white text-[#a97400]" : "bg-slate-100 text-slate-500"}`}>{stats[t === "Served" ? "served" : t === "Not attended" ? "notAttended" : "potential"]}</span>
                            </button>
                        ))}
                        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 ml-auto">
                            <button onClick={() => setView("cards")} className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md ${view === "cards" ? "bg-[#1e3a5f] text-white" : "text-slate-500 hover:text-slate-800"}`}><LayoutGrid className="h-3.5 w-3.5" /> Cards</button>
                            <button onClick={() => setView("list")} className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md ${view === "list" ? "bg-[#1e3a5f] text-white" : "text-slate-500 hover:text-slate-800"}`}><List className="h-3.5 w-3.5" /> List</button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 relative z-10">
                    <div className="relative w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input type="text" placeholder="Search client or product" value={search} onChange={e => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] focus:border-slate-400 outline-none" />
                    </div>
                    <SelectFilter value={filterSector} onChange={setFilterSector} options={["All sectors", ...SECTORS]} />
                    <SelectFilter value={filterRelationship} onChange={setFilterRelationship} options={["Any relationship", ...RELATIONSHIPS]} />
                    <SelectFilter value={filterOwner} onChange={setFilterOwner} options={["All sales owners", ...OWNERS]} />
                </div>

                {/* Main Content Area */}
                {loading ? (
                    <div className="p-12 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : view === "cards" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filtered.map(client => <ClientCard key={client._id} client={client} onClick={() => setSelectedClient(client)} />)}
                        {filtered.length === 0 && <div className="col-span-full py-10 text-center text-slate-500">No clients found.</div>}
                    </div>
                ) : (
                    <ClientList clients={filtered} onClick={setSelectedClient} />
                )}

                {/* Accordion */}
                <div className="mt-8 border-t border-slate-200 pt-6">
                    <button
                        onClick={() => setShowRoles(!showRoles)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-slate-800 hover:text-[#a97400] transition-colors mb-3"
                    >
                        {showRoles ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Who sees what
                    </button>

                    {showRoles && (
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Lists</th>
                                        <th className="px-4 py-3">Which clients</th>
                                        <th className="px-4 py-3">Payments</th>
                                        <th className="px-4 py-3">Relationship, contacts & notes</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {rolesData.map((role, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-semibold">{role.role}</td>
                                            <td className="px-4 py-3">{role.lists}</td>
                                            <td className="px-4 py-3">{role.scope}</td>
                                            <td className="px-4 py-3">{role.payments ? "Yes" : "No"}</td>
                                            <td className="px-4 py-3">{role.notes ? "Yes" : "No"}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => setEditingRole(role)}
                                                    className="text-[10px] font-bold text-[#1e3a5f] hover:underline"
                                                >
                                                    Edit access
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="mt-2 text-[10px] text-slate-400">Operations, Supply Chain and HR do not see this page. In the real system these rules come from Access Control.</p>
                </div>
            </div>

            {/* MODALS */}
            {selectedClient && <ClientDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={() => { setEditClient(selectedClient); setSelectedClient(null); }} />}
            {editClient && <EditClientModal client={editClient} onClose={() => setEditClient(null)} onSave={() => { setEditClient(null); loadData(); }} />}
            {addOpen && <AddClientModal onClose={() => setAddOpen(false)} onSave={() => { setAddOpen(false); loadData(); }} />}
            {editingRole && <EditRoleAccessModal role={editingRole} onClose={() => setEditingRole(null)} onSave={(updated: any) => {
                setRolesData(prev => prev.map(r => r.role === updated.role ? updated : r));
                setEditingRole(null);
                toast.success("Access updated");
            }} />}
        </main>
    );
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */
function StatBox({ label, value, active, onClick, readOnly }: any) {
    return (
        <div onClick={onClick} className={`flex flex-col items-center justify-center h-16 min-w-[100px] px-4 rounded-xl border text-center transition ${onClick ? "cursor-pointer hover:border-[#d5b98a]" : ""} ${active ? "bg-[#0b172a] border-[#0b172a] text-white" : "bg-white border-slate-200 text-slate-800"}`}>
            <span className={`text-[20px] font-bold ${active ? "text-white" : "text-[#0b172a]"}`}>{value}</span>
            <span className={`text-[9px] font-medium ${active ? "text-slate-300" : "text-slate-500"}`}>{label}</span>
        </div>
    );
}

function SelectFilter({ value, onChange, options }: any) {
    return (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[11.5px] font-medium text-slate-700 outline-none appearance-none focus:border-slate-400">
                {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
    );
}

function ClientCard({ client, onClick }: any) {
    const initials = client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div onClick={onClick} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#d5b98a] hover:shadow-md cursor-pointer transition relative group flex flex-col">
            <div className="absolute top-2 left-2 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-400 shadow-sm z-10">x</div>
            <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-[13px]">{initials}</div>
                <div>
                    <h3 className="text-[14px] font-bold text-slate-900 leading-tight">{client.name}</h3>
                    <p className="text-[10px] text-slate-500">{client.sector}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${client.status === "Served" ? "bg-slate-100 text-slate-600" : "bg-[#fdf0e6] text-[#c25e00]"}`}>{client.status}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${client.relationship === "Strong" ? "bg-[#ecfdf5] text-[#059669]" : "bg-slate-100 text-slate-500"}`}>{client.relationship}</span>
                {client.isMustMake && <span className="flex items-center gap-1 text-[9px] font-bold text-[#a97400]"><Star className="w-3 h-3 fill-[#a97400]" /> Must-make</span>}
            </div>
            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{client.totalTenders > 0 ? `Won ${client.wonCount} of ${client.totalTenders}` : "No tenders yet"}</span>
                <span className="text-[10px] font-medium text-slate-600">{client.nextStep || "New"}</span>
            </div>
        </div>
    );
}

function ClientList({ clients, onClick }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[11.5px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Sector</th><th className="px-4 py-3">Relationship</th><th className="px-4 py-3">Potential</th><th className="px-4 py-3">Tenders</th><th className="px-4 py-3">Won value</th><th className="px-4 py-3">Sales owner</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {clients.map((c: any) => (
                        <tr key={c._id} onClick={() => onClick(c)} className="hover:bg-slate-50 cursor-pointer">
                            <td className="px-4 py-3 font-bold flex items-center gap-1.5">{c.isMustMake && <Star className="w-3 h-3 fill-[#a97400] text-[#a97400]" />} {c.name}</td>
                            <td className="px-4 py-3 text-slate-600">{c.sector}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.relationship === "Strong" ? "bg-[#ecfdf5] text-[#059669]" : "bg-slate-100 text-slate-500"}`}>{c.relationship}</span></td>
                            <td className="px-4 py-3"><span className="bg-[#f4ebd8] text-[#a97400] px-2 py-0.5 rounded-full text-[9px] font-bold">{c.businessPotential}</span></td>
                            <td className="px-4 py-3 text-slate-600">{c.totalTenders > 0 ? `${c.wonCount}/${c.totalTenders}` : "-"}</td>
                            <td className="px-4 py-3 text-slate-600">{c.wonValue}</td>
                            <td className="px-4 py-3 text-slate-600">{c.salesOwner}</td>
                        </tr>
                    ))}
                    {clients.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No clients found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

/* ============================================================
   MODALS
   ============================================================ */
function ClientDetailModal({ client, onClose, onEdit }: any) {
    const initials = client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-4">
                    <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-lg bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-[16px] shadow-sm">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-[20px] font-serif font-bold text-slate-900 leading-tight">{client.name}</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">{client.sector} · {client.status}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onEdit} className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-1.5">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 pt-2 space-y-6 overflow-y-auto">

                    {/* Top Stats Box */}
                    <div className="bg-[#f8fafc] rounded-lg p-4 grid grid-cols-4 gap-4">
                        <div>
                            <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tenders</p>
                            <p className="text-[12.5px] font-bold text-slate-800">
                                {client.totalTenders > 0 ? `${client.wonCount} won of ${client.totalTenders}` : "No tenders yet — still a prospect"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Relationship</p>
                            <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${client.relationship === "New" ? "bg-[#fdf0e6] text-[#c25e00]" : client.relationship === "Strong" ? "bg-[#ecfdf5] text-[#059669]" : "bg-slate-100 text-slate-600"}`}>
                                    {client.relationship}
                                </span>
                                {client.isMustMake && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#a97400]">
                                        <Star className="w-3 h-3 fill-[#a97400]" /> Must-make
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Business potential</p>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${client.businessPotential === "Medium" ? "bg-[#f4ebd8] text-[#a97400]" : "bg-slate-100 text-slate-600"}`}>
                                {client.businessPotential}
                            </span>
                        </div>
                        <div>
                            <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sales owner</p>
                            <p className="text-[12.5px] font-bold text-slate-800">{client.salesOwner}</p>
                        </div>
                    </div>

                    {/* Estimate text (if exists) */}
                    {client.estimatePotential && (
                        <p className="text-[12px] text-slate-700">{client.estimatePotential}</p>
                    )}

                    {/* What else we can offer */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">What else we can offer</p>
                        <div className="flex flex-wrap gap-2">
                            {client.whatWeCanOffer && client.whatWeCanOffer.length > 0 ? (
                                client.whatWeCanOffer.map((o: string) => (
                                    <span key={o} className="bg-[#f1f5f9] text-slate-700 px-3 py-1 rounded-md text-[11px] font-medium border border-slate-200">
                                        {o}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[11px] text-slate-400">None listed</span>
                            )}
                        </div>
                    </div>

                    {/* Next Step Banner */}
                    {client.nextStep && (
                        <div className="bg-[#fdf8ec] border border-[#eaddc5] rounded-lg p-3 text-[12px] text-[#a97400] font-medium shadow-sm">
                            <strong className="font-bold">Next step:</strong> {client.nextStep}
                            {client.nextStepDate && ` · ${new Date(client.nextStepDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                            {client.source && ` · source: ${client.source}`}
                        </div>
                    )}

                    {/* Contacts */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Contacts</p>
                        {client.contacts && client.contacts.length > 0 ? (
                            <div className="space-y-1.5 mb-3">
                                {client.contacts.map((c: any) => (
                                    <div key={c._id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[12px]">
                                        <span className="font-bold text-slate-800">{c.name}</span>
                                        <span className="text-slate-400 mx-1.5">·</span>
                                        <span className="text-slate-600">{c.role}</span>
                                        {c.email && (
                                            <>
                                                <span className="text-slate-400 mx-1.5">·</span>
                                                <span className="text-slate-500">{c.email}</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11.5px] text-slate-500 mb-3">No contact recorded yet.</p>
                        )}

                        {/* Add Contact Form */}
                        <div className="flex gap-2">
                            <input placeholder="Name" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-[12px] focus:border-[#a97400] focus:outline-none" />
                            <input placeholder="Role" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-[12px] focus:border-[#a97400] focus:outline-none" />
                            <input placeholder="Email" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-[12px] focus:border-[#a97400] focus:outline-none" />
                            <button className="border border-slate-300 bg-white px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm whitespace-nowrap">
                                Add contact
                            </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Notes</p>
                        {client.notes ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[12px] text-slate-700 mb-3">
                                {client.notes}
                            </div>
                        ) : (
                            <p className="text-[11.5px] text-slate-500 mb-3">No notes yet.</p>
                        )}

                        {/* Add Note Form */}
                        <div className="flex gap-2">
                            <input placeholder="Add a note" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-[12px] focus:border-[#a97400] focus:outline-none" />
                            <button className="border border-slate-300 bg-white px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                                Add
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function EditClientModal({ client, onClose, onSave }: any) {
    const [form, setForm] = useState({ ...client });
    const [saving, setSaving] = useState(false);
    const patch = (p: any) => setForm({ ...form, ...p });

    const handleSave = async () => {
        setSaving(true);
        try {
            const r = await fetch(`${API_BASE}/tender-clients/${client._id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(form) });
            const json = await r.json();
            if (!json.success) throw new Error(json.message);
            toast.success("Client updated"); onSave();
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="flex justify-between p-5 border-b"><h2 className="font-serif font-bold text-lg">Edit — {client.name}</h2><button onClick={onClose}><X className="h-4 w-4" /></button></div>
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase">Relationship</label><select value={form.relationship} onChange={e => patch({ relationship: e.target.value })} className="w-full border rounded p-2 text-[12px]"><option>New</option><option>Strong</option><option>Good</option><option>Needs work</option></select></div>
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase">Business potential</label><select value={form.businessPotential} onChange={e => patch({ businessPotential: e.target.value })} className="w-full border rounded p-2 text-[12px]"><option>Medium</option><option>High</option><option>Low</option><option>Unknown</option></select></div>
                    </div>
                    <div><label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={form.isMustMake} onChange={e => patch({ isMustMake: e.target.checked })} /> Must-make relationship</label></div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase">Why this potential?</label><input value={form.estimatePotential} onChange={e => patch({ estimatePotential: e.target.value })} className="w-full border rounded p-2 text-[12px]" /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase">What else we can offer</label><input value={form.whatWeCanOffer?.join(", ")} onChange={e => patch({ whatWeCanOffer: e.target.value.split(",").map((s: string) => s.trim()) })} className="w-full border rounded p-2 text-[12px]" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase">Next step</label><input value={form.nextStep} onChange={e => patch({ nextStep: e.target.value })} className="w-full border rounded p-2 text-[12px]" /></div>
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase">Next step date</label><input type="date" value={form.nextStepDate ? form.nextStepDate.split("T")[0] : ""} onChange={e => patch({ nextStepDate: e.target.value })} className="w-full border rounded p-2 text-[12px]" /></div>
                    </div>
                    <div><label className="text-[10px] font-bold text-slate-500 uppercase">Sales owner</label><select value={form.salesOwner} onChange={e => patch({ salesOwner: e.target.value })} className="w-full border rounded p-2 text-[12px]"><option>Akramul</option><option>Nahid Hasan</option><option>Unassigned</option></select></div>
                    <button onClick={handleSave} disabled={saving} className="w-full bg-[#a97400] text-white py-2 rounded font-bold text-[12px]">{saving ? "Saving..." : "Save"}</button>
                </div>
            </div>
        </div>
    );
}

function AddClientModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ name: "", sector: "Government", source: "", whatWeCanOffer: "", nextStep: "" });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("Client name required");
        setSaving(true);
        try {
            const r = await fetch(`${API_BASE}/tender-clients`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    ...form,
                    status: "Potential",
                    whatWeCanOffer: form.whatWeCanOffer.split(",").map((s: string) => s.trim()).filter(Boolean)
                })
            });
            const json = await r.json();
            if (!json.success) throw new Error(json.message);
            toast.success("Client added"); onSave();
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="font-serif font-bold text-lg text-slate-900">Add a potential client</h2>
                        <p className="text-[10px] text-slate-500 mt-1">Saved in the Potential list.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
                        <X className="h-4 w-4 text-slate-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Client name *</label>
                        <input
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-[12px] focus:border-[#a97400] focus:outline-none focus:ring-1 focus:ring-amber-200 mt-1"
                            placeholder="e.g. Padma Bank Ltd."
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Sector</label>
                            <div className="relative mt-1">
                                <select
                                    value={form.sector}
                                    onChange={e => setForm({ ...form, sector: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-[12px] focus:border-[#a97400] focus:outline-none focus:ring-1 focus:ring-amber-200 appearance-none bg-white"
                                >
                                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Source</label>
                            <input
                                value={form.source}
                                onChange={e => setForm({ ...form, source: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-[12px] focus:border-[#a97400] focus:outline-none focus:ring-1 focus:ring-amber-200 mt-1"
                                placeholder="Referral, event, tender site..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">What we can offer (comma separated)</label>
                        <input
                            value={form.whatWeCanOffer}
                            onChange={e => setForm({ ...form, whatWeCanOffer: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-[12px] focus:border-[#a97400] focus:outline-none focus:ring-1 focus:ring-amber-200 mt-1"
                            placeholder="e.g. Backup, Firewall"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Next step</label>
                        <input
                            value={form.nextStep}
                            onChange={e => setForm({ ...form, nextStep: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-[12px] focus:border-[#a97400] focus:outline-none focus:ring-1 focus:ring-amber-200 mt-1"
                            placeholder="e.g. Send capability deck"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-[#a97400] hover:bg-[#8f6100] text-white py-2.5 rounded-lg font-bold text-[12px] transition disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save client"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditRoleAccessModal({ role, onClose, onSave }: any) {
    const [form, setForm] = useState({ ...role });

    // State for managing users
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userSearch, setUserSearch] = useState("");

    // Fetch real users when modal opens
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API_BASE}/credentials/users`, { headers: authHeaders() });
                const json = await res.json();
                if (json.success) setUsers(json.data);
            } catch (err) {
                toast.error("Failed to load users");
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const handleSave = () => {
        const listsArr = [];
        if (form.rawLists.served) listsArr.push("Served");
        if (form.rawLists.notAttended) listsArr.push("Not attended");
        if (form.rawLists.potential) listsArr.push("Potential");

        onSave({ ...form, lists: listsArr.join(", ") || "None" });
    };

    const toggleUserAccess = async (userId: string, hasAccess: boolean) => {
        // Optimistic UI update
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, hasCredentialAccess: hasAccess } : u));
        // Real API call
        try {
            await fetch(`${API_BASE}/credentials/users/${userId}/access`, {
                method: "PATCH", headers: authHeaders(), body: JSON.stringify({ hasAccess }),
            });
            toast.success(hasAccess ? "User granted access" : "User access revoked");
        } catch (err) {
            toast.error("Failed to update user");
            // Revert on fail
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, hasCredentialAccess: !hasAccess } : u));
        }
    };

    // Filter users for the search box
    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-start p-6 border-b border-slate-100">
                    <div>
                        <h2 className="font-serif font-bold text-lg text-slate-900">Edit access — {role.role}</h2>
                        <p className="text-[10px] text-slate-500 mt-1">Configure what this role can see and assign users to it.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
                        <X className="h-4 w-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">

                    {/* User Assignment Section */}
                    <div className="bg-[#fdf8ec] border border-[#d5b98a] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[11px] font-bold text-[#a97400] uppercase flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" /> Users with this access
                            </label>
                            <span className="text-[10px] text-slate-500">{users.filter(u => u.hasCredentialAccess).length} active</span>
                        </div>

                        {/* Search Bar to Add User */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search user by name or email to grant access..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-[12px] focus:border-[#a97400] outline-none"
                            />
                        </div>

                        {loadingUsers ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#a97400]" /></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-[11px] text-slate-500 text-center py-2">No users found.</div>
                        ) : (
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                {filteredUsers.map((u: any) => (
                                    <div key={u._id} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {u.fullName.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[11.5px] font-bold text-slate-800">{u.fullName}</p>
                                                <p className="text-[9.5px] text-slate-500">{u.role}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleUserAccess(u._id, !u.hasCredentialAccess)}
                                            className={`px-3 py-1 rounded text-[10px] font-bold transition ${u.hasCredentialAccess ? "bg-[#fdf0e6] text-[#c25e00] hover:bg-rose-100" : "bg-[#e8f4ea] text-[#2e7d32] hover:bg-emerald-200"}`}
                                        >
                                            {u.hasCredentialAccess ? "Revoke" : "Grant access"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Permission Rules */}
                    <div className="space-y-4 pt-2 border-t border-slate-200">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Visible Lists</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.rawLists.served} onChange={e => setForm({ ...form, rawLists: { ...form.rawLists, served: e.target.checked } })} /> Served clients</label>
                                <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.rawLists.notAttended} onChange={e => setForm({ ...form, rawLists: { ...form.rawLists, notAttended: e.target.checked } })} /> Not attended</label>
                                <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.rawLists.potential} onChange={e => setForm({ ...form, rawLists: { ...form.rawLists, potential: e.target.checked } })} /> Potential clients</label>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Client Scope</label>
                            <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 text-[12px]">
                                <option value="All">All clients</option>
                                <option value="Assigned to Akramul">Assigned to Akramul</option>
                                <option value="Assigned to Nahid Hasan">Assigned to Nahid Hasan</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.payments} onChange={e => setForm({ ...form, payments: e.target.checked })} /> Can see payments</label>
                            <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.notes} onChange={e => setForm({ ...form, notes: e.target.checked })} /> Can see relationship, contacts & notes</label>
                            <label className="flex items-center gap-2 text-[12px] font-semibold"><input type="checkbox" checked={form.canEdit} onChange={e => setForm({ ...form, canEdit: e.target.checked })} /> Can edit client details</label>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto rounded-b-xl">
                    <button onClick={handleSave} className="w-full bg-[#a97400] hover:bg-[#8f6100] text-white py-2.5 rounded-lg font-bold text-[12px] transition">
                        Save access rules
                    </button>
                </div>
            </div>
        </div>
    );
}