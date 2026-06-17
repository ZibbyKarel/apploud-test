import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import messages from "../../messages/cs.json";

/**
 * Render a component inside the real Czech message catalogue, mirroring how the
 * app wraps everything in {@link NextIntlClientProvider}. Components that call
 * `useTranslations` work without per-test stubbing, and assertions can use the
 * actual translated strings.
 */
export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale="cs" messages={messages}>
        {children}
      </NextIntlClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
