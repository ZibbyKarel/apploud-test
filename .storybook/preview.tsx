import type { Preview } from "@storybook/nextjs";
import { NextIntlClientProvider } from "next-intl";
import React from "react";

import messages from "../messages/cs.json";
// Tailwind v4 + the GitHub-dark `@theme` tokens the components style against.
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    // Enable the App Router mock so `useRouter` / `next/link` work in stories.
    nextjs: { appDirectory: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      test: "todo",
    },
    // The app renders on a dark canvas; default the preview to it so the
    // semantic light-on-dark tokens are legible.
    backgrounds: {
      options: {
        canvas: { name: "canvas", value: "#0d1117" },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "canvas" },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="cs" messages={messages}>
        <div className="bg-canvas text-fg p-6">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
