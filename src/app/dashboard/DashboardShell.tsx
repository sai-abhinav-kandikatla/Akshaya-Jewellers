'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const icons = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  coupons: <><path d="M5 6h14M5 12h14M5 18h14" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  verify: <><path d="m5 12 4 4L19 6" /><path d="M20 12a8 8 0 1 1-4-6.9" /></>,
  settings: <><circle cx="12" cy="8" r="3" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
};

function NavIcon({ name }: { name: keyof typeof icons }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const navigation = [
    { label: 'Home', href: '/dashboard', icon: 'home' as const },
    { label: 'Coupons', href: '/dashboard/coupons', icon: 'coupons' as const },
    { label: 'Create', href: '/dashboard/coupons/create', icon: null },
    { label: 'Verify', href: '/dashboard/verify', icon: 'verify' as const },
    { label: 'Settings', href: '/dashboard/settings', icon: 'settings' as const },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    if (href === '/dashboard/coupons') return pathname.startsWith(href) && pathname !== '/dashboard/coupons/create';
    return pathname === href;
  };

  return (
    <div className="dashboard-layout">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/dashboard" className="app-brand" aria-label="Akshaya Jewellers home">
            <img src="/logo.png" alt="" />
            <span className="app-brand-copy">
              <span className="app-brand-name">Akshaya Jewellers</span>
              <span className="app-brand-subtitle">Digital Gift Coupon</span>
            </span>
          </Link>
          <Link href="/dashboard/settings" className="app-profile" aria-label={`Settings for ${userEmail}`} title={userEmail}>
            <NavIcon name="settings" />
          </Link>
        </div>
      </header>

      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>

      <nav className="app-bottom-nav" aria-label="Main navigation">
        <div className="app-bottom-nav-inner">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`app-nav-item${isActive(item.href) ? ' is-active' : ''}${item.label === 'Create' ? ' app-nav-create' : ''}`}
              aria-label={item.label}
            >
              {item.icon ? <NavIcon name={item.icon} /> : <span className="app-nav-create-icon" aria-hidden="true">+</span>}
              <span className="app-nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
