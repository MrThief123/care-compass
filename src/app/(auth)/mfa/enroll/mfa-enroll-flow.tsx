"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { InlineAlert } from "@/components/shared/forms/inline-alert";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { enrollMfaFactor } from "@/server/auth/actions";

import { MfaEnrollForm } from "./mfa-enroll-form";

type Enrolment = { factorId: string; qrCode: string; secret: string };
type State =
  | { status: "loading" }
  | { status: "ready"; enrolment: Enrolment }
  | { status: "error"; message: string };

/** F0-20 AC-04: creates exactly one factor per visit, from the browser, then shows the QR. */
export function MfaEnrollFlow() {
  const [state, setState] = useState<State>({ status: "loading" });
  // React StrictMode runs effects twice in development; the ref keeps that to one enrolment.
  const started = useRef(false);

  const start = useCallback(async () => {
    setState({ status: "loading" });
    const result = await enrollMfaFactor();
    setState(
      result.ok
        ? { status: "ready", enrolment: result.data }
        : { status: "error", message: result.error.message },
    );
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  if (state.status === "ready") return <MfaEnrollForm {...state.enrolment} />;

  if (state.status === "error") {
    return (
      <CardShell className="flex flex-col gap-4">
        <InlineAlert>{state.message}</InlineAlert>
        <Button type="button" onClick={() => void start()} className="w-full">
          Try again
        </Button>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <p role="status" className="text-body-default text-text-secondary">
        Setting up two-factor authentication…
      </p>
    </CardShell>
  );
}
