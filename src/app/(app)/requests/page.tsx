import type { Metadata } from "next";
import { Inbox, Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requireContext } from "@/lib/context";
import { getI18n } from "@/lib/i18n/server";
import { getPoleOptions, getProjectOptions, myPoleIds } from "@/lib/queries";
import { loadRequests } from "@/lib/request-queries";
import { withParams } from "@/lib/url";
import { REQUEST_STATUSES } from "@/lib/constants";
import { createRequest } from "@/actions/requests";
import { EmptyState, PageHeader, Segmented } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { FilterSelect } from "@/components/forms/filters";
import { RequestFields } from "@/components/requests/request-fields";
import { RequestCard } from "@/components/requests/request-card";

export const metadata: Metadata = { title: "Requests" };

const TABS = ["incoming", "sent", "taken", "all"] as const;

export default async function RequestsPage(props: PageProps<"/requests">) {
  const { user, db } = await requireContext();
  const { t } = await getI18n();
  const sp = await props.searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const tab = TABS.includes(get("tab") as never) ? (get("tab") as (typeof TABS)[number]) : "incoming";
  const status = REQUEST_STATUSES.includes(get("status") as never) ? get("status") : "";

  const [poleIds, poles, projects] = await Promise.all([
    myPoleIds(db, user.id),
    getPoleOptions(db),
    getProjectOptions(db),
  ]);
  const where: Prisma.RequestWhereInput = {};
  if (tab === "incoming") {
    where.poleId = { in: poleIds };
    where.status = status || { in: ["OPEN", "TAKEN"] };
  } else {
    if (tab === "sent") where.requesterId = user.id;
    if (tab === "taken") where.takenById = user.id;
    if (status) where.status = status;
  }
  if (get("pole")) where.poleId = tab === "incoming" ? { in: poleIds.filter((id) => id === get("pole")) } : get("pole");
  const requests = await loadRequests(db, where, user);
  const qs = (patch: Record<string, string | null>) => withParams("/requests", sp, patch);
  const myPoles = poles.filter((p) => poleIds.includes(p.id));

  const newRequest = (autoOpen: boolean) => (
    <FormDialog
      title={t.requests.new}
      action={createRequest}
      submitLabel={t.common.create}
      defaultOpen={autoOpen && get("new") === "1"}
      trigger={
        <Button>
          <Plus /> {t.requests.new}
        </Button>
      }
    >
      <RequestFields
        poles={poles}
        myPoles={myPoles}
        projects={projects.map((p) => ({ id: p.id, name: p.title }))}
        defaults={{ poleId: get("pole") || null, fromPoleId: myPoles.length === 1 ? myPoles[0].id : null }}
      />
    </FormDialog>
  );

  return (
    <>
      <PageHeader title={t.requests.title} description={t.requests.subtitle} actions={newRequest(true)} />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented
          items={TABS.map((k) => ({
            href: qs({ tab: k === "incoming" ? null : k, status: null }),
            label: t.requests.tabs[k],
            active: tab === k,
          }))}
        />
        <FilterSelect
          param="status"
          placeholder={t.common.status}
          options={REQUEST_STATUSES.map((s) => ({ value: s, label: t.enums.requestStatus[s] }))}
        />
        <FilterSelect
          param="pole"
          placeholder={t.common.pole}
          options={(tab === "incoming" ? myPoles : poles).map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>
      {requests.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={tab === "incoming" ? t.requests.emptyIncoming : t.requests.empty}
          description={t.requests.subtitle}
          action={newRequest(false)}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </>
  );
}
