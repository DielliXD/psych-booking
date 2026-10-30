import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "sq";
  const response = NextResponse.redirect(new URL(`/${locale}`, req.url));
  response.cookies.delete("patient_session");
  return response;
}
