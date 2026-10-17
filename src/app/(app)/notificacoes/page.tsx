import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ActivityList } from "@/components/activity-list";
import { listNotifications } from "@/server/notifications";
import { requireUser } from "@/server/session";
import { MarkSeen } from "./mark-seen";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  const seenAt = user.notificationsSeenAt;

  return (
    <Stack spacing={2}>
      <MarkSeen />
      <Typography variant="h4" component="h1">
        Notificações
      </Typography>
      <ActivityList
        emptyText="Nenhuma notificação. Quando alguém confirmar presença, publicar times ou avisos, aparece aqui."
        items={items.map((a) => ({
          ...a,
          patotaName: a.patota.name,
          unread: !seenAt || a.createdAt > seenAt,
        }))}
      />
    </Stack>
  );
}
