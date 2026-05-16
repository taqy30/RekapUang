import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loadDashboardData } from "@/lib/dashboard-data";
import Dashboard from "@/components/Dashboard";
import DashboardLoadingScreen from "@/components/DashboardLoadingScreen";

export const dynamic = "force-dynamic";

const DASHBOARD_TX_LIMIT = 60;

async function DashboardWithData({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const initialData = await loadDashboardData(userId, {
    transactionLimit: DASHBOARD_TX_LIMIT,
  });
  return <Dashboard userName={userName} initialData={initialData} />;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<DashboardLoadingScreen />}>
      <DashboardWithData
        userId={session.userId}
        userName={session.name}
      />
    </Suspense>
  );
}
