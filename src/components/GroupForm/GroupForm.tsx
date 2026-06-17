"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Input, Row } from "@/lib/components";

/**
 * Stable hooks for tests. The input and submit button are located via the
 * primitives' own ids ({@link InputDataTestIds}, {@link ButtonDataTestIds}).
 */
export enum GroupFormDataTestIds {
  Form = "group-form",
}

/** Single-field draft schema — zod gates submit, the form owns the draft state. */
const groupFormSchema = z.object({
  groupId: z.string().trim().min(1),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

export function GroupForm({
  defaultGroupId = "",
  onSubmit,
}: {
  defaultGroupId?: string;
  onSubmit: (groupId: string) => void;
}) {
  const t = useTranslations("App");

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { groupId: defaultGroupId },
  });

  return (
    <form
      data-testid={GroupFormDataTestIds.Form}
      onSubmit={handleSubmit((values) => onSubmit(values.groupId))}
    >
      <Row gap="lg">
        <Input
          inputMode="numeric"
          aria-label={t("inputPlaceholder")}
          placeholder={t("inputPlaceholder")}
          {...register("groupId")}
        />
        <Button type="submit" variant="primary" disabled={!isValid}>
          {t("submit")}
        </Button>
      </Row>
    </form>
  );
}
