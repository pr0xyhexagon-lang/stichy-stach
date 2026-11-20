import { BrandHeader, Alert } from "@/components/kit";
import RegistrationForm from "./RegistrationForm";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  let batch: string | null = null;
  let courseFee = 0;
  try {
    const s = await getSettings();
    batch = s.currentBatch;
    courseFee = s.courseFee;
  } catch (e) {
    console.error(e);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-10 sm:px-6 sm:pb-16 lg:max-w-3xl">
      <BrandHeader batch={batch ?? undefined} />
      <h2 className="mb-4 text-center text-lg font-semibold text-foreground/80 sm:mb-6 sm:text-xl">Student Registration Form</h2>
      {batch ? (
        <RegistrationForm batch={batch} courseFee={courseFee} />
      ) : (
        <Alert>Registration is temporarily unavailable. Please call 070 309 9433.</Alert>
      )}
    </main>
  );
}
