import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GitLab Access Audit",
  description: "Audit who has access to a GitLab group and its subgroups/projects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
