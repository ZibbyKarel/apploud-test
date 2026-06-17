"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Typography } from "@/lib/components";

/** Stable hooks for tests to locate this component's states. */
export enum QueryBoundaryDataTestIds {
  Loading = "query-boundary-loading",
  Error = "query-boundary-error",
}

/**
 * Renders the loading and error states for a TanStack Query, and hands the
 * resolved data to its render-prop child once the query has settled
 * successfully. Lets pages own data fetching while components stay presentational.
 */
export function QueryBoundary<TData>({
  query,
  children,
}: {
  query: UseQueryResult<TData>;
  children: (data: TData) => ReactNode;
}) {
  const t = useTranslations("App");

  if (query.isFetching) {
    return (
      <Typography variant="body" tone="muted" data-testid={QueryBoundaryDataTestIds.Loading}>
        {t("loading")}
      </Typography>
    );
  }

  if (query.isError) {
    return (
      <Typography
        variant="body"
        tone="danger"
        preWrap
        data-testid={QueryBoundaryDataTestIds.Error}
      >
        {t("error", { message: (query.error as Error).message })}
      </Typography>
    );
  }

  if (query.data === undefined) {
    return null;
  }

  return <>{children(query.data)}</>;
}
