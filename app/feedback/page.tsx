import { getSession } from "@/lib/auth";
import FeedbackForm from "@/components/FeedbackForm";
import AppFooter from "@/components/AppFooter";

export default async function FeedbackPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen flex flex-col bg-muted/40">
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <FeedbackForm
          backHref={session ? "/dashboard" : "/login"}
          backLabel={session ? "Kembali ke dashboard" : "Kembali ke login"}
          defaultContactEmail={session?.email ?? ""}
        />
      </div>
      <AppFooter className="border-t bg-muted/40" />
    </main>
  );
}
