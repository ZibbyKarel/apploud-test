import type { ReactNode } from "react";

/** Stable hook for tests to locate this component. */
export enum ChipDataTestIds {
  Root = "chip",
}

interface ChipProps {
  /** Chip content, e.g. a role name. */
  children: ReactNode;
  /** Styling is closed — this primitive can't be restyled from the outside. */
  className?: never;
}

/** A small badge, used inside a {@link Tag} to show the user's role. */
export function Chip({ children }: ChipProps) {
  return (
    <span
      data-testid={ChipDataTestIds.Root}
      className="rounded bg-border px-1.5 py-[0.05rem] text-[0.72rem] text-chip"
    >
      {children}
    </span>
  );
}
