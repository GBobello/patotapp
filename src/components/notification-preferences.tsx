"use client";

import { useEffect, useState, useTransition } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import { setEmailReminders, subscribePush, unsubscribePush } from "@/app/(app)/perfil/notification-actions";
import { useNotify } from "./feedback";

type PushState = "loading" | "unsupported" | "ios-install" | "unconfigured" | "denied" | "off" | "on";

const HELP: Record<PushState, string> = {
  loading: "Verificando este aparelho…",
  unsupported: "Este navegador não recebe notificações push. Você continua vendo tudo no sino do app.",
  "ios-install": "No iPhone, adicione o PatotApp à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá para ativar.",
  unconfigured: "As notificações push ainda não foram configuradas neste servidor.",
  denied: "As notificações estão bloqueadas para este site. Libere nas configurações do navegador e tente de novo.",
  off: "Avisa neste aparelho sobre jogo novo, times publicados, promoção da lista de espera e pagamentos (para organizadores).",
  on: "Ativadas neste aparelho. Você não é avisado das suas próprias ações.",
};

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

/** RF48: push no PWA (por aparelho) e lembrete por e-mail antes do prazo (por conta). */
export function NotificationPreferences({ vapidKey, emailReminders }: { vapidKey: string | null; emailReminders: boolean }) {
  const notify = useNotify();
  const [push, setPush] = useState<PushState>("loading");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function detect(): Promise<PushState> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        return ios && !window.matchMedia("(display-mode: standalone)").matches ? "ios-install" : "unsupported";
      }
      if (!vapidKey) return "unconfigured";
      if (Notification.permission === "denied") return "denied";
      const existing = await navigator.serviceWorker.getRegistration("/");
      const sub = await existing?.pushManager.getSubscription();
      return sub ? "on" : "off";
    }
    detect()
      .catch(() => "unsupported" as const)
      .then((state) => !cancelled && setPush(state));
    return () => {
      cancelled = true;
    };
  }, [vapidKey]);

  const togglePush = (enable: boolean) =>
    startTransition(async () => {
      try {
        if (enable) {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setPush(permission === "denied" ? "denied" : "off");
            return;
          }
          const reg = await registration();
          await navigator.serviceWorker.ready;
          const sub =
            (await reg.pushManager.getSubscription()) ??
            (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey!) }));
          const result = await subscribePush(sub.toJSON());
          notify(result);
          setPush(result.ok ? "on" : "off");
        } else {
          const reg = await navigator.serviceWorker.getRegistration("/");
          const sub = await reg?.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
            notify(await unsubscribePush(sub.endpoint));
          }
          setPush("off");
        }
      } catch {
        notify({ error: "Não foi possível alterar as notificações neste aparelho. Tente de novo." });
      }
    });

  const toggleEmail = (enabled: boolean) => startTransition(async () => notify(await setEmailReminders(enabled)));

  const pushAvailable = push === "on" || push === "off";

  return (
    <Stack spacing={2}>
      <div>
        <FormControlLabel
          control={
            <Switch
              checked={push === "on"}
              onChange={(e) => togglePush(e.target.checked)}
              slotProps={{ input: { "aria-describedby": "push-help" } }}
            />
          }
          label="Notificações push neste aparelho"
          disabled={pending || !pushAvailable}
        />
        <FormHelperText id="push-help" sx={{ mt: 0 }} aria-live="polite">
          {HELP[push]}
        </FormHelperText>
      </div>
      <div>
        <FormControlLabel
          control={
            <Switch
              defaultChecked={emailReminders}
              onChange={(e) => toggleEmail(e.target.checked)}
              slotProps={{ input: { "aria-describedby": "email-help" } }}
            />
          }
          label="Lembrete por e-mail antes do prazo de confirmação"
          disabled={pending}
        />
        <FormHelperText id="email-help" sx={{ mt: 0 }}>
          Enviado até 24 horas antes do prazo, só se você ainda não respondeu ou marcou talvez.
        </FormHelperText>
      </div>
    </Stack>
  );
}
