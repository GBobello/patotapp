// Dados de demonstração para apresentar o app e fazer as validações com a patota.
// Uso: npm run db:seed   (pode rodar de novo: recria só a patota de demonstração)
//
// Para entrar como organizador, use o e-mail organizador@patotapp.test na tela de login;
// sem AUTH_RESEND_KEY o link de acesso aparece no terminal do `npm run dev`.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Position } from "../src/generated/prisma/client";
import { nextOccurrence } from "../src/domain/dates";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PLAYERS: [name: string, position: Position, rating: number, secondary: Position[]][] = [
  ["Organizador Demo", "MEI", 3, ["ATA"]],
  ["Carlos Paredão", "GOL", 4, []],
  ["Marcão", "GOL", 3, []],
  ["Bruno", "ZAG", 4, ["LAT"]],
  ["Diego", "ZAG", 2, []],
  ["Felipe", "ZAG", 3, []],
  ["Lucas", "LAT", 3, ["MEI"]],
  ["Thiago", "LAT", 2, []],
  ["Rafa", "MEI", 5, []],
  ["Gustavo", "MEI", 3, []],
  ["Henrique", "MEI", 2, ["GOL"]],
  ["Pedro", "ATA", 4, []],
  ["João", "ATA", 3, []],
  ["Vini", "ATA", 1, []],
];

async function main() {
  await db.patota.deleteMany({ where: { inviteCode: "DEMO2026" } });

  const users = [];
  for (const [i, [name, primaryPosition, , secondaryPositions]] of PLAYERS.entries()) {
    const email = i === 0 ? "organizador@patotapp.test" : `jogador${i}@patotapp.test`;
    users.push(
      await db.user.upsert({
        where: { email },
        update: { name, primaryPosition, secondaryPositions },
        create: { email, name, primaryPosition, secondaryPositions, emailVerified: new Date() },
      }),
    );
  }

  const patota = await db.patota.create({
    data: {
      name: "Futebol de Quinta (demo)",
      description: "Patota de demonstração do PatotApp.",
      location: "Arena Society Centro — quadra 2",
      inviteCode: "DEMO2026",
      defaultWeekday: 4,
      defaultTime: "20:00",
      defaultMaxPlayers: 14,
      billingMode: "FIXED_MONTHLY",
      monthlyCostCents: 60000,
      monthlyFeeCents: 5000,
      dropInFeeCents: 2500,
      pixKey: "patota.demo@exemplo.com",
      keeperExempt: true,
    },
  });

  const memberships = [];
  for (const [i, user] of users.entries()) {
    memberships.push(
      await db.membership.create({
        data: {
          patotaId: patota.id,
          userId: user.id,
          role: i === 0 ? "ORGANIZER" : "PLAYER",
          type: i >= 12 ? "DIARISTA" : "MENSALISTA",
          rating: PLAYERS[i][2],
        },
      }),
    );
  }
  memberships.push(
    await db.membership.create({
      data: { patotaId: patota.id, guestName: "Tio do Churrasco", guestPosition: "ATA", type: "DIARISTA", rating: 2 },
    }),
  );

  const startsAt = nextOccurrence(4, "20:00")!;
  const game = await db.game.create({
    data: {
      patotaId: patota.id,
      startsAt,
      location: patota.location,
      maxPlayers: 14,
      teamsCount: 2,
      confirmationDeadline: new Date(startsAt.getTime() - 3 * 60 * 60 * 1000),
    },
  });

  // 12 confirmados, 1 talvez, 1 não vai; o resto sem resposta.
  const statuses = ["CONFIRMED", "MAYBE", "DECLINED"] as const;
  for (const [i, m] of memberships.entries()) {
    const status = i < 12 ? statuses[0] : i === 12 ? statuses[1] : i === 13 ? statuses[2] : null;
    if (!status) continue;
    await db.attendance.create({
      data: { gameId: game.id, membershipId: m.id, status, statusChangedAt: new Date(Date.now() - (20 - i) * 60_000) },
    });
  }

  await db.announcement.create({
    data: {
      patotaId: patota.id,
      authorId: memberships[0].id,
      text: "Bem-vindos ao PatotApp! Confirmem presença até quinta às 17h. A mensalidade de R$ 50 vence dia 10.",
      pinned: true,
    },
  });

  console.log(`Patota de demonstração criada: ${patota.name}`);
  console.log(`Convite: /convite/${patota.inviteCode}`);
  console.log("Entre como organizador com o e-mail organizador@patotapp.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
