'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

  const handleLogout = async () => {
    await adminLogoutAction();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />, bgClass: 'bg-[#4E342E] text-white' },
    { name: '+ Create', full: 'Create Coupon', href: '/dashboard/coupons/create', icon: <path d="M12 4v16m8-8H4" />, bgClass: 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold shadow-md' },
    { name: '📋 All', full: 'All Coupons', href: '/dashboard/coupons', icon: <path d="M4 6h16M4 12h16M4 18h16" />, bgClass: 'bg-[#5D4037] text-white border border-[#8D6E63]' },
    { name: '✓ Verify', full: 'Verify Coupon', href: '/dashboard/verify', icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />, bgClass: 'bg-[#2E7D32] text-white font-semibold' },
  ];

  return (
    <div className="dashboard-layout min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden sticky top-0 z-50 bg-[#3E2723] text-white shadow-lg border-b border-[#5D4037]">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-serif font-bold text-[#D4AF37]">
            Akshaya Jewellers
          </Link>
          <button 
            onClick={handleLogout} 
            className="text-xs bg-[#5D4037] text-gray-200 px-3 py-1.5 rounded-full hover:bg-[#6D4C41] flex items-center gap-1 border border-[#8D6E63]"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Mobile Main Top Filled Buttons Row */}
        <div className="px-3 pb-3 pt-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 min-w-[76px] text-center py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  isActive 
                    ? 'ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#3E2723] font-bold shadow-md ' + item.bgClass
                    : 'opacity-90 hover:opacity-100 ' + item.bgClass
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  {item.icon}
                </svg>
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-[#3E2723] text-white z-40">
          <div className="p-6 flex flex-col items-center border-b border-[#5D4037]">
            <h1 className="text-xl font-semibold text-[#D4AF37] text-center">Akshaya Jewellers</h1>
          </div>
          <nav className="sidebar-nav flex-1 overflow-y-auto py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`sidebar-link flex items-center px-6 py-3 transition-colors ${isActive ? 'bg-[#5D4037] text-[#D4AF37] border-r-4 border-[#D4AF37]' : 'hover:bg-[#4E342E]'}`}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {item.icon}
                  </svg>
                  {item.full || item.name}
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
        <main className="main-content flex-1 md:ml-[260px] min-h-screen bg-gray-50 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
