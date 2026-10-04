'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import { adminLogoutAction } from '@/app/actions/auth';

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogoutAction();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
    { name: 'Create Coupon', href: '/dashboard/coupons/create', icon: <path d="M12 4v16m8-8H4" /> },
    { name: 'All Coupons', href: '/dashboard/coupons', icon: <path d="M4 6h16M4 12h16M4 18h16" /> },
    { name: 'Verify Coupon', href: '/dashboard/verify', icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /> },
    { name: 'Audit Log', href: '/dashboard/audit-log', icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
  ];

  return (
    <div className="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-[#3E2723] text-white">
        <div className="p-6 flex flex-col items-center border-b border-[#5D4037]">
          <img src="/logo.png" alt="Akshaya Jewellers" className="w-16 h-16 object-contain mb-2" />
          <h1 className="text-xl font-semibold text-[#D4AF37]">Akshaya Jewellers</h1>
        </div>
        <nav className="sidebar-nav flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`sidebar-link flex items-center px-6 py-3 transition-colors ${isActive ? 'bg-[#5D4037] text-[#D4AF37] border-r-4 border-[#D4AF37]' : 'hover:bg-[#4E342E]'}`}>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {item.icon}
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#5D4037]">
          <div className="text-sm text-gray-300 mb-4 truncate px-2">{userEmail}</div>
          <button onClick={handleLogout} className="btn btn-secondary w-full flex justify-center items-center">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content md:ml-[260px] pb-16 md:pb-0 min-h-screen bg-gray-50 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Nav */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-[#3E2723] text-white flex md:hidden justify-around items-center h-16 z-50">
        {[navItems[0], navItems[1], navItems[2], navItems[3]].map((item) => (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full h-full ${pathname === item.href ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{item.icon}</svg>
            <span className="text-[10px] mt-1">{item.name.split(' ')[0]}</span>
          </Link>
        ))}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`flex flex-col items-center justify-center w-full h-full ${isMobileMenuOpen ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[10px] mt-1">More</span>
        </button>
      </nav>

      {/* Mobile More Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-[#3E2723] rounded-t-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col py-2">
              {navItems.slice(4).map(item => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-6 py-4 border-b border-[#5D4037] ${pathname === item.href ? 'text-[#D4AF37]' : 'text-white'}`}>
                  <svg className="w-5 h-5 mr-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{item.icon}</svg>
                  {item.name}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center px-6 py-4 text-white hover:bg-[#4E342E] w-full text-left">
                <svg className="w-5 h-5 mr-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
