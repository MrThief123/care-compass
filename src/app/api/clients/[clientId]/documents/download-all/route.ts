import { Zip, ZipPassThrough } from "fflate";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getDataSourceMode } from "@/server/data-source";
import { uniqueZipNames } from "@/server/documents/zip-names";

/** FD-03: above this the route refuses rather than build an enormous archive. */
const MAX_DOCUMENTS = 300;

const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function problem(status: number, message: string): Response {
  return Response.json({ message }, { status, headers: NO_STORE });
}

/** e.g. "2026-10-08", the day in Melbourne (CLAUDE.md §7). */
function melbourneDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
}

/**
 * F0-25 Download all: one .zip with every non-detached document of the client, read with the
 * signed-in user's own session so RLS (`can_access_client_documents`, and the bucket's own
 * policy) decides what is included. A client the caller cannot access and a client with no
 * documents both give the same 404. Entries are stored, not compressed (PDFs and photos already
 * are), and streamed one file at a time. The first file is read before the response starts so a
 * storage failure is a clean 502; a later failure ends the stream with an error, which a browser
 * reports as a failed download rather than saving a broken archive.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> },
): Promise<Response> {
  if (getDataSourceMode() === "mock") return problem(503, "Documents are not available yet.");

  // `z.guid()`, not `z.uuid()`: seed ids carry no RFC version bits (F0-22 FD-07).
  const { clientId } = await params;
  if (!z.guid().safeParse(clientId).success) return problem(404, "Couldn't find any documents.");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return problem(401, "Sign in to download documents.");

  const { data: rows, error } = await supabase
    .from("documents")
    .select("id, filename, storage_path")
    .eq("client_id", clientId)
    .is("detached_at", null)
    .order("uploaded_at", { ascending: true })
    .order("id", { ascending: true });
  if (error || !rows) return problem(500, "Couldn't prepare the download. Try again.");
  if (rows.length === 0) return problem(404, "Couldn't find any documents.");
  if (rows.length > MAX_DOCUMENTS) {
    return problem(
      413,
      `There are more than ${MAX_DOCUMENTS} documents, which is too many to download at once.`,
    );
  }

  const names = uniqueZipNames(rows.map((row) => row.filename));
  const read = async (path: string): Promise<Uint8Array | null> => {
    const { data, error: downloadError } = await supabase.storage
      .from("client-documents")
      .download(path);
    return downloadError || !data ? null : new Uint8Array(await data.arrayBuffer());
  };

  const first = await read(rows[0]!.storage_path);
  if (!first) return problem(502, "Couldn't prepare the download. Try again.");

  const zip = new Zip();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      zip.ondata = (zipError, chunk, final) => {
        if (zipError) return controller.error(zipError);
        controller.enqueue(chunk);
        if (final) controller.close();
      };
      try {
        for (const [index, row] of rows.entries()) {
          const bytes = index === 0 ? first : await read(row.storage_path);
          if (!bytes) throw new Error("document unreadable");
          const entry = new ZipPassThrough(names[index]!);
          zip.add(entry);
          entry.push(bytes, true);
        }
        zip.end();
      } catch (streamError) {
        zip.terminate();
        controller.error(streamError);
      }
    },
  });

  return new Response(body, {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="care-compass-documents-${melbourneDay()}.zip"`,
    },
  });
}
