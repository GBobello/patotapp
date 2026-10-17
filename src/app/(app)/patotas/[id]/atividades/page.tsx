import type { Metadata } from "next";
import { ActivityList } from "@/components/activity-list";
import { canManage } from "@/domain/roles";
import { visibleActivityWhere } from "@/server/activity";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";

export const metadata: Metadata = { title: "Atividades" };

export default async function ActivityPage({ params }: PageProps<"/patotas/[id]/atividades">) {
  const { id } = await params;
  const { membership } = await requireMember(id);

  const activities = await db.activity.findMany({
    where: { patotaId: id, ...visibleActivityWhere(canManage(membership.role)) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <ActivityList items={activities} emptyText="Nada aconteceu por aqui ainda." />;
}
