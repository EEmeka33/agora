import type { Metadata } from "next";
import { Database, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { isAdmin } from "@/lib/permissions";
import { getAssociation } from "@/lib/queries";
import { databaseFile, uploadDir } from "@/lib/uploads";
import { updateMember } from "@/actions/members";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader, TabLinks } from "@/components/ui/page";
import { ThemePicker } from "@/components/layout/theme";
import { memberValues } from "@/components/members/member-values";
import { LanguagePicker, PasswordForm, ProfileForm } from "@/components/settings/profile-forms";
import { AssociationForm } from "@/components/settings/association-form";

export const metadata: Metadata = { title: "Settings" };

const TABS = ["profile", "security", "appearance", "association", "data"] as const;

export default async function SettingsPage(props: PageProps<"/settings">) {
  const user = await requireUser();
  const { t } = await getI18n();
  const sp = await props.searchParams;
  const admin = isAdmin(user);
  const tabs = TABS.filter((k) => admin || (k !== "association" && k !== "data"));
  const tab = tabs.includes(sp.tab as never) ? (sp.tab as (typeof TABS)[number]) : "profile";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t.settings.title} description={t.settings.subtitle} />
      <TabLinks
        items={tabs.map((k) => ({
          href: k === "profile" ? "/settings" : `/settings?tab=${k}`,
          label: t.settings.tabs[k],
          active: tab === k,
        }))}
      />

      {tab === "profile" && <ProfileTab userId={user.id} t={t} />}

      {tab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>{t.settings.securityTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      )}

      {tab === "appearance" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.settings.appearanceTitle}</CardTitle>
              <CardDescription>{t.settings.appearanceHint}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.common.theme}</p>
              <ThemePicker />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.common.language}</p>
              <LanguagePicker />
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "association" && admin && <AssociationTab t={t} />}

      {tab === "data" && admin && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.settings.dataTitle}</CardTitle>
              <CardDescription>{t.settings.dataHint}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <a href="/api/export/backup" className={buttonVariants({ variant: "outline" })}>
                <FileJson /> {t.settings.exportJson}
              </a>
              <a href="/api/export/transactions" className={buttonVariants({ variant: "outline" })}>
                <FileSpreadsheet /> {t.settings.exportCsv}
              </a>
            </div>
            <div className="rounded-xl bg-muted/60 p-4 text-sm">
              <p className="mb-2 flex items-center gap-2 font-medium">
                <Database className="size-4" /> {t.settings.backupHint}
              </p>
              <code className="block rounded-lg bg-card px-3 py-2 font-mono text-xs break-all">{databaseFile()}</code>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Download className="size-3.5" /> {uploadDir()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function ProfileTab({ userId, t }: { userId: string; t: Awaited<ReturnType<typeof getI18n>>["t"] }) {
  const me = await db.user.findUniqueOrThrow({ where: { id: userId } });
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t.settings.profileTitle}</CardTitle>
          <CardDescription>{t.settings.profileHint}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ProfileForm action={updateMember.bind(null, userId)} member={memberValues(me)} />
      </CardContent>
    </Card>
  );
}

async function AssociationTab({ t }: { t: Awaited<ReturnType<typeof getI18n>>["t"] }) {
  const association = await db.association.findFirst();
  const fallback = await getAssociation();
  const value = association ?? {
    ...fallback,
    shortName: null,
    tagline: null,
    purpose: null,
    registrationNumber: null,
    siret: null,
    foundedAt: null,
    email: null,
    phone: null,
    website: null,
    address: null,
    postalCode: null,
    city: null,
    country: null,
    locale: "en",
  };
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t.settings.associationTitle}</CardTitle>
          <CardDescription>{t.settings.associationHint}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <AssociationForm
          value={{
            name: value.name,
            shortName: value.shortName,
            tagline: value.tagline,
            purpose: value.purpose,
            legalForm: value.legalForm,
            registrationNumber: value.registrationNumber,
            siret: value.siret,
            foundedAt: value.foundedAt,
            email: value.email,
            phone: value.phone,
            website: value.website,
            address: value.address,
            postalCode: value.postalCode,
            city: value.city,
            country: value.country,
            accentColor: value.accentColor,
            locale: value.locale,
            currency: value.currency,
            membershipFeeCents: value.membershipFeeCents,
            fiscalYearStartMonth: value.fiscalYearStartMonth,
          }}
        />
      </CardContent>
    </Card>
  );
}
