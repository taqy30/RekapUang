import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import FundSourceDetailView from "@/components/FundSourceDetailView";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PenyimpananDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;

  return <FundSourceDetailView userName={session.name} slug={slug} />;
}
