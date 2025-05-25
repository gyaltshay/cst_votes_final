import { Inter } from 'next/font/google';
import "./globals.css";
import { connectDB, disconnectDB } from "@/lib/prisma";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CST Voting System',
  description: 'A secure voting system for CST students',
};

export default async function RootLayout({ children }) {
  // Ensure database connection
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to database:", error);
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

// Handle cleanup on server shutdown
process.on('SIGTERM', async () => {
  try {
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
});