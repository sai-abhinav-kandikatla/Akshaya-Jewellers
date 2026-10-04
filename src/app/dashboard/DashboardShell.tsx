'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogoutAction } from '@/app/actions/auth';

const homeIcon = <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />;
const createIcon = <path d="M12 4v16m8-8H4" />;
const allIcon = <path d="M4 6h16M4 12h16M4 18h16" />;
const verifyIcon = <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;

const desktopNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: homeIcon },
  { name: 'Create Coupon', href: '/dashboard/coupons/create', icon: createIcon },
  { name: 'All Coupons', href: '/dashboard/coupons', icon: allIcon },
  { name: 'Verify Coupon', href: '/dashboard/verify', icon: verifyIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4a8 8 0 01-.2 1.8l1.4 1.1-1.5 2.6-1.7-.7a8 8 0 01-3.1 1.8l-.2 1.8h-3l-.2-1.8a8 8 0 01-3.1-1.8l-1.7.7-1.5-2.6 1.4-1.1A8 8 0 016.4 12l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 013.1-1.8l.2-1.8h3l.2 1.8a8 8 0 013.1 1.8l1.7-.7 1.5 2.6-1.4 1.1A8 8 0 0120 12z" /> },
];

const mobilePrimaryActions = [
  { name: 'Home', label: 'Dashboard', href: '/dashboard', theme: 'home', icon: homeIcon },
  { name: 'Create', label: 'Create Coupon', href: '/dashboard/coupons/create', theme: 'create', icon: createIcon },
  { name: 'All', label: 'All Coupons', href: '/dashboard/coupons', theme: 'all', icon: allIcon },
  { name: 'Verify', label: 'Verify Coupon', href: '/dashboard/verify', theme: 'verify', icon: verifyIcon },
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
    <div className="dashboard-layout min-h-screen bg-gray-50 flex flex-col">
      <header className="dashboard-mobile-header md:hidden">
        <div className="mobile-header-row">
          <Link href="/dashboard" className="mobile-brand" aria-label="Akshaya Jewellers dashboard">
            <img src="/logo.png" alt="" />
            <span className="mobile-brand-name">Akshaya Jewellers</span>
          </Link>
          <div className="mobile-header-actions">
            <Link href="/dashboard/settings" className="mobile-settings-link" aria-label="Settings" title="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1-2 2-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5v.2h-2.8V20a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1-2-2 .1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H6v-2.8h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1 2-2 .1.1a1.7 1.7 0 001.8.3 1.7 1.7 0 001-1.5V5h2.8v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1 2 2-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1h.2V14h-.2a1.7 1.7 0 00-1.5 1z" />
              </svg>
            </Link>
            <button onClick={handleLogout} className="mobile-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
        <nav className="mobile-primary-nav" aria-label="Primary navigation">
          {mobilePrimaryActions.map((item) => {
            const isActive = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`mobile-primary-action mobile-primary-action--${item.theme}${isActive ? ' is-active' : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  {item.icon}
                </svg>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex flex-1">
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

        <main className="main-content flex-1 md:ml-[260px] min-h-screen bg-gray-50 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
