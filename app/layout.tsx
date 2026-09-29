import type { Metadata } from "next";
import { Anton, Rubik } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Craftland · Panel del staff",
  description:
    "Panel interno del staff de Craftland: contraseñas, finanzas, tareas y servidores.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${anton.variable} ${rubik.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
