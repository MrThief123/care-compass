import { SignOutButton } from "@/components/shared/sign-out-button";
import { CardShell } from "@/components/ui/card-shell";

/** PRD.md F0-07 Error/Edge Cases: a family account not yet linked to any client. */
export default function NoClientLinkedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-12">
      <CardShell className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-title-page text-text-primary">No client linked to your account yet</h1>
        <p className="text-body-default text-text-secondary">
          Your organisation hasn&apos;t linked you to a client&apos;s care plan yet. Contact them
          once it&apos;s set up.
        </p>
        <SignOutButton />
      </CardShell>
    </div>
  );
}
