"use client";

import Image from "next/image";
import { useState } from "react";

/** Stable hooks for tests to locate this component's parts. */
export enum AvatarDataTestIds {
  Root = "avatar",
  Image = "avatar-image",
  Initials = "avatar-initials",
}

interface AvatarProps {
  /** Avatar image URL. Falls back to initials when absent or it fails to load. */
  src?: string;
  /** User's name — used to derive the initials shown when there is no image. */
  name: string;
  /** Styling is closed — this primitive can't be restyled from the outside. */
  className?: never;
}

/** First + last initial, e.g. `Jan Konáš` → `JK`. Empty name → `?`. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Round user avatar. Renders the image when a URL is given; on a missing or
 * broken URL it falls back to the user's initials. The image is decorative
 * (`alt=""`) — the user's name is always shown next to it.
 */
export function Avatar({ src, name }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      data-testid={AvatarDataTestIds.Root}
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-border text-[0.7rem] font-semibold text-muted"
    >
      {showImage ? (
        <Image
          data-testid={AvatarDataTestIds.Image}
          src={src!}
          alt={`avatar for ${name}`}
          width={36}
          height={36}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span data-testid={AvatarDataTestIds.Initials}>{initials(name)}</span>
      )}
    </span>
  );
}
