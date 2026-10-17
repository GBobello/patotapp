"use client";

import { usePathname } from "next/navigation";
import Tabs from "@mui/material/Tabs";
import { LinkTab } from "./links";

export type TabItem = { label: string; href: string };

/** Navegação entre as seções da patota. A aba ativa segue a URL. */
export function PatotaTabs({ items }: { items: TabItem[] }) {
  const pathname = usePathname();
  // A aba mais específica que casa com a URL atual (ex.: /jogos/123 → "Jogos").
  const active =
    items
      .filter((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? false;

  return (
    <Tabs
      value={active}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label="Seções da patota"
      component="nav"
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      {items.map((t) => (
        <LinkTab
          key={t.href}
          value={t.href}
          href={t.href}
          label={t.label}
          aria-current={active === t.href ? "page" : undefined}
          sx={{ minHeight: 48 }}
        />
      ))}
    </Tabs>
  );
}
