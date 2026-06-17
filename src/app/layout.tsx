import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { MainLayout, SplashScreenLoader } from "@/components";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GitLab Access Audit",
  description:
    "Audit who has access to a GitLab group and its subgroups/projects.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className="bg-canvas text-fg">
        <SplashScreenLoader />
        <NextIntlClientProvider>
          <Providers>
            <MainLayout>{children}</MainLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
