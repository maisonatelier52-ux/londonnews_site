import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </SessionProvider>
  );
}
