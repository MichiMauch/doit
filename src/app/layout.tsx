import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Audiowide, Red_Hat_Display } from "next/font/google";

const audiowide = Audiowide({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-audiowide',
});

const redHatDisplay = Red_Hat_Display({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-red-hat-display',
});

export const metadata = {
  title: "DOIT",
  description: "Powerful Task Management App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${audiowide.variable} ${redHatDisplay.variable}`}>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}