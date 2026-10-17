"use client";

import { useId, useState } from "react";
import NextLink from "next/link";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { logout } from "@/app/(app)/actions";

type Props = { displayName: string; image: string | null };

export function AccountMenu({ displayName, image }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const open = Boolean(anchor);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={`Menu da conta de ${displayName}`}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={image ?? undefined} alt="" sx={{ width: 36, height: 36, bgcolor: "secondary.main", color: "secondary.contrastText" }}>
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={open} onClose={() => setAnchor(null)}>
        <MenuItem component={NextLink} href="/perfil" onClick={() => setAnchor(null)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Meu perfil
        </MenuItem>
        <MenuItem onClick={() => logout()}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </>
  );
}
