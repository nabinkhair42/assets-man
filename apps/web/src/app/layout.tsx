import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider, AuthProvider } from "@/providers";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});


export const metadata: Metadata = {
  title: "Assets Manager",
  description: "Manage your files with your own cloud storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={nunitoSans.className}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
