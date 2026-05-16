import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loadDashboardData } from "@/lib/dashboard-data";
import HistoryView from "@/components/HistoryView";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const initialData = await loadDashboardData(session.userId);

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-muted/30 animate-pulse" />}
    >
      <HistoryView
        userName={session.name}
        initialTransactions={initialData.transactions}
      />
    </Suspense>
  );
}
