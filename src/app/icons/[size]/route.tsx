import { ImageResponse } from "next/og";
import { BrandIcon } from "@/components/brand-icon";

const SIZES = { "192": 192, "512": 512, "maskable-512": 512 } as const;

/** Ícones PNG do PWA: /icons/192, /icons/512 e /icons/maskable-512. */
export async function GET(_req: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size: key } = await params;
  const size = SIZES[key as keyof typeof SIZES];
  if (!size) return new Response("Not found", { status: 404 });

  return new ImageResponse(<BrandIcon size={size} maskable={key.startsWith("maskable")} />, {
    width: size,
    height: size,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
