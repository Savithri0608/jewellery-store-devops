import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jewellery Store",
  description: "Discover beautiful and timeless jewellery.",
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