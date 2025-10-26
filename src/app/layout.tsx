import "./globals.css";

export const metadata = {
  title: "Descubre con Akipe",
  description: "Discover amazing places with Akipe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white">{children}</body>
    </html>
  );
}
