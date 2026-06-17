/** Join truthy class names into a single string. A tiny local alternative to
 *  `clsx`/`classnames`, kept dependency-free. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
