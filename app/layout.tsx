import "./globals.css";

export const metadata = {
  title: "July Content Calendar — Dashboard",
  description: "Content planner and shoot-prep details in one place",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
