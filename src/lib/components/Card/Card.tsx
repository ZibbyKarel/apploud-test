import Link from "next/link";
import type { ReactNode } from "react";

import { Row, Column } from "../Stack";
import { Typography } from "../Typography";

/** Stable hooks for tests to locate this component's parts. */
export enum CardDataTestIds {
  Root = "card",
  TitleLink = "card-title-link",
  Title = "card-title",
  Subtitle = "card-subtitle",
}

interface CardProps {
  /** Primary heading of the card. */
  title: ReactNode;
  /** When set, the title is rendered as a link to this URL. */
  titleHref?: string;
  /** Secondary text shown beside the title. */
  subtitle?: ReactNode;
  /** Optional element rendered to the left of the title, e.g. an avatar. */
  leading?: ReactNode;
  /** Card body. */
  children?: ReactNode;
  /** Test hook forwarded to the root element. Defaults to {@link CardDataTestIds.Root}. */
  "data-testid"?: string;
  /** Styling is closed — this primitive can't be restyled from the outside. */
  className?: never;
}

/**
 * A bordered surface with a title/subtitle header and arbitrary body content.
 * Uses {@link Column} / {@link Row} internally to lay out its header and body.
 */
export function Card({
  title,
  titleHref,
  subtitle,
  leading,
  children,
  "data-testid": dataTestId = CardDataTestIds.Root,
}: CardProps) {
  return (
    <article
      data-testid={dataTestId}
      className="rounded-lg border border-border bg-surface px-[1.1rem] py-4"
    >
      <Column gap="lg">
        <Row align="center" gap="sm">
          {leading}
          <Row wrap align="baseline" gap="sm">
            {titleHref ? (
              <Link
                data-testid={CardDataTestIds.TitleLink}
                className="text-base font-semibold text-fg no-underline hover:text-accent hover:underline"
                href={titleHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
              </Link>
            ) : (
              <Typography variant="sectionTitle" as="span" data-testid={CardDataTestIds.Title}>
                {title}
              </Typography>
            )}
            {subtitle ? (
              <Typography
                variant="bodySm"
                as="span"
                tone="muted"
                mono
                data-testid={CardDataTestIds.Subtitle}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Row>
        </Row>
        {children}
      </Column>
    </article>
  );
}
