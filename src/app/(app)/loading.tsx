import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

/** Esqueleto enquanto a página carrega (Heurística 1: visibilidade do estado do sistema). */
export default function Loading() {
  return (
    <Stack spacing={2} role="status" aria-live="polite">
      <span className="visually-hidden">Carregando…</span>
      <Skeleton variant="text" width="40%" height={48} />
      <Skeleton variant="rounded" height={140} />
      <Skeleton variant="rounded" height={140} />
    </Stack>
  );
}
