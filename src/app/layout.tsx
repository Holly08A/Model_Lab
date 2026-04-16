import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Qualitative Comparator",
  description: "Compare LLM responses, costs, timing, and qualitative scores in one browser-only workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
