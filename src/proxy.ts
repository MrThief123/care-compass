import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** `/dev-preview` and every `/dev-preview-*` route (F0-19); not e.g. `/admin/dev-previews`. */
const DEV_PREVIEW_PATH = /^\/dev-preview(?:[-/]|$)/;

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && DEV_PREVIEW_PATH.test(request.nextUrl.pathname)) {
    // Rewriting to a route that doesn't exist renders the standard 404.
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
