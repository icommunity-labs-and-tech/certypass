'use client';
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/Header';
import PageBody from '@/components/Body';
import { SidebarProvider, useSidebar } from '@/components/SidebarContext';
import { AuthProvider } from '@/hooks/useAuthSeparated';
import { TutorialProvider } from '@/lib/tutorial/TutorialProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <TutorialProvider>
          <Shell>{children}</Shell>
        </TutorialProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const SIDEBAR_WIDTH = 250;
  const { isDesktop, isOpenMobile, isCollapsedDesktop, closeMobile } = useSidebar();
  const sidebarVisible = isDesktop ? !isCollapsedDesktop : isOpenMobile;

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <div
        className="p-0"
        style={{
          position: 'fixed',
          width: `${SIDEBAR_WIDTH}px`,
          height: '100vh',
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          zIndex: 1050,
        }}
      >
        <Sidebar />
      </div>

      {!isDesktop && isOpenMobile && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ 
            background: 'rgba(0,0,0,0.6)', 
            zIndex: 1030,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={closeMobile}
        />
      )}

      <div 
        className={`flex-grow-1 d-flex flex-column ${!isDesktop && isOpenMobile ? 'sidebar-open-mobile' : ''}`} 
        style={{ 
          marginLeft: isDesktop && !isCollapsedDesktop ? `${SIDEBAR_WIDTH}px` : 0, 
          minHeight: '100vh', 
          transition: 'margin-left 0.25s ease, filter 0.25s ease',
          filter: !isDesktop && isOpenMobile ? 'blur(2px)' : 'none'
        }}
      >
        <main className="flex-grow-1 px-4 py-3 d-flex flex-column">
          <PageHeader />
          <div className="flex-grow-1 d-flex mt-4">
            <PageBody>{children}</PageBody>
          </div>
        </main>
        <Footer />
      </div>

    </div>
  );
}
