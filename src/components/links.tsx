"use client";

// Componentes MUI que navegam com o roteador do Next.
// Ficam num arquivo client porque Server Components não podem passar `component={NextLink}` adiante.
import NextLink from "next/link";
import Badge from "@mui/material/Badge";
import Box, { type BoxProps } from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link, { type LinkProps } from "@mui/material/Link";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Button, { type ButtonProps } from "@mui/material/Button";
import CardActionArea, { type CardActionAreaProps } from "@mui/material/CardActionArea";
import Tab, { type TabProps } from "@mui/material/Tab";

export function LinkButton({ href, ...props }: ButtonProps & { href: string }) {
  return <Button component={NextLink} href={href} {...props} />;
}

export function LinkBox({ href, ...props }: BoxProps & { href: string }) {
  return <Box component={NextLink} href={href} {...props} />;
}

export function LinkCardActionArea({ href, ...props }: CardActionAreaProps & { href: string }) {
  return <CardActionArea component={NextLink} href={href} {...props} />;
}

export function LinkTab({ href, ...props }: TabProps & { href: string }) {
  return <Tab component={NextLink} href={href} {...props} />;
}

/** Sino de notificações com contador (RF48). */
export function NotificationsLink({ unread }: { unread: number }) {
  const label = unread ? `Notificações: ${unread} ${unread === 1 ? "nova" : "novas"}` : "Notificações";
  return (
    <IconButton component={NextLink} href="/notificacoes" color="inherit" aria-label={label}>
      {/* Sem notificações, nada de Badge: ao sumir ele ainda mostra o número antigo durante a animação. */}
      {unread ? (
        <Badge badgeContent={unread} color="error" max={99} slotProps={{ badge: { "aria-hidden": true } }}>
          <NotificationsIcon />
        </Badge>
      ) : (
        <NotificationsIcon />
      )}
    </IconButton>
  );
}

/** Link de texto com o roteador do Next (para usar em Server Components). */
export function TextLink({ href, ...props }: LinkProps & { href: string }) {
  return <Link component={NextLink} href={href} {...props} />;
}
