import "./globals.css";

export const metadata = {
  title: "echo room - speak your mind. just vibes.",
  description: "Post thoughts under a random alias. Complete anonymity, no followers, emoji-only reactions and comments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
