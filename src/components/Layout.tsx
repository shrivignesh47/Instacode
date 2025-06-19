import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import MobileNavigation from './MobileNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');
  
  const location = useLocation();

  // Check if current page is messages
  const isMessagesPage = location.pathname === '/messages';

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else if (width < 1280) {
        setScreenSize('lg');
      } else if (width < 1536) {
        setScreenSize('xl');
      } else {
        setScreenSize('2xl');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close mobile sidebars when navigating
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const showMobileNav = (screenSize === 'sm' || screenSize === 'md') && !isMessagesPage;
  const showTopNav = !isMessagesPage || (screenSize !== 'sm' && screenSize !== 'md');

  // Calculate layout dimensions
  const getLeftSidebarWidth = () => {
    if (screenSize === 'sm' || screenSize === 'md') return 0;
    return isSidebarCollapsed ? 64 : 256;
  };

  const getMainContentMargins = () => {
    const leftWidth = getLeftSidebarWidth();
    
    return {
      marginLeft: leftWidth,
      width: `calc(100% - ${leftWidth}px)`
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top Navigation */}
      {showTopNav && <TopNavigation 
        onMobileSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />}
      
      <div className="relative">
        {/* Desktop Left Sidebar */}
        {(screenSize === 'lg' || screenSize === 'xl' || screenSize === '2xl') && (
          <div className="fixed left-0 top-16 z-30">
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
            />
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-20 w-6 h-6 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg z-50"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronLeft className="w-3 h-3" />
              )}
            </button>
          </div>
        )}

        {/* Mobile Left Sidebar Overlay - Fixed scrolling issue */}
        {isMobileSidebarOpen && (screenSize === 'sm' || screenSize === 'md') && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setIsMobileSidebarOpen(false)} 
            />
            <div className="relative w-64 bg-gray-800 h-full overflow-y-auto">
              <Sidebar 
                isCollapsed={false}
                isMobile={true}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main 
          className={`transition-all duration-300 ${showTopNav ? 'pt-16' : ''} flex-1`}
          style={getMainContentMargins()}
        >
          <div className={`${
            isMessagesPage 
              ? 'flex flex-col h-full' 
              : 'min-h-screen p-2 sm:p-4 lg:p-6 pb-20 lg:pb-6'
          }`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {showMobileNav && (
        <MobileNavigation />
      )}
    </div>
  );
};

export default Layout;