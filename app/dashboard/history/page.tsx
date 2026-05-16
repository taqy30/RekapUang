import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import HistoryView from "@/components/HistoryView";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/30 animate-pulse" />
      }
    >
      <HistoryView userName={session.name} />
    </Suspense>
  );
}
