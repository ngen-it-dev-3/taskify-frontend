// app/(dashboard)/crm/quotation-builder/[id]/page.tsx
import QuotationBuilderPage from '@/components/CRM/QuotationBuilder/QuotationBuilderPage';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <QuotationBuilderPage rfqId={id} />;
}