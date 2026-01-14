import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/app/globals.css';
import Providers from '@/components/Providers';
import RootContainer from '@/components/RootContainer';
import CustomerCSS from '@/components/CustomerCSS';
import { appConfig } from '@/config/app';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <CustomerCSS />
          <a href="#main" className="visually-hidden-focusable">Saltar al contenido principal</a>
          <RootContainer>
            {children}
          </RootContainer>
        </Providers>
      </body>
    </html>
  );
}
