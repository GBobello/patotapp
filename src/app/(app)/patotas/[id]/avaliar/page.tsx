import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { PeerRatingList, type PeerRow } from "@/components/peer-rating-list";
import { MIN_PEER_VOTES, memberImage, memberName, memberPositions } from "@/domain/members";
import { db } from "@/server/db";
import { requireMember } from "@/server/patotas";

export const metadata: Metadata = { title: "Avaliar colegas" };

/** RF28: avaliação entre pares. As notas são secretas; só a média entra no sorteio. */
export default async function PeerRatingPage({ params }: PageProps<"/patotas/[id]/avaliar">) {
  const { id } = await params;
  const { patota, membership: me } = await requireMember(id);
  if (!patota.peerRatingEnabled) notFound();

  const [members, mine] = await Promise.all([
    db.membership.findMany({ where: { patotaId: id, status: "ACTIVE", id: { not: me.id } }, include: { user: true } }),
    db.peerRating.findMany({ where: { raterId: me.id } }),
  ]);
  const myRatings = new Map(mine.map((r) => [r.rateeId, r.rating]));

  const peers: PeerRow[] = members
    .map((m) => ({
      id: m.id,
      name: memberName(m),
      image: memberImage(m),
      position: memberPositions(m).primary,
      myRating: myRatings.get(m.id) ?? null,
    }))
    // Quem você ainda não avaliou aparece primeiro.
    .sort((a, b) => Number(a.myRating !== null) - Number(b.myRating !== null) || a.name.localeCompare(b.name, "pt-BR"));

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Dê uma nota de 1 a 5 para o nível de cada colega. <strong>Ninguém vê a nota que você deu</strong> — nem o
        organizador. Com pelo menos {MIN_PEER_VOTES} avaliações, a média da galera entra na nota usada no sorteio, junto
        com a do organizador, para os times ficarem mais justos.
      </Alert>
      <PeerRatingList patotaId={id} peers={peers} />
    </Stack>
  );
}
