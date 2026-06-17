import { createElement, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Type scale (size + weight). Semantic names, not sizes, so call sites read by
 * role. Only the variants the app needs exist — add to the map when more do.
 */
export type TypographyVariant =
  | "pageTitle"
  | "sectionTitle"
  | "body"
  | "bodySm"
  | "label";

/** Foreground colour token. Same "only what's used" rule as the variants. */
export type TypographyTone = "default" | "muted" | "subtle" | "danger";

/** Elements a consumer may render text as. */
type TypographyElement = "h1" | "h2" | "h3" | "p" | "span" | "label" | "div";

const VARIANT_CLASSES: Record<TypographyVariant, string> = {
  pageTitle: "text-2xl font-bold",
  sectionTitle: "text-base font-semibold",
  body: "text-[0.95rem]",
  bodySm: "text-[0.85rem]",
  label: "text-[0.8rem] uppercase tracking-[0.03em]",
};

const TONE_CLASSES: Record<TypographyTone, string> = {
  default: "text-fg",
  muted: "text-muted",
  subtle: "text-subtle",
  danger: "text-danger",
};

/** Stable hook for tests to locate text. Generic by default; consumers pass an override. */
export enum TypographyDataTestIds {
  Root = "typography",
}

/** Default DOM element per variant; override with `as` when the slot needs another tag. */
const DEFAULT_ELEMENT: Record<TypographyVariant, TypographyElement> = {
  pageTitle: "h1",
  sectionTitle: "h2",
  body: "p",
  bodySm: "p",
  label: "span",
};

interface TypographyProps {
  children: ReactNode;
  variant?: TypographyVariant;
  tone?: TypographyTone;
  /** Override the rendered element (e.g. a `sectionTitle` inline as a `span`). */
  as?: TypographyElement;
  /** Render in the monospace family (paths, usernames). */
  mono?: boolean;
  /** Preserve whitespace + wrap (e.g. multi-line error text). */
  preWrap?: boolean;
  /** Test hook forwarded to the rendered element. Defaults to {@link TypographyDataTestIds.Root}. */
  "data-testid"?: string;
  /** Styling is closed — appearance comes from the enumerated props above. */
  className?: never;
}

/**
 * The single text primitive: consistent type scale + colour tokens, no inline
 * `text-*` classes scattered across the app. Layout (margins, flex sizing) stays
 * the parent's job — compose with {@link Row}/{@link Column} for spacing.
 */
export function Typography({
  children,
  variant = "body",
  tone = "default",
  as,
  mono,
  preWrap,
  "data-testid": dataTestId = TypographyDataTestIds.Root,
}: TypographyProps) {
  return createElement(
    as ?? DEFAULT_ELEMENT[variant],
    {
      "data-testid": dataTestId,
      className: cn(
        VARIANT_CLASSES[variant],
        TONE_CLASSES[tone],
        mono && "font-mono",
        preWrap && "whitespace-pre-wrap",
      ),
    },
    children,
  );
}
