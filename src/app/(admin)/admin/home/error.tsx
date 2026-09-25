"use client";

import { AdminHomeScreen } from "@/features/admin-home/admin-home-screen";

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <AdminHomeScreen state="error" onRetry={retry} />;
}
