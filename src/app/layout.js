import { Inter } from 'next/font/google';
import Providers from '@/components/providers';
import ConditionalLayout from '@/components/Layout/ConditionalLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CST Votes - College of Science and Technology Voting System',
  description: 'A secure and transparent platform for student council elections at CST.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}