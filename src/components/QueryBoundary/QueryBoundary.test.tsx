import type { UseQueryResult } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/intl";

import { QueryBoundary, QueryBoundaryDataTestIds } from "./QueryBoundary";

/** Build a minimal query-result stub with only the fields QueryBoundary reads. */
function makeQuery<TData>(
  partial: Partial<UseQueryResult<TData>>,
): UseQueryResult<TData> {
  return {
    isFetching: false,
    isError: false,
    error: null,
    data: undefined,
    ...partial,
  } as UseQueryResult<TData>;
}

const renderChild = (data: string) => <span>child:{data}</span>;

describe("QueryBoundary", () => {
  it("renders the loading state while fetching", () => {
    renderWithIntl(
      <QueryBoundary query={makeQuery<string>({ isFetching: true })}>
        {renderChild}
      </QueryBoundary>,
    );
    expect(screen.getByTestId(QueryBoundaryDataTestIds.Loading)).toBeInTheDocument();
    expect(screen.queryByText(/child:/)).not.toBeInTheDocument();
  });

  it("renders the error message when the query errors", () => {
    renderWithIntl(
      <QueryBoundary
        query={makeQuery<string>({
          isError: true,
          error: new Error("boom"),
        })}
      >
        {renderChild}
      </QueryBoundary>,
    );
    expect(screen.getByTestId(QueryBoundaryDataTestIds.Error)).toHaveTextContent("boom");
    expect(screen.queryByText(/child:/)).not.toBeInTheDocument();
  });

  it("renders children with the data once settled", () => {
    renderWithIntl(
      <QueryBoundary query={makeQuery<string>({ data: "ok" })}>
        {renderChild}
      </QueryBoundary>,
    );
    expect(screen.getByText("child:ok")).toBeInTheDocument();
  });

  it("renders nothing when there is no data yet and no fetch in flight", () => {
    const { container } = renderWithIntl(
      <QueryBoundary query={makeQuery<string>({})}>{renderChild}</QueryBoundary>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
