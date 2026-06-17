import { useTranslations } from "next-intl";

import type { Membership } from "@/types";

import { Chip, Row, Tag, Typography, type TagVariant } from "@/lib/components";

/** Stable hooks for tests to locate this component's parts. */
export enum MembershipListDataTestIds {
  /** Root of the groups row. */
  Groups = "group-memberships",
  /** Root of the projects row. */
  Projects = "project-memberships",
  /** The row's label cell. */
  Label = "membership-label",
  /** The empty placeholder shown when there are no memberships. */
  Empty = "membership-empty",
  /** The list of membership tags. */
  List = "membership-list",
}

interface MembershipRowProps {
  /** Row label, e.g. "Groups". */
  label: string;
  items: Membership[];
  /** Tag variant applied to every entry (`primary` groups, `secondary` projects). */
  variant: TagVariant;
  /** Test hook for the row root, distinguishing groups from projects. */
  rootTestId: string;
}

/**
 * A labelled row of membership {@link Tag}s, each carrying its role {@link Chip}.
 *
 * Internal — consumers use the explicit {@link GroupMemberships} /
 * {@link ProjectMemberships} variants so the label and the visual variant can't
 * drift apart at the call site.
 */
function MembershipRow({ label, items, variant, rootTestId }: MembershipRowProps) {
  const t = useTranslations("App");
  return (
    <Row align="baseline" gap="md" padY="xs" data-testid={rootTestId}>
      <Typography variant="label" tone="subtle" data-testid={MembershipListDataTestIds.Label}>
        {label.toUpperCase()}
      </Typography>
      {items.length === 0 ? (
        <Typography
          variant="body"
          as="span"
          tone="subtle"
          data-testid={MembershipListDataTestIds.Empty}
        >
          {t("noMemberships")}
        </Typography>
      ) : (
        <Row grow wrap gap="xs" data-testid={MembershipListDataTestIds.List}>
          {items.map((m) => (
            <Tag
              key={`${m.path}-${m.accessLevel}`}
              path={m.path}
              variant={variant}
              href={m.webUrl}
            >
              <Chip>{m.role}</Chip>
            </Tag>
          ))}
        </Row>
      )}
    </Row>
  );
}

/** The groups a user belongs to. Always rendered with the `primary` (group) styling. */
export function GroupMemberships({ items }: { items: Membership[] }) {
  const t = useTranslations("App");
  return (
    <MembershipRow
      label={t("groupsLabel")}
      items={items}
      variant="primary"
      rootTestId={MembershipListDataTestIds.Groups}
    />
  );
}

/** The projects a user belongs to. Always rendered with the `secondary` (project) styling. */
export function ProjectMemberships({ items }: { items: Membership[] }) {
  const t = useTranslations("App");
  return (
    <MembershipRow
      label={t("projectsLabel")}
      items={items}
      variant="secondary"
      rootTestId={MembershipListDataTestIds.Projects}
    />
  );
}
