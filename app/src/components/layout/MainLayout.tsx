import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

function MainLayoutContent() {
  const { isExpanded } = useSidebar();

  useEffect(() => {
    // Ensure admin dashboard always uses the clean light theme
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="flex min-h-screen mesh-bg overflow-x-hidden">
      <Sidebar />
      <div
        className={`flex flex-col flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'lg:ml-[260px]' : 'lg:ml-[95px]'
        }`}
      >
        <MobileHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] w-full mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  );
}
