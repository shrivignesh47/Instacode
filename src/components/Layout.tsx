import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import RightSidebar from './RightSidebar';
import MobileNavigation from './MobileNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false);
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
        setIsRightSidebarCollapsed(true);
      } else if (width < 1024) {
        setScreenSize('md');
        setIsRightSidebarCollapsed(true);
      } else if (width < 1280) {
        setScreenSize('lg');
        setIsRightSidebarCollapsed(true);
      } else if (width < 1536) {
        setScreenSize('xl');
        setIsRightSidebarCollapsed(false);
      } else {
        setScreenSize('2xl');
        setIsRightSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close mobile sidebars when navigating
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsMobileRightSidebarOpen(false);
  }, [location.pathname]);

  const showMobileNav = (screenSize === 'sm' || screenSize === 'md') && !isMessagesPage;
  const showTopNav = !isMessagesPage || (screenSize !== 'sm' && screenSize !== 'md');

  // Calculate layout dimensions
  const getLeftSidebarWidth = () => {
    if (screenSize === 'sm' || screenSize === 'md') return 0;
    return isSidebarCollapsed ? 64 : 256;
  };

  const getRightSidebarWidth = () => {
    if (isMessagesPage || screenSize === 'sm' || screenSize === 'md') return 0;
    if (isRightSidebarCollapsed) return 0;
    return screenSize === '2xl' ? 384 : 320;
  };

  const getMainContentMargins = () => {
    const leftWidth = getLeftSidebarWidth();
    const rightWidth = getRightSidebarWidth();
    
    return {
      marginLeft: leftWidth,
      marginRight: rightWidth,
      width: `calc(100% - ${leftWidth + rightWidth}px)`
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

        {/* Desktop Right Sidebar */}
        {!isMessagesPage && (screenSize === 'lg' || screenSize === 'xl' || screenSize === '2xl') && (
          <div className="fixed right-0 top-16 z-30">
            <RightSidebar 
              isCollapsed={isRightSidebarCollapsed}
              onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
              screenSize={screenSize}
            />
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
              className="absolute -left-3 top-20 w-6 h-6 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg z-50"
            >
              {isRightSidebarCollapsed ? (
                <ChevronLeft className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          </div>
        )}

        {/* Mobile Right Sidebar Overlay */}
        {isMobileRightSidebarOpen && !isMessagesPage && (screenSize === 'sm' || screenSize === 'md') && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileRightSidebarOpen(false)} />
            <div className="relative w-80 bg-gray-800 h-full overflow-y-auto">
              <RightSidebar 
                isCollapsed={isRightSidebarCollapsed}
                onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                isMobile={true}
                onClose={() => setIsMobileRightSidebarOpen(false)}
                screenSize={screenSize}
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