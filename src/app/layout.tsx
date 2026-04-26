import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { SaveFileProvider } from "@/context/SaveFileContext";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Hollywood Animal — Save Editor",
  description: "Browser-based save file editor for Hollywood Animal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full`}
      style={{ background: "#1d1a15" }}
    >
      <body className="h-full">
        <SaveFileProvider>{children}</SaveFileProvider>
      </body>
    </html>
  );
}
