"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The 'Update' button and its message, as two items for a wrapping flex row:
 * the button, then a full-width line under it. Updating funds is FAM-11, so
 * for now pressing it only says so, in a live region that is on the page from
 * the start so the message is announced (DECISIONS.md FD-06).
 */
export function UpdateFundsButton() {
  const [notice, setNotice] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setNotice(true)}>
        Update
      </Button>
      <p
        role="status"
        className={cn("basis-full text-body-small text-text-secondary", notice && "mt-2")}
      >
        {notice ? "Updating funds is not available yet." : null}
      </p>
    </>
  );
}
