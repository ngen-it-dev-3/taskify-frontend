import OfferDialogProvider from "@/components/site/OfferDialogProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <OfferDialogProvider>
      {children}
    </OfferDialogProvider>
  );
}