import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadFundSourceDetail } from "@/lib/fund-source-detail";
import { fundSourceSlugSchema } from "@/lib/validation";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const slugParsed = fundSourceSlugSchema.safeParse(slug);
  if (!slugParsed.success) {
    return NextResponse.json(
      { error: "Tipe penyimpanan tidak ditemukan" },
      { status: 404 }
    );
  }

  const data = await loadFundSourceDetail(session.userId, slugParsed.data);

  if (!data) {
    return NextResponse.json(
      { error: "Tipe penyimpanan tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
