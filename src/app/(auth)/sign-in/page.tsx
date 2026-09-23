import { SignInForm } from "./sign-in-form";

const NOTICES: Record<string, string> = {
  inactive: "Your access has been withdrawn.",
  "reset-link-expired": "That reset link has expired. Request a new one below.",
};

/** AC-06: the guard redirects here with `?reason=inactive` for a deactivated profile. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return <SignInForm notice={reason ? NOTICES[reason] : undefined} />;
}
