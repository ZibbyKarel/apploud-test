import { NextResponse, type NextRequest } from "next/server";

import { GitlabApiError } from "@/api/mutator";
import { buildAccessReport } from "@/lib/aggregate";

// Always run on the server at request time (reads process.env.GITLAB_TOKEN).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get("groupId")?.trim();

  if (!groupId) {
    return NextResponse.json({ error: "Missing groupId query parameter." }, { status: 400 });
  }
  if (!/^\d+$/.test(groupId)) {
    return NextResponse.json({ error: "groupId must be a numeric group ID." }, { status: 400 });
  }

  try {
    const report = await buildAccessReport(groupId);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof GitlabApiError) {
      const status = error.status === 401 || error.status === 403 || error.status === 404
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
