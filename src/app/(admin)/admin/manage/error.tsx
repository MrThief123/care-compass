"use client";
import { ManageError } from "@/features/admin-manage/manage-states";
export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ManageError retry={retry} />;
}
