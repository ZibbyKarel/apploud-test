import { BrokenCircuitError } from "cockatiel";
import { NextResponse, type NextRequest } from "next/server";

import { GitlabApiError } from "@/api/mutator";
import { buildAccessReport } from "@/api/utils/aggregate";
import { cached } from "@/api/utils/cache";

// Always run on the server at request time (reads process.env.GITLAB_TOKEN).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A cold sweep of ~500 projects takes ~10–15s; raise the serverless limit so the
// first (uncached) request isn't killed. After that, the in-memory cache +
// coalescing keep responses fast and the rate budget safe.
export const maxDuration = 60;

/** How long a completed report is reused before a fresh sweep. */
const REPORT_TTL_MS = 60_000;

export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get("groupId")?.trim();

  if (!groupId) {
    return NextResponse.json(
      { error: "Missing groupId query parameter." },
      { status: 400 },
    );
  }
  if (!/^\d+$/.test(groupId)) {
    return NextResponse.json(
      { error: "groupId must be a numeric group ID." },
      { status: 400 },
    );
  }

  try {
    // Coalesce concurrent requests for the same group into one sweep and reuse
    // the result for REPORT_TTL_MS (see src/lib/cache.ts).
    const report = await cached(`report:${groupId}`, REPORT_TTL_MS, () =>
      buildAccessReport(groupId),
    );
    return NextResponse.json(report, {
      // Edge/browser layer on top of the in-memory cache. All users share one
      // server token, so caching by groupId leaks nothing extra; SWR serves a
      // slightly stale report instantly while the next sweep runs.
      headers: {
        "Cache-Control":
          "private, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    // Circuit breaker is open — GitLab is hard-failing, so we stopped sending.
    if (error instanceof BrokenCircuitError) {
      return NextResponse.json(
        {
          error:
            "GitLab is temporarily unavailable. Please retry in a few seconds.",
        },
        { status: 503 },
      );
    }
    if (error instanceof GitlabApiError) {
      const status =
        error.status === 401 || error.status === 403 || error.status === 404
          ? error.status
          : 502;
      return NextResponse.json(
        { error: `GitLab API responded with ${error.status}.` },
        { status },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
