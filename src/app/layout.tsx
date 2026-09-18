import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Newsreader } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const sans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"] });
const serif = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], axes: ["opsz"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Doc Notes — ABSITE",
  description: "Capture, enhance, and review ABSITE study notes",
  appleWebApp: { capable: true, title: "Doc Notes", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Nav />
        <div className="md:pl-58">
          <main className="mx-auto w-full max-w-5xl px-5 pt-7 pb-32 md:px-12 md:pt-10 md:pb-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
