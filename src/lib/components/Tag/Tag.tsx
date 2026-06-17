import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** Visual variant — `primary` for groups, `secondary` for projects. */
export type TagVariant = "primary" | "secondary";

/** Stable hooks for tests to locate this component's parts. */
export enum TagDataTestIds {
  Root = "tag",
  Path = "tag-path",
}

interface TagProps {
  /** The group/project path to display. */
  path: string;
  variant?: TagVariant;
  /** When set, the tag is rendered as a link to this URL. */
  href?: string;
  /** Optional trailing content, e.g. a {@link Chip} with the role. */
  children?: ReactNode;
}

/** Surface/border styling per variant. */
const VARIANT_CLASSES: Record<TagVariant, string> = {
  primary:
    "bg-accent-emphasis/[0.08] border-accent-emphasis/[0.33] hover:border-accent",
  secondary:
    "bg-purple-emphasis/[0.08] border-purple-emphasis/[0.33] hover:border-purple",
};

/** Path text colour per variant. */
const PATH_CLASSES: Record<TagVariant, string> = {
  primary: "text-accent",
  secondary: "text-purple",
};

const BASE_CLASS_NAME =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-[0.2rem] text-[0.82rem] text-fg no-underline";

/**
 * A pill displaying a group or project path. Its `variant` colour distinguishes
 * groups (`primary`) from projects (`secondary`). Children render inside the
 * pill, typically a {@link Chip} with the user's role.
 */
export function Tag({ path, variant = "primary", href, children }: TagProps) {
  const base = cn(BASE_CLASS_NAME, VARIANT_CLASSES[variant]);

  const content = (
    <>
      <span
        data-testid={TagDataTestIds.Path}
        className={cn("font-mono", PATH_CLASSES[variant], "group-hover:underline")}
      >
        {path}
      </span>
      {children}
    </>
  );

  return href ? (
    <Link
      data-testid={TagDataTestIds.Root}
      className={cn("group", base)}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content}
    </Link>
  ) : (
    <span data-testid={TagDataTestIds.Root} className={base}>
      {content}
    </span>
  );
}
