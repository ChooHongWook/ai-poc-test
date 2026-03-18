import type { Metadata } from "next";
import "@/styles/fonts.css";
import "@/styles/tailwind.css";
import "@/styles/theme.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI 문서 생성 POC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
