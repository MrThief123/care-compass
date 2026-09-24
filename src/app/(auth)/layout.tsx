import type { ReactNode } from "react";

/** Unauthenticated screens (F0-07): sign-in, password reset, admin MFA — no Rail/PageHeader. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
