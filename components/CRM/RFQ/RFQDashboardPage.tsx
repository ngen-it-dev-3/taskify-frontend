// app/(dashboard)/crm/rfq/page.tsx (or wherever your page is located)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { RFQItem, RFQProduct, FilterState, RFQStage } from './types';
import toast from 'react-hot-toast';

import Header from './Header';
import FilterToolbar from './FilterToolbar';
import { TotalRfqCard, RfqStatusCard, RfqByCountryCard } from './KpiCards';
import { RfqListPanel } from './RfqList';
import { RfqDetailPanel } from './RfqDetail';
import {
  ProductDetailsModal,
  AssignRfqModal,
  AddRfqModal,
  ClientInfoModal,
} from './Modals';
import { useRfq } from '@/hooks/crm/useRfq';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function RFQDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedFromUrl = searchParams.get('selected');
  const stageFromUrl = searchParams.get('stage');

  const initialViewMode: FilterState['viewMode'] =
    stageFromUrl === 'lost' ? 'lost' :
      stageFromUrl === 'archived' ? 'archived' :
        'active';

  const [filters, setFilters] = useState<FilterState>({
    countryFilter: '0',
    salesmanFilter: '0',
    companySearch: '',
    viewMode: initialViewMode,
    year: '',
    month: '',
  });

  const listParams = useMemo(() => {
    const year = filters.year ? Number(filters.year) : undefined;
    const monthIndex =
      filters.month && filters.month !== ''
        ? MONTHS.indexOf(filters.month)
        : undefined;

    const isArchived = filters.viewMode === 'archived';
    const isLost = filters.viewMode === 'lost';

    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    if (year !== undefined && monthIndex !== undefined && monthIndex >= 0) {
      dateFrom = new Date(year, monthIndex, 1).toISOString();
      dateTo = new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString();
    } else if (year !== undefined) {
      dateFrom = new Date(year, 0, 1).toISOString();
      dateTo = new Date(year, 11, 31, 23, 59, 59).toISOString();
    }

    const stage: RFQStage | undefined = isLost ? 'lost' : undefined;

    return {
      search: filters.companySearch || undefined,
      country:
        filters.countryFilter !== '0' ? filters.countryFilter : undefined,
      salesman:
        filters.salesmanFilter !== '0' ? filters.salesmanFilter : undefined,
      showArchived: isArchived,
      stage,
      dateFrom,
      dateTo,
      page: 1,
      limit: 100,
    };
  }, [filters]);

  const {
    rfqs,
    stats,
    loading,
    error,
    create,
    update,
    assign,
    archive,
    unarchive,
    remove,
    refresh,
  } = useRfq(listParams);

  const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);

  useEffect(() => {
    if (stageFromUrl === 'lost' && filters.viewMode !== 'lost') {
      setFilters((prev) => ({ ...prev, viewMode: 'lost' }));
    } else if (stageFromUrl === 'archived' && filters.viewMode !== 'archived') {
      setFilters((prev) => ({ ...prev, viewMode: 'archived' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFromUrl]);

  useEffect(() => {
    if (!selectedFromUrl) return;
    if (selectedRFQId === selectedFromUrl) return;
    if (!rfqs || rfqs.length === 0) return;

    const match = rfqs.find((r) => r.id === selectedFromUrl);
    if (match) {
      setSelectedRFQId(match.id);
    }
  }, [selectedFromUrl, rfqs, selectedRFQId]);

  const selectedRFQ: RFQItem | undefined = useMemo(
    () => rfqs.find((r) => r.id === selectedRFQId) ?? rfqs[0],
    [rfqs, selectedRFQId]
  );

  const [selectedProductModal, setSelectedProductModal] =
    useState<RFQProduct | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddRfqModal, setShowAddRfqModal] = useState(false);
  const [showClientInfoModal, setShowClientInfoModal] = useState(false);

  // ⭐ State to track which RFQ is currently being edited
  const [editingRfqId, setEditingRfqId] = useState<string | null>(null);

  const patchFilters = (patch: Partial<FilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const handleAssign = (id: string) => {
    setSelectedRFQId(id);
    setShowAssignModal(true);
  };

  const handleSelect = (id: string) => {
    // 1. ⭐ Immediately update the local state for an instant, smooth UI click
    setSelectedRFQId(id);

    // 2. Silently update the URL in the background so it doesn't block the UI
    if (id) {
      window.history.replaceState(null, '', `${pathname}?selected=${id}`);
    } else {
      window.history.replaceState(null, '', pathname);
    }
  };

  const handleQuote = (rfq: RFQItem) => {
    if (rfq.stage === 'quoted') {
      toast.error('A quotation has already been created for this RFQ.');
      return;
    }
    router.push(`/crm/quotation-builder/${rfq.id}`);
  };

  const handleClientDetails = () => setShowClientInfoModal(true);

  const handleEdit = () => {
    if (!selectedRFQ) return;
    setEditingRfqId(selectedRFQ.id);
    setShowAddRfqModal(true);
  };

  const confirmAssign = async (payload: {
    assignedTo: string;
    assignedToEmail?: string;
    priority: string;
    notes: string;
    territory: string;
  }) => {
    if (!selectedRFQ) throw new Error('No RFQ selected');
    await assign(selectedRFQ.id, payload as any);
    setShowAssignModal(false);
  };

  const submitRfq = async (data: any) => {
    try {
      if (editingRfqId) {
        const itemsArray = data.items || data.products || [];

        // ⭐ Flattening the payload to match the Mongoose Schema exactly
        await update(editingRfqId, {
          company: data.companyName || data.company,
          country: data.country,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          designation: data.designation,
          address: data.address,
          city: data.city,
          zipCode: data.zipCode,
          isReseller: data.isReseller,

          projectName: data.projectName,
          tentativeBudget: data.tentativeBudget,
          currentProjectStatus: data.currentProjectStatus,
          tentativePurchaseDate: data.tentativePurchaseDate,
          comment: data.comment,

          products: itemsArray.map((p: any) => ({
            name: p.product || p.name || 'Unnamed Product',
            qty: Number(p.qty) || 1,
            sku: p.sku || '',
            modelNo: p.modelNo || '',
            brand: p.brand || '',
            description: p.description || '',
            additionalInfo: p.additionalInfo || '',
          })),
        } as any);

        toast.success('RFQ updated successfully');

        // Force the UI to stay on the updated item
        setSelectedRFQId(editingRfqId);

      } else {
        // Create flow
        await create({
          ...data,
          company: data.companyName || data.company,
          products: (data.items || []).map((p: any) => ({
            name: p.product || p.name,
            qty: p.qty,
            sku: p.sku,
            modelNo: p.modelNo,
            brand: p.brand,
            description: p.description,
            additionalInfo: p.additionalInfo,
          }))
        });
        toast.success('RFQ created successfully');
      }

      setShowAddRfqModal(false);
      setEditingRfqId(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to save RFQ');
    }
  };

  const handleArchive = async () => {
    if (!selectedRFQ) return;
    try {
      await archive(selectedRFQ.id);
      toast.success(`RFQ ${selectedRFQ.rfqNumber} archived`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to archive RFQ');
    }
  };

  const handleUnarchive = async () => {
    if (!selectedRFQ) return;
    try {
      await unarchive(selectedRFQ.id);
      toast.success(`RFQ ${selectedRFQ.rfqNumber} restored`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to restore RFQ');
    }
  };

  const handleDelete = async () => {
    if (!selectedRFQ) return;
    try {
      await remove(selectedRFQ.id);
      toast.success(`RFQ ${selectedRFQ.rfqNumber} deleted`);
      setSelectedRFQId(null);
      router.replace(pathname, { scroll: false });
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete RFQ');
    }
  };

  const handleMarkLost = async () => {
    if (!selectedRFQ) return;
    try {
      await updateStage(selectedRFQ.id, 'lost');
      toast.success(`RFQ ${selectedRFQ.rfqNumber} marked as Lost`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update RFQ');
    }
  };

  const updateStage = async (id: string, stage: RFQStage) => {
    const { RfqApi } = await import('@/services/rfq.service');
    await RfqApi.update(id, { stage });
    await refresh();
  };

  if (loading && rfqs.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#A06126] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading RFQs…</p>
        </div>
      </div>
    );
  }

  if (error && rfqs.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-sm text-rose-600 mb-2 font-semibold">
            Failed to load RFQs
          </p>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-[#A06126] text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased p-6 lg:p-8 selection:bg-[#EFE8DA]">
      <Header onAddRfq={() => {
        setEditingRfqId(null);
        setShowAddRfqModal(true);
      }} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <TotalRfqCard stats={stats} />
        <RfqStatusCard stats={stats} />
        <RfqByCountryCard stats={stats} />
      </div>

      <FilterToolbar
        filters={filters}
        onChange={patchFilters}
        rfqs={rfqs}
        activeCount={(stats?.pending ?? 0) + (stats?.quoted ?? 0)}
        archivedCount={stats?.archived ?? 0}
        lostCount={stats?.lost ?? 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <RfqListPanel
          rfqs={rfqs}
          selectedRFQId={selectedRFQ?.id ?? ''}
          showArchived={filters.viewMode === 'archived'}
          onSelect={handleSelect}
          onAssign={handleAssign}
          onQuote={handleQuote}
        />

        {selectedRFQ ? (
          <RfqDetailPanel
            rfq={selectedRFQ}
            onProductDetails={setSelectedProductModal}
            onClientDetails={handleClientDetails}
            onReassign={() => setShowAssignModal(true)}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onDelete={handleDelete}
            onMarkLost={handleMarkLost}
            onQuote={() => handleQuote(selectedRFQ)}
            onEdit={handleEdit}
          />
        ) : (
          <div className="lg:col-span-7 bg-white rounded-xl p-8 border border-[#EBE6DF] shadow-2xs text-center text-xs text-slate-500">
            No RFQs found. Click &quot;+ Add RFQ&quot; to create one.
          </div>
        )}
      </div>

      {selectedProductModal && (
        <ProductDetailsModal
          product={selectedProductModal}
          onClose={() => setSelectedProductModal(null)}
        />
      )}

      {showAssignModal && selectedRFQ && (
        <AssignRfqModal
          key={`assign-${selectedRFQ.id}-${selectedRFQ.territory || 'none'}`}
          rfq={selectedRFQ}
          onClose={() => setShowAssignModal(false)}
          onConfirm={confirmAssign}
        />
      )}

      {showAddRfqModal && (
        <AddRfqModal
          // ⭐ Force modal to completely reload the state when switching between Add and Edit
          key={editingRfqId ? `edit-${editingRfqId}` : 'add-new'}
          isEditing={!!editingRfqId}
          onClose={() => {
            setShowAddRfqModal(false);
            setEditingRfqId(null);
          }}
          onSubmit={submitRfq}
          initialData={
            editingRfqId && selectedRFQ
              ? {
                // Company Info
                companyName: selectedRFQ.company || '',
                country: selectedRFQ.country || '',
                contactName: selectedRFQ.clientInfo?.contactName || '',
                email: selectedRFQ.clientInfo?.email || '',
                phone: selectedRFQ.clientInfo?.phone || '',
                designation: selectedRFQ.clientInfo?.designation || '',
                address: selectedRFQ.clientInfo?.address || '',
                city: selectedRFQ.clientInfo?.city || '',
                zipCode: selectedRFQ.clientInfo?.zipCode || '',
                isReseller: (selectedRFQ as any).isReseller || false,

                // Additional Details (The missing data!)
                projectName: (selectedRFQ as any).projectName || (selectedRFQ as any).clientInfo?.projectName || '',
                tentativeBudget: (selectedRFQ as any).tentativeBudget || (selectedRFQ as any).clientInfo?.tentativeBudget || '',
                currentProjectStatus: (selectedRFQ as any).currentProjectStatus || (selectedRFQ as any).clientInfo?.currentProjectStatus || '',
                tentativePurchaseDate: (selectedRFQ as any).tentativePurchaseDate || (selectedRFQ as any).clientInfo?.purchaseDate || '',
                comment: (selectedRFQ as any).comment || (selectedRFQ as any).clientInfo?.comment || '',

                // Products
                items: selectedRFQ.products?.map((p, i) => ({
                  id: String(i),
                  product: p.name || '',
                  qty: p.qty || 1,
                  sku: p.sku || '',
                  modelNo: p.modelNo || '',
                  brand: p.brand || '',
                  description: p.description || '',
                  additionalInfo: p.additionalInfo || '',
                })) || [],
              }
              : undefined
          }
        />
      )}

      {showClientInfoModal && selectedRFQ && (
        <ClientInfoModal
          rfqNumber={selectedRFQ.rfqNumber}
          clientInfo={selectedRFQ.clientInfo}
          onClose={() => setShowClientInfoModal(false)}
        />
      )}
    </div>
  );
}