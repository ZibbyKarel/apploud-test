import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Spacing scale shared by `gap` and `padY`. Maps semantic tokens to literal
 * Tailwind classes so the static scanner can see them. No project-wide spacing
 * convention exists yet (Tailwind v4 `@theme` defines colours only), so this is
 * the local source of truth — extend it here rather than passing raw classes.
 */
/** Stable hook for tests to locate a Row/Column. Generic — both variants share it. */
export enum StackDataTestIds {
  Root = "stack",
}

type Space = "xs" | "sm" | "md" | "lg";

const GAP_CLASS: Record<Space, string> = {
  xs: "gap-1.5",
  sm: "gap-2",
  md: "gap-2.5",
  lg: "gap-3",
};

const PAD_Y_CLASS: Record<Space, string> = {
  xs: "py-1.5",
  sm: "py-2",
  md: "py-2.5",
  lg: "py-3",
};

/** Cross-axis alignment. Only the values the app needs are supported; add to the map when more are required. */
type Align = "baseline" | "center";

const ALIGN_CLASS: Record<Align, string> = {
  baseline: "items-baseline",
  center: "items-center",
};

interface StackProps {
  children: ReactNode;
  /** Space between children. */
  gap?: Space;
  /** Cross-axis alignment (`align-items`). */
  align?: Align;
  /** Allow children to wrap onto multiple lines. */
  wrap?: boolean;
  /** Grow to fill the parent's main axis (`flex-1`). */
  grow?: boolean;
  /** Vertical padding. */
  padY?: Space;
  /** Test hook forwarded to the rendered element. Defaults to {@link StackDataTestIds.Root}. */
  "data-testid"?: string;
  /**
   * Styling is closed: these primitives can't be restyled from the outside.
   * Pass layout through the explicit props above — `className` is forbidden.
   */
  className?: never;
}

/**
 * Shared layout primitive. Not exported on its own — consumers pick an explicit
 * direction via the {@link Row} / {@link Column} variants so call sites read as
 * the layout they produce instead of a boolean flag. Styling is fixed; the only
 * way to influence layout is the enumerated props.
 */
function Stack({
  direction,
  gap,
  align,
  wrap,
  grow,
  padY,
  children,
  "data-testid": dataTestId = StackDataTestIds.Root,
}: Omit<StackProps, "className"> & { direction: "flex-row" | "flex-col" }) {
  // `direction` and the token maps hold full literal classes so Tailwind's
  // static scanner can see them — interpolating would hide them from the compiler.
  return (
    <div
      data-testid={dataTestId}
      className={cn(
        "flex min-w-0",
        direction,
        gap && GAP_CLASS[gap],
        align && ALIGN_CLASS[align],
        wrap && "flex-wrap",
        grow && "flex-1",
        padY && PAD_Y_CLASS[padY],
      )}
    >
      {children}
    </div>
  );
}

/** Lay children out in a horizontal row. */
export function Row(props: Omit<StackProps, "className">) {
  return <Stack direction="flex-row" {...props} />;
}

/** Lay children out in a vertical column. */
export function Column(props: Omit<StackProps, "className">) {
  return <Stack direction="flex-col" {...props} />;
}
