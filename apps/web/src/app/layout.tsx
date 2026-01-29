import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://assets-man.nabinkhair.com.np";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Assets Man - Self-hosted File Management",
    template: "%s | Assets Man",
  },
  description:
    "Open source, self-hosted file management with your own S3-compatible storage. Privacy-first, secure sharing, and completely under your control.",
  keywords: [
    "file management",
    "self-hosted",
    "S3 storage",
    "cloud storage",
    "open source",
    "file sharing",
    "privacy",
    "secure file storage",
    "assets management",
    "digital asset management",
  ],
  authors: [{ name: "Nabin Khair", url: "https://github.com/nabinkhair42" }],
  creator: "Nabin Khair",
  publisher: "Assets Man",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Assets Man",
    title: "Assets Man - Self-hosted File Management",
    description:
      "Open source, self-hosted file management with your own S3-compatible storage. Privacy-first, secure sharing, and completely under your control.",
    images: [
      {
        url: "/marketing/files-light.webp",
        width: 1920,
        height: 1080,
        alt: "Assets Man - Your files, your cloud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Assets Man - Self-hosted File Management",
    description:
      "Open source, self-hosted file management with your own S3-compatible storage. Privacy-first and secure.",
    images: ["/marketing/files-light.webp"],
    creator: "@nabinkhair42",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${nunitoSans.className} h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster richColors />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
