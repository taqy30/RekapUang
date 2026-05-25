import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sortFundSources } from "@/lib/fund-sources";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fundSources = await prisma.fundSource.findMany({
    select: { id: true, name: true, slug: true, color: true },
  });

  return NextResponse.json(sortFundSources(fundSources));
}
