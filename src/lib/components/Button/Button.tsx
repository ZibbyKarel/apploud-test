import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/** Visual variant — `primary` is the main call-to-action, `secondary` is neutral. */
export type ButtonVariant = "primary" | "secondary";

/** Stable hooks for tests to locate this component's parts. */
export enum ButtonDataTestIds {
  Root = "button",
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
}

const BASE_CLASS_NAME =
  "cursor-pointer rounded-md border px-[1.1rem] py-2.5 text-base disabled:cursor-not-allowed disabled:opacity-60";

/** Surface/border/text styling per variant. */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border-success-emphasis bg-success text-white",
  secondary: "border-border bg-surface text-fg hover:border-accent",
};

/**
 * Styled button. Appearance is closed (pick a `variant`); every other native
 * button attribute — `type`, `disabled`, `onClick`, `aria-*` — is forwarded, and
 * the ref points at the underlying `<button>`. Defaults to `type="button"` so it
 * never submits a form by accident; pass `type="submit"` explicitly when needed.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-testid={ButtonDataTestIds.Root}
      className={cn(BASE_CLASS_NAME, VARIANT_CLASSES[variant])}
      {...props}
    />
  );
});
