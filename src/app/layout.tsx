import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobify | AI-Powered Job Assistant",
  description: "Next-generation job application management and career optimization platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-orange-500/30 selection:text-orange-200">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,17,27,0.5),rgba(10,10,15,1))] -z-10" />
        {children}
      </body>
    </html>
  );
}
