"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { Column, Typography } from "@/lib/components";

/** Stable hooks for tests to locate this layout's landmarks. */
export enum MainLayoutDataTestIds {
  Header = "main-layout-header",
  LogoLink = "main-layout-logo-link",
  Main = "main-layout-main",
  Title = "main-layout-title",
  Subtitle = "main-layout-subtitle",
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("App");

  return (
    <>
      <header className="absolute px-8 pt-6" data-testid={MainLayoutDataTestIds.Header}>
        <Link href="/" data-testid={MainLayoutDataTestIds.LogoLink}>
          <Image
            width={60}
            height={60}
            src="/apploud-logo.svg"
            alt="Apploud"
            className="invert"
          />
        </Link>
      </header>
      <main
        className="mx-auto max-w-[880px] px-5 pb-16 pt-8"
        data-testid={MainLayoutDataTestIds.Main}
      >
        <Column gap="xs">
          <Typography variant="pageTitle" data-testid={MainLayoutDataTestIds.Title}>
            {t("title")}
          </Typography>
          <Typography variant="body" tone="muted" data-testid={MainLayoutDataTestIds.Subtitle}>
            {t("subtitle")}
          </Typography>
        </Column>
        {children}
      </main>
    </>
  );
}
