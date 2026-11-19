import AdminNav from "@/components/AdminNav";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      {/* Bottom padding on phones clears the fixed bottom tab bar (+ iPhone home indicator). */}
      <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 md:pb-10">{children}</main>
    </>
  );
}
