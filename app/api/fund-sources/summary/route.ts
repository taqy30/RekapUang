import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadFundSourceHubSummary } from "@/lib/fund-source-detail";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await loadFundSourceHubSummary(session.userId);
  return NextResponse.json({ items });
}
