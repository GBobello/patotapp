import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { cookies } from "next/headers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { NotifyProvider } from "@/components/feedback";
import { readPreferences } from "@/lib/preferences";
import theme from "@/theme/theme";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: { default: "PatotApp", template: "%s · PatotApp" },
  description: "Organize sua patota de futebol de forma colaborativa e acessível.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B6B3A" },
    { media: "(prefers-color-scheme: dark)", color: "#10140F" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const prefs = readPreferences((name) => jar.get(name)?.value);
  // Fonte maior via font-size do <html>: todo o tema MUI usa rem e acompanha (WCAG 1.4.4).
  // Classes ficam no <body> para não conflitar com a classe de tema que o MUI põe no <html>.
  const bodyClass = [prefs.highContrast && "high-contrast", prefs.reduceMotion && "reduce-motion"].filter(Boolean).join(" ");

  return (
    <html
      lang="pt-BR"
      className={roboto.variable}
      style={prefs.fontScale === "100" ? undefined : { fontSize: `${prefs.fontScale}%` }}
      suppressHydrationWarning
    >
      <body className={bodyClass || undefined}>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <NotifyProvider>{children}</NotifyProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
