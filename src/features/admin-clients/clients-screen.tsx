"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ConfirmationModal } from "@/components/shared/forms/confirmation-modal";
import { DataTable } from "@/components/shared/lists/data-table";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { adminClientBase } from "@/features/admin-client-view/client-routes";
import { removeClient } from "@/server/admin/clients-actions";

export interface ClientRow {
  id: string;
  name: string;
  familyContact: string;
}

const REMOVE_FAILED_MESSAGE = "Couldn't remove this client. Try again.";

/**
 * ADM-04 (CHG-035): list only. The Add-client panel PD-037 rejected (a client is created by its
 * family, never by admin) is removed here, not merely left unwired.
 * ADM-05: Remove calls `removeClient`, which detaches the client from the organisation and keeps
 * everything the family owns. The row leaves only once the action succeeds.
 */
export function ClientsScreen({ data }: { data: { clients: ClientRow[] } }) {
  const [clients, setClients] = useState(() => data.clients.map((client) => ({ ...client })));
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const listHeading = useRef<HTMLHeadingElement>(null);
  const [pendingRemoval, setPendingRemoval] = useState<ClientRow | null>(null);
  const restoreListFocus = useRef(false);
  const removing = useRef(false);
  useEffect(() => {
    if (pendingRemoval === null && restoreListFocus.current) {
      restoreListFocus.current = false;
      listHeading.current?.focus();
    }
  }, [pendingRemoval]);
  async function confirmRemoval() {
    if (!pendingRemoval || removing.current) return;
    removing.current = true;
    const target = pendingRemoval;
    setNotice("");
    setFailure("");
    let message = "";
    try {
      const result = await removeClient(target.id);
      if (!result.ok) message = result.error.message || REMOVE_FAILED_MESSAGE;
    } catch {
      message = REMOVE_FAILED_MESSAGE;
    } finally {
      removing.current = false;
    }
    if (message) {
      setFailure(message);
    } else {
      setClients((current) => current.filter((client) => client.id !== target.id));
      setNotice(target.name + " removed.");
      restoreListFocus.current = true;
    }
    setPendingRemoval(null);
  }
  return (
    <div className="p-6">
      <CardShell className="min-w-0 border-transparent p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2
            ref={listHeading}
            tabIndex={-1}
            className="text-title-card text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-ring"
          >
            Client List
          </h2>
        </div>
        {clients.length ? (
          <div className="overflow-x-auto">
            <DataTable
              className="min-w-[440px] [&_td]:py-1 [&_td]:break-words [&_td:last-child]:text-right [&_th:last-child]:sr-only"
              rows={clients}
              rowKey={(client) => client.id}
              columns={[
                {
                  key: "name",
                  header: "Name",
                  render: (client) => (
                    <Link
                      href={`${adminClientBase(client.id)}/home`}
                      className="inline-block max-w-64 rounded-control text-text-brand underline-offset-4 [overflow-wrap:anywhere] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {client.name}
                    </Link>
                  ),
                },
                {
                  key: "familyContact",
                  header: "Family contact",
                  render: (client) => (
                    <span className="inline-block max-w-64 text-text-secondary [overflow-wrap:anywhere]">
                      {client.familyContact}
                    </span>
                  ),
                },
                {
                  key: "remove",
                  header: "Actions",
                  render: (client) => (
                    <Button
                      variant="ghost"
                      onClick={() => setPendingRemoval(client)}
                      aria-label={"Remove " + client.name}
                      className="text-body-default text-text-alert-strong"
                    >
                      Remove
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <EmptyState
            title="No clients yet"
            body="Clients appear here once their family links your organisation."
          />
        )}
        <p role="status" className="text-body-small text-text-secondary">
          {notice}
        </p>
        {failure ? (
          <p role="alert" className="text-body-small text-text-alert-strong">
            {failure}
          </p>
        ) : null}
      </CardShell>
      <ConfirmationModal
        open={pendingRemoval !== null}
        title="Remove client?"
        body={
          <>
            <p className="[overflow-wrap:anywhere]">
              Are you sure you want to remove {pendingRemoval?.name}?
            </p>
            <p className="mt-2">
              Your staff will lose access to this client. The family keeps all of their records and
              will be asked to choose a new organisation.
            </p>
          </>
        }
        confirmLabel="Yes, remove"
        cancelLabel="Cancel"
        tone="destructive"
        onConfirm={() => void confirmRemoval()}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}
