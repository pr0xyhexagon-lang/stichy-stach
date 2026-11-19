import Link from "next/link";
import { BrandHeader, Card } from "@/components/kit";

export default async function Success({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { id, name, batch } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-16">
      <BrandHeader />
      <Card className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
        <h2 className="text-xl font-bold text-foreground">Registration received!</h2>
        <p className="mt-2 text-muted-foreground">
          Thank you{name ? `, ${name}` : ""}. We will contact you on WhatsApp with class details.
        </p>
        {id && (
          <div className="mt-5 rounded-xl bg-brand-50 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Your Student ID</div>
            <div className="mt-1 font-mono text-xl font-bold break-all text-brand-700 sm:text-2xl">{id}</div>
            {batch && <div className="mt-1 text-sm text-muted-foreground">{batch}</div>}
          </div>
        )}
        <p className="mt-5 text-sm text-muted-foreground">Questions? Call or WhatsApp <a href="tel:0703099433" className="font-medium whitespace-nowrap text-primary">070 309 9433</a>.</p>
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-primary hover:bg-accent">
          Register another student
        </Link>
      </Card>
    </main>
  );
}
