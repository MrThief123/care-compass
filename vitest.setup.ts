import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect } from "vitest";

expect.extend(toHaveNoViolations);

// `globals: false` (vitest.config.ts) means Testing Library's own auto-cleanup
// (which relies on globally-registered afterEach) never runs, so each test
// file's later tests see DOM left over from earlier renders.
afterEach(cleanup);
