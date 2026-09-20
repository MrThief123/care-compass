"use client";

import { useEffect, useState } from "react";
import { DevPreviewNav } from "@/components/shared/dev-preview-nav";

export default function DatabasePreviewPage() {
  const [data, setData] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestData = async () => {
      try {
        const response = await fetch("/api/test");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Failed to load test data");
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, []);

  return (
    <main className="p-6">
      <DevPreviewNav />
      <h1 className="text-2xl font-semibold">Database Connection</h1>

      {loading && <p className="mt-4">Loading...</p>}

      {error && (
        <p className="mt-4">
          Error: {error}
        </p>
      )}

      {!loading && !error && (
        <pre className="mt-4 overflow-auto rounded-card border border-border-default p-4">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}