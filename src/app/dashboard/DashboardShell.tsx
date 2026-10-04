'use client';

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

  const desktopNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
    { name: 'Create Coupon', href: '/dashboard/coupons/create', icon: <path d="M12 4v16m8-8H4" /> },
    { name: 'All Coupons', href: '/dashboard/coupons', icon: <path d="M4 6h16M4 12h16M4 18h16" /> },
    { name: 'Verify Coupon', href: '/dashboard/verify', icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <path d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /> },
  ];

  const mobileBottomNav = [
    { name: 'Dashboard', short: '🏠 Dashboard', href: '/dashboard', icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
    { name: 'Coupons', short: '🎟 Coupons', href: '/dashboard/coupons', icon: <path d="M4 6h16M4 12h16M4 18h16" /> },
    { name: 'Create', short: '＋ Create', href: '/dashboard/coupons/create', isProminent: true, icon: <path d="M12 4v16m8-8H4" /> },
    { name: 'Verify', short: '✓ Verify', href: '/dashboard/verify', icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { name: 'Settings', short: '⚙ Settings', href: '/dashboard/settings', icon: <path d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /> },
  ];

  return (
    <div className="dashboard-layout min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Top Compact Brand Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#3E2723] text-white shadow-md border-b border-[#5D4037] px-4 py-2.5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-full object-cover border border-[#D4AF37]" />
          <span className="font-serif font-bold text-base text-[#D4AF37]">Akshaya Jewellers</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs bg-[#5D4037] text-gray-200 px-2.5 py-1 rounded-full hover:bg-[#6D4C41] flex items-center gap-1 border border-[#8D6E63]"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-[#3E2723] text-white z-40">
          <div className="p-6 flex flex-col items-center border-b border-[#5D4037]">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full object-cover mb-2 border border-[#D4AF37] shadow-md" />
            <h1 className="text-xl font-serif font-bold text-[#D4AF37] text-center">Akshaya Jewellers</h1>
            <p className="text-xs text-gray-400 mt-0.5">Coupon Management</p>
          </div>
          <nav className="sidebar-nav flex-1 overflow-y-auto py-4">
            {desktopNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/dashboard/coupons' && pathname.startsWith('/dashboard/coupons/') && pathname !== '/dashboard/coupons/create');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link flex items-center px-6 py-3 transition-colors ${isActive ? 'bg-[#5D4037] text-[#D4AF37] border-r-4 border-[#D4AF37] font-semibold' : 'text-gray-300 hover:bg-[#4E342E]'}`}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {item.icon}
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-[#5D4037]">
            <div className="text-xs text-gray-300 mb-3 truncate px-2">{userEmail}</div>
            <button onClick={handleLogout} className="btn btn-secondary w-full flex justify-center items-center text-sm py-2">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area with Bottom Padding for Mobile Nav */}
        <main className="main-content flex-1 md:ml-[260px] pb-24 md:pb-8 min-h-screen bg-gray-50 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (Conforming to Section 6 of Master Prompt) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#3E2723] text-white border-t border-[#5D4037] shadow-2xl flex justify-around items-center h-16 px-1 pb-safe">
        {mobileBottomNav.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard/coupons' && pathname.startsWith('/dashboard/coupons/') && pathname !== '/dashboard/coupons/create');
          
          if (item.isProminent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-gradient-to-r from-[#e2ca6c] to-[#d4af37] text-black ring-4 ring-[#3E2723]' : 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black ring-2 ring-[#3E2723]'}`}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    {item.icon}
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-[#D4AF37] mt-1">{item.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] transition-colors ${
                isActive ? 'text-[#D4AF37] font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                {item.icon}
              </svg>
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
