import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import HistoryView from "@/components/HistoryView";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense>
      <HistoryView userName={session.name} />
    </Suspense>
  );
}
