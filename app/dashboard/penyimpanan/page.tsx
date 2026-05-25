import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import FundSourceHubView from "@/components/FundSourceHubView";

export const dynamic = "force-dynamic";

export default async function PenyimpananPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <FundSourceHubView userName={session.name} />;
}
