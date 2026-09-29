import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Protege todas las rutas salvo /login y los assets estáticos.
export default async function proxy(req: NextRequest) {
  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!login|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp|webmanifest)$).*)",
  ],
};
