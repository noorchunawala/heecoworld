import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Educational Industry Visits UAE | HeecoWorld",
  description:
    "HeecoWorld helps schools, colleges and institutions across the UAE organise educational industry visits, career awareness programs and experiential learning opportunities.",
  keywords: [
    "Industrial Visits UAE",
    "Educational Tours UAE",
    "School Industry Visits",
    "College Industrial Visits",
    "Career Awareness Programs",
    "Experiential Learning UAE",
    "Educational Visits Dubai",
    "Educational Visits Sharjah",
    "HeecoWorld",
    "HEECO",
  ],
  openGraph: {
    title: "Educational Industry Visits UAE | HeecoWorld",
    description:
      "Connecting education with real-world industry exposure.",
    url: "https://heecoworld.com",
    siteName: "HeecoWorld",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}