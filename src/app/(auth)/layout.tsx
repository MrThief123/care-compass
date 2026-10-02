import type { ReactNode } from "react";

/** Unauthenticated screens (F0-07): sign-in, password reset, admin MFA — no Rail/PageHeader. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-12">
      {/* A card marked `data-wide` (MFA enrolment, F0-21 FD-13) gets a wider column. */}
      <div className="w-full max-w-sm has-[[data-wide]]:max-w-md">{children}</div>
    </div>
  );
}
