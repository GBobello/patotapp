"use client";

import { useEffect } from "react";
import { markNotificationsSeen } from "./actions";

/** Ao abrir a página, zera o contador do sino (sem alterar o destaque desta visita). */
export function MarkSeen() {
  useEffect(() => {
    markNotificationsSeen();
  }, []);
  return null;
}
