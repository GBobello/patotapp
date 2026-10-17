"use client";

// Componentes MUI que navegam com o roteador do Next.
// Ficam num arquivo client porque Server Components não podem passar `component={NextLink}` adiante.
import NextLink from "next/link";
import Box, { type BoxProps } from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";

export function LinkButton({ href, ...props }: ButtonProps & { href: string }) {
  return <Button component={NextLink} href={href} {...props} />;
}

export function LinkBox({ href, ...props }: BoxProps & { href: string }) {
  return <Box component={NextLink} href={href} {...props} />;
}
