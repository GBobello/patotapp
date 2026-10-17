"use client";

import NextLink from "next/link";
import ListItemButton, { type ListItemButtonProps } from "@mui/material/ListItemButton";

export function ListItemLink({ href, ...props }: ListItemButtonProps & { href: string }) {
  return (
    <li>
      <ListItemButton component={NextLink} href={href} {...props} />
    </li>
  );
}
