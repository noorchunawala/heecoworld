import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/constants/site";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import EnquiryModal from "@/components/EnquiryModel";
import { AuthProvider } from "@/components/AuthProvider";
import ProfileCompletionGuard from "@/components/ProfileCompletionGuard";
import { UIProvider } from "@/components/UIProvider";


export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,

  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

 openGraph: {
  title: "Scoolyx | Learn. Assess. Progress.",
  description:
    "A modern education platform for learning, assessments, progress tracking, and school engagement.",
  url: "https://scoolyx.com",
  siteName: "Scoolyx",
  locale: "en_US",
  type: "website",
  images: [
    {
      url: "/Footerlogo.png",
      width: 1200,
      height: 630,
      alt: "Scoolyx",
    },
  ],
},

twitter: {
  card: "summary_large_image",
  title: "Scoolyx | Learn. Assess. Progress.",
  description:
    "A modern education platform for learning, assessments, progress tracking, and school engagement.",
  images: ["/og-image.png"],
},

  metadataBase: new URL("https://scoolyx.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
      <AuthProvider>
  <UIProvider>
    <ProfileCompletionGuard />
    <Navbar />
    {children}
    <Footer />
    <EnquiryModal />
  </UIProvider>
</AuthProvider>
        </body>
    </html>
  );
}