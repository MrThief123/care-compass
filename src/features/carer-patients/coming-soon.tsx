import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/** Holding state for Home, Calendar and Care log until CAR-04 wires them (FD-01). */
export function ComingSoon() {
  return (
    <div className="px-6 py-5">
      <CardShell>
        <EmptyState
          icon="info"
          title="Coming soon"
          body="This part of the patient's record isn't available to carers yet."
        />
      </CardShell>
    </div>
  );
}
