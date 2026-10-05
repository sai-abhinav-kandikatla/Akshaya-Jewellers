'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogoutAction } from '@/app/actions/auth';

const homeIcon = <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />;
const createIcon = <path d="M12 4v16m8-8H4" />;
const allIcon = <path d="M4 6h16M4 12h16M4 18h16" />;
const verifyIcon = <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
const settingsIcon = <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4a8 8 0 01-.2 1.8l1.4 1.1-1.5 2.6-1.7-.7a8 8 0 01-3.1 1.8l-.2 1.8h-3l-.2-1.8a8 8 0 01-3.1-1.8l-1.7.7-1.5-2.6 1.4-1.1A8 8 0 016.4 12l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 013.1-1.8l.2-1.8h3l.2 1.8a8 8 0 013.1 1.8l1.7-.7 1.5 2.6-1.4 1.1A8 8 0 0120 12z" />;

const desktopNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: homeIcon },
  { name: 'Create Coupon', href: '/dashboard/coupons/create', icon: createIcon },
  { name: 'All Coupons', href: '/dashboard/coupons', icon: allIcon },
  { name: 'Verify Coupon', href: '/dashboard/verify', icon: verifyIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4a8 8 0 01-.2 1.8l1.4 1.1-1.5 2.6-1.7-.7a8 8 0 01-3.1 1.8l-.2 1.8h-3l-.2-1.8a8 8 0 01-3.1-1.8l-1.7.7-1.5-2.6 1.4-1.1A8 8 0 016.4 12l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 013.1-1.8l.2-1.8h3l.2 1.8a8 8 0 013.1 1.8l1.7-.7 1.5 2.6-1.4 1.1A8 8 0 0120 12z" /> },
];

const mobilePrimaryActions = [
  { name: 'Home', label: 'Home', href: '/dashboard', theme: 'home', icon: homeIcon },
  { name: 'Coupons', label: 'Coupons', href: '/dashboard/coupons', theme: 'coupons', icon: allIcon },
  { name: 'Create', label: 'Create', href: '/dashboard/coupons/create', theme: 'create', icon: createIcon },
  { name: 'Verify', label: 'Verify', href: '/dashboard/verify', theme: 'verify', icon: verifyIcon },
  { name: 'Settings', label: 'Settings', href: '/dashboard/settings', theme: 'settings', icon: settingsIcon },
];

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

  const isRouteActive = (href: string) => pathname === href
    || (href === '/dashboard/coupons'
      && pathname.startsWith('/dashboard/coupons/')
      && pathname !== '/dashboard/coupons/create');

  return (
    <div className="dashboard-layout min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Mobile Top Header (Fixed at Top) */}
      <header className="dashboard-mobile-header md:hidden bg-[#24140E] border-b border-[#4E342E]/80 shadow-md">
        <div className="mobile-header-row flex items-center justify-between px-4 py-2.5">
          <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Akshaya Jewellers dashboard">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full border border-[#D4AF37] object-cover shadow-sm" />
            <div>
              <h1 className="font-serif font-bold text-[#ECC870] text-lg leading-tight">Akshaya Jewellers</h1>
              <p className="text-[11px] text-[#C5AA82] leading-tight mt-0.5">Digital Gift Coupon System</p>
            </div>
          </Link>
          <div className="mobile-header-actions">
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3E2723]/90 border border-[#8D6E63]/70 text-white text-xs font-semibold shadow-xs hover:bg-[#4E342E] transition-all" 
              aria-label="Log out" 
              title="Click to Log out"
            >
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                👤
              </div>
              <span>Admin</span>
              <svg className="w-3 h-3 text-gray-300 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="sidebar hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-[#3E2723] text-white z-40">
          <div className="p-6 flex flex-col items-center border-b border-[#5D4037]">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full object-cover mb-2 border border-[#D4AF37] shadow-md" />
            <h1 className="text-xl font-serif font-bold text-[#D4AF37] text-center">Akshaya Jewellers</h1>
            <p className="text-xs text-gray-400 mt-0.5">Coupon Management</p>
          </div>
          <nav className="sidebar-nav flex-1 overflow-y-auto py-4" aria-label="Dashboard navigation">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isRouteActive(item.href) ? 'page' : undefined}
                className={`sidebar-link flex items-center px-6 py-3 transition-colors ${isRouteActive(item.href) ? 'bg-[#5D4037] text-[#D4AF37] border-r-4 border-[#D4AF37] font-semibold' : 'text-gray-300 hover:bg-[#4E342E]'}`}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  {item.icon}
                </svg>
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-[#5D4037]">
            <div className="text-xs text-gray-300 mb-3 truncate px-2">{userEmail}</div>
            <button onClick={handleLogout} className="btn btn-secondary w-full flex justify-center items-center text-sm py-2">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content flex-1 md:ml-[260px] min-h-screen bg-[#FAF7F2] overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (Mockup Match) */}
      <nav className="mobile-primary-nav md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFDF9]/98 backdrop-blur-md border-t border-[#F0E6D2] z-50 px-2 py-1 shadow-lg" aria-label="Primary navigation">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobilePrimaryActions.map((item) => {
            const isActive = isRouteActive(item.href);
            if (item.name === 'Create') {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center -mt-5 group"
                >
                  <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#E2BA49] to-[#B8860B] text-white flex items-center justify-center shadow-lg border-3 border-white group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 mt-0.5">Create</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-[#FCEECB] text-[#7A5805] font-bold' 
                    : 'text-gray-500 hover:text-gray-900 font-medium'
                }`}
              >
                <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                  {item.icon}
                </svg>
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
