import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/** Stable hook for tests to locate this component. */
export enum InputDataTestIds {
  Root = "input",
}

/** Styling is closed; layout (width) is controlled by the parent. */
type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

const CLASS_NAME =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-base text-fg";

/**
 * Styled text input. Appearance is fixed; every native input attribute —
 * `value`, `placeholder`, `inputMode`, `aria-label`, `disabled` — is forwarded,
 * and the ref points at the underlying `<input>`, so it drops straight into
 * `react-hook-form` via `{...register(name)}`. Fills its container (`w-full`);
 * put it in a flex/grid cell to size it.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  return (
    <input ref={ref} data-testid={InputDataTestIds.Root} className={cn(CLASS_NAME)} {...props} />
  );
});
