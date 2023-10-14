import "./styles.css";
import { Providers } from "./providers";

export const metadata = {
  title: "AIBOU",
  description: "AI Companion for your Studies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
