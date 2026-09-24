import { Icon } from "@/components/ui/icon";
import { signOut } from "@/server/auth/actions";

/** F0-07 PRD.md Scope: "Sign-out action (placed in the top bar by F0-15)". */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        aria-label="Sign out"
        className="flex h-11 w-11 items-center justify-center rounded-control text-text-secondary hover:text-text-primary"
      >
        <Icon name="log-out" size={20} />
      </button>
    </form>
  );
}
