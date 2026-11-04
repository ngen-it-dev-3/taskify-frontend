// app/(dashboard)/online-crm/components/LogQueryModal.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Globe,
  Mail,
  RefreshCw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
} from 'lucide-react';
import {
  OnlineCrmApi,
  type OnlineQuery,
  type QuerySource,
  type QueryStage,
} from '@/services/onlineCrm.service';
import { SOURCES, STAGES } from './constants';
import api from '@/lib/axios';

// ============================================================
// CONSTANTS
// ============================================================
const CURRENCIES = ['BDT', 'USD', 'SAR', 'AED', 'INR', 'EUR', 'GBP'];
const MODES = ['Online (eGP)', 'Offline', 'Email'];
const PARTICIPATE = ['Yes', 'No', 'Undecided'];
const DOC_STATUS = [
  'Docs pending',
  'Docs in progress',
  'Complete',
  'Banking docs pending',
];

// ⭐ Full worldwide country list
const COUNTRIES = [
  { name: 'Afghanistan', flag: '🇦🇫' },
  { name: 'Albania', flag: '🇦🇱' },
  { name: 'Algeria', flag: '🇩🇿' },
  { name: 'Andorra', flag: '🇦🇩' },
  { name: 'Angola', flag: '🇦🇴' },
  { name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Armenia', flag: '🇦🇲' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Austria', flag: '🇦🇹' },
  { name: 'Azerbaijan', flag: '🇦🇿' },
  { name: 'Bahamas', flag: '🇧🇸' },
  { name: 'Bahrain', flag: '🇧🇭' },
  { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'Barbados', flag: '🇧🇧' },
  { name: 'Belarus', flag: '🇧🇾' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Belize', flag: '🇧🇿' },
  { name: 'Benin', flag: '🇧🇯' },
  { name: 'Bhutan', flag: '🇧🇹' },
  { name: 'Bolivia', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { name: 'Botswana', flag: '🇧🇼' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Brunei', flag: '🇧🇳' },
  { name: 'Bulgaria', flag: '🇧🇬' },
  { name: 'Burkina Faso', flag: '🇧🇫' },
  { name: 'Burundi', flag: '🇧🇮' },
  { name: 'Cabo Verde', flag: '🇨🇻' },
  { name: 'Cambodia', flag: '🇰🇭' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Central African Republic', flag: '🇨🇫' },
  { name: 'Chad', flag: '🇹🇩' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'China', flag: '🇨🇳' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Comoros', flag: '🇰🇲' },
  { name: 'Congo (Congo-Brazzaville)', flag: '🇨🇬' },
  { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Cyprus', flag: '🇨🇾' },
  { name: 'Czechia (Czech Republic)', flag: '🇨🇿' },
  { name: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Djibouti', flag: '🇩🇯' },
  { name: 'Dominica', flag: '🇩🇲' },
  { name: 'Dominican Republic', flag: '🇩🇴' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'Egypt', flag: '🇪🇬' },
  { name: 'El Salvador', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', flag: '🇬🇶' },
  { name: 'Eritrea', flag: '🇪🇷' },
  { name: 'Estonia', flag: '🇪🇪' },
  { name: 'Eswatini (fmr. "Swaziland")', flag: '🇸🇿' },
  { name: 'Ethiopia', flag: '🇪🇹' },
  { name: 'Fiji', flag: '🇫🇯' },
  { name: 'Finland', flag: '🇫🇮' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Gabon', flag: '🇬🇦' },
  { name: 'Gambia', flag: '🇬🇲' },
  { name: 'Georgia', flag: '🇬🇪' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Greece', flag: '🇬🇷' },
  { name: 'Grenada', flag: '🇬🇩' },
  { name: 'Guatemala', flag: '🇬🇹' },
  { name: 'Guinea', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', flag: '🇬🇼' },
  { name: 'Guyana', flag: '🇬🇾' },
  { name: 'Haiti', flag: '🇭🇹' },
  { name: 'Holy See (Vatican City)', flag: '🇻🇦' },
  { name: 'Honduras', flag: '🇭🇳' },
  { name: 'Hungary', flag: '🇭🇺' },
  { name: 'Iceland', flag: '🇮🇸' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Iran', flag: '🇮🇷' },
  { name: 'Iraq', flag: '🇮🇶' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Israel', flag: '🇮🇱' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Jamaica', flag: '🇯🇲' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Jordan', flag: '🇯🇴' },
  { name: 'Kazakhstan', flag: '🇰🇿' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Kiribati', flag: '🇰🇮' },
  { name: 'Kuwait', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', flag: '🇰🇬' },
  { name: 'Laos', flag: '🇱🇦' },
  { name: 'Latvia', flag: '🇱🇻' },
  { name: 'Lebanon', flag: '🇱🇧' },
  { name: 'Lesotho', flag: '🇱🇸' },
  { name: 'Liberia', flag: '🇱🇷' },
  { name: 'Libya', flag: '🇱🇾' },
  { name: 'Liechtenstein', flag: '🇱🇮' },
  { name: 'Lithuania', flag: '🇱🇹' },
  { name: 'Luxembourg', flag: '🇱🇺' },
  { name: 'Madagascar', flag: '🇲🇬' },
  { name: 'Malawi', flag: '🇲🇼' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Maldives', flag: '🇲🇻' },
  { name: 'Mali', flag: '🇲🇱' },
  { name: 'Malta', flag: '🇲🇹' },
  { name: 'Marshall Islands', flag: '🇲🇭' },
  { name: 'Mauritania', flag: '🇲🇷' },
  { name: 'Mauritius', flag: '🇲🇺' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Micronesia', flag: '🇫🇲' },
  { name: 'Moldova', flag: '🇲🇩' },
  { name: 'Monaco', flag: '🇲🇨' },
  { name: 'Mongolia', flag: '🇲🇳' },
  { name: 'Montenegro', flag: '🇲🇪' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Mozambique', flag: '🇲🇿' },
  { name: 'Myanmar (formerly Burma)', flag: '🇲🇲' },
  { name: 'Namibia', flag: '🇳🇦' },
  { name: 'Nauru', flag: '🇳🇷' },
  { name: 'Nepal', flag: '🇳🇵' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Nicaragua', flag: '🇳🇮' },
  { name: 'Niger', flag: '🇳🇪' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'North Korea', flag: '🇰🇵' },
  { name: 'North Macedonia', flag: '🇲🇰' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Oman', flag: '🇴🇲' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Palau', flag: '🇵🇼' },
  { name: 'Palestine State', flag: '🇵🇸' },
  { name: 'Panama', flag: '🇵🇦' },
  { name: 'Papua New Guinea', flag: '🇵🇬' },
  { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Peru', flag: '🇵🇪' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Romania', flag: '🇷🇴' },
  { name: 'Russia', flag: '🇷🇺' },
  { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { name: 'Saint Lucia', flag: '🇱🇨' },
  { name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { name: 'Samoa', flag: '🇼🇸' },
  { name: 'San Marino', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Seychelles', flag: '🇸🇨' },
  { name: 'Sierra Leone', flag: '🇸🇱' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Slovakia', flag: '🇸🇰' },
  { name: 'Slovenia', flag: '🇸🇮' },
  { name: 'Solomon Islands', flag: '🇸🇧' },
  { name: 'Somalia', flag: '🇸🇴' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'South Sudan', flag: '🇸🇸' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Sudan', flag: '🇸🇩' },
  { name: 'Suriname', flag: '🇸🇷' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Syria', flag: '🇸🇾' },
  { name: 'Tajikistan', flag: '🇹🇯' },
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Thailand', flag: '🇹🇭' },
  { name: 'Timor-Leste', flag: '🇹🇱' },
  { name: 'Togo', flag: '🇹🇬' },
  { name: 'Tonga', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { name: 'Tunisia', flag: '🇹🇳' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Turkmenistan', flag: '🇹🇲' },
  { name: 'Tuvalu', flag: '🇹🇻' },
  { name: 'Uganda', flag: '🇺🇬' },
  { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'United States of America', flag: '🇺🇸' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Uzbekistan', flag: '🇺🇿' },
  { name: 'Vanuatu', flag: '🇻🇺' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Yemen', flag: '🇾🇪' },
  { name: 'Zambia', flag: '🇿🇲' },
  { name: 'Zimbabwe', flag: '🇿🇼' },
].sort((a, b) => a.name.localeCompare(b.name));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Tab = 'sync' | 'manual';
type Step = 0 | 1 | 2 | 3;

// ============================================================
// FORM SHAPE
// ============================================================
interface QueryFormData {
  // Basic Info
  company: string;
  country: string;
  product: string;
  description: string;
  referenceLink: string;
  recordedBy: string;
  responsiblePerson: string;

  // Source & Assignment
  source: QuerySource;
  assigned: string;
  stage: QueryStage;
  docStatus: string;
  participate: string;

  // Commercial
  value: string;
  bidValue: string;
  currency: string;

  // Dates
  lastDateOfPurchase: string;
  lastDateOfSubmission: string;
  submittedAt: string;

  // Security
  securityAmount: string;
  securityValidity: string;
  performanceSecurityValidity: string;
  mode: string;

  // Client Contact
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;

  // Notes
  comments: string;
  note: string;
  eligibility: string;
}

const INITIAL_FORM: QueryFormData = {
  company: '',
  country: '',
  product: '',
  description: '',
  referenceLink: '',
  recordedBy: '',
  responsiblePerson: '',

  source: 'Email',
  assigned: 'Akramul',
  stage: 'To Start',
  docStatus: '',
  participate: 'Yes',

  value: '',
  bidValue: '',
  currency: 'BDT',

  lastDateOfPurchase: '',
  lastDateOfSubmission: '',
  submittedAt: '',

  securityAmount: '',
  securityValidity: '',
  performanceSecurityValidity: '',
  mode: 'Online (eGP)',

  contactName: '',
  contactPhone: '',
  contactEmail: '',
  contactAddress: '',

  comments: '',
  note: '',
  eligibility: '',
};

// ============================================================
// HELPERS
// ============================================================
function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

function toIsoOrUndefined(v: string): string | undefined {
  if (!v) return undefined;
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch {
    return undefined;
  }
}

function buildFormFrom(initial?: OnlineQuery | null): QueryFormData {
  if (!initial) return { ...INITIAL_FORM };
  const i = initial as any;
  return {
    company: i.company ?? '',
    country: i.country ?? '',
    product: i.product ?? '',
    description: i.description ?? '',
    referenceLink: i.referenceLink ?? '',
    recordedBy: i.recordedBy ?? '',
    responsiblePerson: i.responsiblePerson ?? '',

    source: (i.source as QuerySource) ?? 'Email',
    assigned: i.assigned ?? 'Akramul',
    stage: (i.stage as QueryStage) ?? 'To Start',
    docStatus: i.docStatus ?? '',
    participate: i.participate ?? 'Yes',

    value: i.value != null ? String(i.value) : '',
    bidValue: i.bidValue != null ? String(i.bidValue) : '',
    currency: i.currency ?? 'BDT',

    lastDateOfPurchase: toDateInput(i.lastDateOfPurchase),
    lastDateOfSubmission: toDateInput(i.lastDateOfSubmission),
    submittedAt: toDateInput(i.submittedAt),

    securityAmount: i.securityAmount != null ? String(i.securityAmount) : '',
    securityValidity: toDateInput(i.securityValidity),
    performanceSecurityValidity: toDateInput(i.performanceSecurityValidity),
    mode: i.mode ?? 'Online (eGP)',

    contactName: i.contactName ?? '',
    contactPhone: i.contactPhone ?? '',
    contactEmail: i.contactEmail ?? '',
    contactAddress: i.contactAddress ?? '',

    comments: i.comments ?? '',
    note: i.note ?? '',
    eligibility: i.eligibility ?? '',
  };
}

// ============================================================
// COMPONENT
// ============================================================
interface Props {
  onClose: () => void;
  onSaved: () => void;
  initial?: OnlineQuery | null;
}

export function LogQueryModal({ onClose, onSaved, initial }: Props) {
  const isEdit = !!initial;

  const [tab, setTab] = useState<Tab>('sync');
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<QueryFormData>(() => buildFormFrom(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<string[]>(['Unassigned']);

  const panelRef = useRef<HTMLDivElement>(null);

  // ⭐ FIX: Only reset the form if the specific query ID changes, not on every step change
  useEffect(() => {
    setForm(buildFormFrom(initial));
    setStep(0);
    setErrors({});
    if (initial) setTab('manual');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  // Fetch real employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/auth/users/active');
        const json = res.data;

        const rawUsers = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.data?.users)
            ? json.data.users
            : Array.isArray(json?.users)
              ? json.users
              : [];

        const names = rawUsers.map((u: any) => u.fullName || u.name || u.email || 'Unknown');
        setEmployees(['Unassigned', ...names]);
      } catch (err) {
        console.error('Failed to fetch employees', err);
        setEmployees(['Unassigned', 'Akramul', 'Nahid', 'CRM Manager, ME', 'CRM Manager, SG', 'Wei Ling Tan']);
      }
    };

    fetchEmployees();
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ============================================================
  // FIELD HELPERS
  // ============================================================
  const setField = <K extends keyof QueryFormData>(key: K, value: QueryFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  // ============================================================
  // VALIDATION — per step
  // ============================================================
  const validateStep = (s: Step, silent = false): boolean => {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!form.company.trim()) errs.company = 'Company is required.';
      if (!form.country.trim()) errs.country = 'Country is required.';
    }

    if (s === 1) {
      if (!form.assigned.trim()) errs.assigned = 'Assigned is required.';
      if (!form.source.trim()) errs.source = 'Source is required.';
    }

    if (s === 2) {
      if (form.contactEmail && !EMAIL_RE.test(form.contactEmail)) {
        errs.contactEmail = 'Please enter a valid email.';
      }
    }

    if (s === 3) {
      // Notes — all optional
    }

    if (!silent) setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const stepValidity = useMemo<boolean[]>(() => {
    return [0, 1, 2, 3].map((s) => validateStep(s as Step, true));
  }, [form]);

  const currentStepValid = stepValidity[step];
  const allStepsValid = stepValidity.every(Boolean);

  const goNext = () => {
    if (!currentStepValid) {
      validateStep(step);
      return;
    }
    if (step < 3) setStep((s) => (s + 1) as Step);
  };

  const goPrev = () => {
    if (step > 0) setStep((s) => (s - 1) as Step);
  };

  const tryJumpToStep = (target: Step) => {
    if (target === step) return;
    if (target < step) {
      setStep(target);
      return;
    }
    for (let s = 0 as Step; s < target; s = (s + 1) as Step) {
      if (!stepValidity[s]) {
        setStep(s);
        validateStep(s);
        return;
      }
    }
    setStep(target);
  };

  // ============================================================
  // SYNC (mock)
  // ============================================================
  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setToast('Synced 2 new queries from the Web Portal.');
    }, 1400);
  };

  // ============================================================
  // BUILD PAYLOAD
  // ============================================================
  const buildPayload = (draft: boolean) => ({
    company: form.company.trim(),
    country: form.country.trim(),
    product: form.product.trim(),
    description: form.description.trim() || undefined,
    referenceLink: form.referenceLink.trim() || undefined,
    recordedBy: form.recordedBy.trim() || undefined,
    responsiblePerson: form.responsiblePerson.trim() || undefined,
    assigned: form.assigned,
    source: form.source,
    value: form.value === '' ? null : Number(form.value),
    bidValue: form.bidValue === '' ? 0 : Number(form.bidValue),
    currency: form.currency,
    stage: form.stage,
    lastDateOfPurchase: toIsoOrUndefined(form.lastDateOfPurchase),
    lastDateOfSubmission: toIsoOrUndefined(form.lastDateOfSubmission),
    submittedAt: toIsoOrUndefined(form.submittedAt),
    mode: form.mode,
    participate: form.participate,
    docStatus: form.docStatus,
    securityAmount: form.securityAmount === '' ? 0 : Number(form.securityAmount),
    securityValidity: toIsoOrUndefined(form.securityValidity),
    performanceSecurityValidity: toIsoOrUndefined(form.performanceSecurityValidity),
    contactName: form.contactName.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
    contactEmail: form.contactEmail.trim() || undefined,
    contactAddress: form.contactAddress.trim() || undefined,
    comments: form.comments.trim() || undefined,
    note: form.note.trim() || undefined,
    eligibility: form.eligibility.trim() || undefined,
    draft,
  });

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const s of [0, 1, 2, 3] as Step[]) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = buildPayload(false);
      if (isEdit && initial?.id) {
        await OnlineCrmApi.update(initial.id, payload);
      } else {
        await OnlineCrmApi.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setToast(err.message || 'Failed to save query');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.company.trim() || !form.country.trim()) {
      setStep(0);
      setErrors({
        company: !form.company.trim() ? 'Company is required.' : '',
        country: !form.country.trim() ? 'Country is required.' : '',
      });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(true);
      if (isEdit && initial?.id) {
        await OnlineCrmApi.update(initial.id, payload);
      } else {
        await OnlineCrmApi.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setToast(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { n: 0, label: 'Basic Info' },
    { n: 1, label: 'Source' },
    { n: 2, label: 'Contact' },
    { n: 3, label: 'Dates & Notes' },
  ];

  return (
    <div
      // ⭐ FIX: Removed the onClick from the backdrop to prevent accidental closures
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-query-title"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        {/* HEADER */}
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-8 pt-6 pb-4 border-b border-slate-100 rounded-t-2xl">
          <div>
            <h2 id="log-query-title" className="text-xl font-bold text-slate-900">
              {isEdit ? 'Edit Online Query' : 'Log Online Query'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              Queries arrive two ways — sync fresh ones from the Web Portal, or
              log one that came in by email, phone, or portal manually.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="px-8 pt-5">
          <div className="flex items-center gap-6 border-b border-slate-100">
            <TabButton
              active={tab === 'sync'}
              onClick={() => setTab('sync')}
              icon={<Globe className="w-3.5 h-3.5" />}
              label="Sync from Web Portal"
            />
            <TabButton
              active={tab === 'manual'}
              onClick={() => setTab('manual')}
              icon={<Mail className="w-3.5 h-3.5" />}
              label="Manual Entry (Email/Phone)"
            />
          </div>
        </div>

        {/* BODY */}
        <div className="px-8 py-6">
          {tab === 'sync' ? (
            <SyncPanel syncing={syncing} onSync={handleSync} />
          ) : (
            <ManualPanel
              step={step}
              setStep={tryJumpToStep}
              steps={steps}
              stepValidity={stepValidity}
              currentStepValid={currentStepValid}
              allStepsValid={allStepsValid}
              form={form}
              errors={errors}
              setField={setField}
              goNext={goNext}
              goPrev={goPrev}
              handleSubmit={handleSubmit}
              handleSaveDraft={handleSaveDraft}
              submitting={saving}
              isEdit={isEdit}
              employees={employees}
            />
          )}
        </div>

        {/* TOAST */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-4 py-2.5 shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 z-20">
            <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center font-bold text-[10px]">
              ✕
            </span>
            <span>
              <span className="text-rose-300 font-bold">Notice</span>{' '}
              <span className="ml-1">{toast}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SYNC PANEL
   ========================================================= */
function SyncPanel({ syncing, onSync }: { syncing: boolean; onSync: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 leading-relaxed">
        Pulls any new online queries submitted through the NGEN IT website's
        portal via API since your last sync.
        <br />
        <span className="text-slate-500">
          Last synced:{' '}
          <strong className="text-slate-700">Today, 09:02 AM</strong> · 28
          queries on file
        </span>
      </p>
      <button
        onClick={onSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A06126] text-white text-xs font-semibold hover:bg-[#88501E] transition disabled:opacity-70"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  );
}

/* =========================================================
   TAB BUTTON
   ========================================================= */
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 text-xs font-semibold relative transition ${active ? 'text-[#A06126]' : 'text-slate-500 hover:text-slate-700'
        }`}
    >
      {icon}
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A06126] rounded-full" />
      )}
    </button>
  );
}

/* =========================================================
   MANUAL PANEL — Wizard
   ========================================================= */
function ManualPanel({
  step,
  setStep,
  steps,
  stepValidity,
  currentStepValid,
  allStepsValid,
  form,
  errors,
  setField,
  goNext,
  goPrev,
  handleSubmit,
  handleSaveDraft,
  submitting,
  isEdit,
  employees,
}: {
  step: Step;
  setStep: (s: Step) => void;
  steps: { n: number; label: string }[];
  stepValidity: boolean[];
  currentStepValid: boolean;
  allStepsValid: boolean;
  form: QueryFormData;
  errors: Record<string, string>;
  setField: <K extends keyof QueryFormData>(key: K, value: QueryFormData[K]) => void;
  goNext: () => void;
  goPrev: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleSaveDraft: () => void;
  submitting: boolean;
  isEdit: boolean;
  employees: string[];
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Product line — simplified single product */}
      <div className="flex items-center gap-2">
        <div className="w-12 text-center text-xs font-bold text-slate-700 border border-slate-200 rounded px-2 py-2 shrink-0">
          1
        </div>
        <input
          type="text"
          value={form.product}
          onChange={(e) => setField('product', e.target.value)}
          placeholder="Product Name (e.g. Kiosk — self-service desk)"
          className="flex-1 bg-slate-100 border-0 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
        <input
          type="text"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Description"
          className="flex-1 bg-slate-100 border-0 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500">
          Product details — edit above
        </span>
      </div>

      <div className="border-t border-slate-100" />

      {/* STEP TABS */}
      {/* STEP TABS */}
      <div className="flex items-center gap-0 border-b border-slate-100">
        {steps.map((s) => {
          const stepIndex = s.n as Step;
          const done = stepIndex < step;
          const active = stepIndex === step;
          const canJump =
            stepIndex <= step || stepValidity.slice(0, stepIndex).every(Boolean);

          return (
            <button
              key={s.n}
              type="button" // ⭐ THIS IS CRITICAL
              disabled={!canJump}
              onClick={(e) => {
                e.preventDefault(); // ⭐ Stop form submission
                e.stopPropagation();
                setStep(stepIndex);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition border-b-2 ${active
                ? 'text-rose-700 border-rose-700 bg-rose-50/40'
                : done
                  ? 'text-slate-700 border-transparent hover:bg-slate-50'
                  : canJump
                    ? 'text-slate-500 border-transparent hover:bg-slate-50'
                    : 'text-slate-300 border-transparent cursor-not-allowed'
                }`}
            >
              {done && <Check className="w-3.5 h-3.5 text-slate-700" />}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* STEP CONTENT */}
      <div className="pt-1">
        {step === 0 && <BasicInfoStep form={form} errors={errors} setField={setField} />}
        {step === 1 && <SourceStep form={form} errors={errors} setField={setField} employees={employees} />}
        {step === 2 && <ContactStep form={form} errors={errors} setField={setField} />}
        {step === 3 && <DatesNotesStep form={form} errors={errors} setField={setField} />}
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
          )}
          {step === 0 && !isEdit && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-[#A06126] text-[#A06126] text-xs font-semibold hover:bg-[#F9F1E2] transition disabled:opacity-60"
            >
              Save as Draft
            </button>
          )}
        </div>

        {step < 3 ? (
          <button
            type="button" // ⭐ THIS IS CRITICAL
            onClick={(e) => {
              e.preventDefault(); // ⭐ Stop form submission
              e.stopPropagation();
              goNext();
            }}
            disabled={!currentStepValid}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded text-white text-xs font-semibold transition ${currentStepValid
              ? 'bg-rose-700 hover:bg-rose-800'
              : 'bg-rose-200 cursor-not-allowed'
              }`}
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit" // ⭐ THIS IS THE ONLY SUBMIT BUTTON
            disabled={submitting || !allStepsValid}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded text-white text-xs font-semibold transition ${submitting || !allStepsValid
                ? 'bg-rose-200 cursor-not-allowed'
                : 'bg-rose-700 hover:bg-rose-800'
              }`}
          >
            {submitting ? 'Submitting…' : isEdit ? 'Save Changes' : 'Save Query'}
          </button>
        )}
      </div>
    </form>
  );
}

/* =========================================================
   STEP 0 — BASIC INFO
   ========================================================= */
function BasicInfoStep({
  form,
  errors,
  setField,
}: {
  form: QueryFormData;
  errors: Record<string, string>;
  setField: <K extends keyof QueryFormData>(key: K, value: QueryFormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Company"
          placeholder="Company Name (e.g. Pubali Bank Limited)"
          value={form.company}
          onChange={(v) => setField('company', v)}
          error={errors.company}
          required
        />
        <SearchableCountrySelect
          label="Country"
          value={form.country}
          onChange={(v) => setField('country', v)}
          error={errors.country}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Product / Requirement"
          placeholder="Product Name (e.g. Kiosk — self-service desk)"
          value={form.product}
          onChange={(v) => setField('product', v)}
        />
        <InputField
          label="Description"
          placeholder="Additional details"
          value={form.description}
          onChange={(v) => setField('description', v)}
        />
      </div>

      <InputField
        label="Reference Link"
        placeholder="https://example.com/notice/123"
        value={form.referenceLink}
        onChange={(v) => setField('referenceLink', v)}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Recorded By"
          placeholder="e.g. Akramul"
          value={form.recordedBy}
          onChange={(v) => setField('recordedBy', v)}
        />
        <InputField
          label="Responsible Person"
          placeholder="e.g. Nahid Hasan"
          value={form.responsiblePerson}
          onChange={(v) => setField('responsiblePerson', v)}
        />
      </div>
    </div>
  );
}

/* =========================================================
   STEP 1 — SOURCE & ASSIGNMENT
   ========================================================= */
function SourceStep({
  form,
  errors,
  setField,
  employees,
}: {
  form: QueryFormData;
  errors: Record<string, string>;
  setField: <K extends keyof QueryFormData>(key: K, value: QueryFormData[K]) => void;
  employees: string[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Source"
          placeholder="Select Source"
          value={form.source}
          onChange={(v) => setField('source', v as QuerySource)}
          options={[...SOURCES]}
          error={errors.source}
          required
        />

        {/* ⭐ Updated to use the searchable employee select */}
        <SearchableEmployeeSelect
          label="Assigned To"
          value={form.assigned}
          onChange={(v) => setField('assigned', v)}
          options={employees}
          error={errors.assigned}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Stage"
          placeholder="Select Stage"
          value={form.stage}
          onChange={(v) => setField('stage', v as QueryStage)}
          options={[...STAGES]}
        />
        <SelectField
          label="Doc Status"
          placeholder="Not set"
          value={form.docStatus}
          onChange={(v) => setField('docStatus', v)}
          options={DOC_STATUS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Quoted Value"
          placeholder="e.g. 680000"
          value={form.value}
          onChange={(v) => setField('value', v)}
        />
        <InputField
          label="Final Bid Value"
          placeholder="e.g. 650000"
          value={form.bidValue}
          onChange={(v) => setField('bidValue', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Currency"
          placeholder="Select"
          value={form.currency}
          onChange={(v) => setField('currency', v)}
          options={CURRENCIES}
        />
        <SelectField
          label="Participate?"
          placeholder="Select"
          value={form.participate}
          onChange={(v) => setField('participate', v)}
          options={PARTICIPATE}
        />
      </div>
    </div>
  );
}

/* =========================================================
   STEP 2 — CLIENT CONTACT
   ========================================================= */
function ContactStep({
  form,
  errors,
  setField,
}: {
  form: QueryFormData;
  errors: Record<string, string>;
  setField: <K extends keyof QueryFormData>(key: K, value: QueryFormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Contact Name"
          placeholder="e.g. Md. Kamal Hossain"
          value={form.contactName}
          onChange={(v) => setField('contactName', v)}
        />
        <InputField
          label="Phone"
          placeholder="e.g. 01711-000000"
          value={form.contactPhone}
          onChange={(v) => setField('contactPhone', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Email"
          placeholder="e.g. procurement@example.com"
          value={form.contactEmail}
          onChange={(v) => setField('contactEmail', v)}
          error={errors.contactEmail}
        />
        <InputField
          label="Address"
          placeholder="e.g. HQ, Dhaka"
          value={form.contactAddress}
          onChange={(v) => setField('contactAddress', v)}
        />
      </div>
    </div>
  );
}

/* =========================================================
   STEP 3 — DATES, SECURITY & NOTES
   ========================================================= */
function DatesNotesStep({
  form,
  errors,
  setField,
}: {
  form: QueryFormData;
  errors: Record<string, string>;
  setField: <K extends keyof QueryFormData>(key: K, value: QueryFormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <InputField
          label="Last Date of Purchase"
          type="date"
          placeholder=""
          value={form.lastDateOfPurchase}
          onChange={(v) => setField('lastDateOfPurchase', v)}
        />
        <InputField
          label="Last Date of Submission"
          type="date"
          placeholder=""
          value={form.lastDateOfSubmission}
          onChange={(v) => setField('lastDateOfSubmission', v)}
        />
        <InputField
          label="Submitted At"
          type="date"
          placeholder=""
          value={form.submittedAt}
          onChange={(v) => setField('submittedAt', v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Security Amount"
          placeholder="e.g. 25000"
          value={form.securityAmount}
          onChange={(v) => setField('securityAmount', v)}
        />
        <SelectField
          label="Mode of Submission"
          placeholder="Select"
          value={form.mode}
          onChange={(v) => setField('mode', v)}
          options={MODES}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Security Validity"
          type="date"
          placeholder=""
          value={form.securityValidity}
          onChange={(v) => setField('securityValidity', v)}
        />
        <InputField
          label="Performance Security Validity"
          type="date"
          placeholder=""
          value={form.performanceSecurityValidity}
          onChange={(v) => setField('performanceSecurityValidity', v)}
        />
      </div>

      <InputField
        label="Eligibility"
        placeholder="e.g. Experience: 7 years, Turnover: 5 Cr"
        value={form.eligibility}
        onChange={(v) => setField('eligibility', v)}
      />

      <InputField
        label="Comments"
        placeholder="Quick note for the log"
        value={form.comments}
        onChange={(v) => setField('comments', v)}
      />

      <div>
        <label className="block text-[10.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-1.5">
          Detailed Notes
        </label>
        <textarea
          rows={4}
          value={form.note}
          onChange={(e) => setField('note', e.target.value)}
          placeholder="General / Manager / MD comments"
          className="w-full bg-slate-100 border-0 rounded-lg px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#A06126]"
        />
      </div>
    </div>
  );
}

/* =========================================================
   ATOMS
   ========================================================= */
function InputField({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled,
  required,
  type = 'text',
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[10.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-slate-100 border rounded-lg px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60 ${error ? 'border-rose-400' : 'border-transparent'
          }`}
      />
      {error && (
        <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
  error,
  required,
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[10.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none bg-slate-100 border rounded-lg px-3 py-2.5 pr-8 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#A06126] disabled:opacity-60 ${error ? 'border-rose-400' : 'border-transparent'
            }`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}

function SearchableCountrySelect({
  label,
  value,
  onChange,
  error,
  disabled,
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
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

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountry = COUNTRIES.find((c) => c.name === value);

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
        <span className="flex items-center gap-2 truncate">
          {selectedCountry ? (
            <>
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-slate-400">Select Country</span>
          )}
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
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-[#A06126]"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    onChange(c.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 transition ${value === c.name
                    ? 'bg-amber-50 text-[#A06126] font-semibold'
                    : 'text-slate-700'
                    }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                No countries found.
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

// ⭐ Added SearchableEmployeeSelect component
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