import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: '复旦健身社互助预约平台',
  description: '复旦大学健身社内部互助带练预约平台 - 学员预约教练、教练管理时段、管理员审核',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProvider>
          <NavBar />
          <main className="min-h-[calc(100vh-var(--nav-height))]">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
