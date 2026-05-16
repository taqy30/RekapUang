import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loadDashboardData } from "@/lib/dashboard-data";
import HistoryView from "@/components/HistoryView";
import DashboardLoadingScreen from "@/components/DashboardLoadingScreen";

export const dynamic = "force-dynamic";

async function HistoryWithData({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const initialData = await loadDashboardData(userId);
  return (
    <HistoryView
      userName={userName}
      initialTransactions={initialData.transactions}
    />
  );
}

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<DashboardLoadingScreen />}>
      <HistoryWithData userId={session.userId} userName={session.name} />
    </Suspense>
  );
}
