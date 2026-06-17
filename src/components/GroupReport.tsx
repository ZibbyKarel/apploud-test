"use client";

import { useTranslations } from "next-intl";

import type { AccessReport } from "@/types";

import { Column, Typography } from "@/lib/components";

import { UserCard } from "@/components";

/** Stable hooks for tests to locate this component's parts. */
export enum GroupReportDataTestIds {
  Root = "group-report",
  Heading = "group-report-heading",
  TotalBadge = "group-report-total",
}

export function GroupReport({ report }: { report: AccessReport }) {
  const t = useTranslations("App");

  return (
    <section className="mt-8" data-testid={GroupReportDataTestIds.Root}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <Typography variant="sectionTitle" as="h2" data-testid={GroupReportDataTestIds.Heading}>
          {t("reportHeading", { path: report.groupPath })}
        </Typography>
        <span
          data-testid={GroupReportDataTestIds.TotalBadge}
          className="whitespace-nowrap rounded-full border border-accent-emphasis/[0.33] bg-accent-emphasis/[0.13] px-3 py-1 text-[0.9rem] text-fg"
        >
          {t("totalUsers", { count: report.total })}
        </span>
      </div>
      <Column gap="lg">
        {report.users.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </Column>
    </section>
  );
}
