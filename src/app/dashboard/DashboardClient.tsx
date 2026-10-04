'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatters';
import { computeDisplayStatus, getStatusColor, getStatusLabel } from '@/lib/utils/statusCompute';

export default function DashboardClient({ initialStats, recentCoupons, campaigns }: any) {
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  // In a real app, we'd fetch new stats based on the selected campaign
  const stats = initialStats;

  return (
    <div className="space-y-8">
      <div className="filter-bar flex justify-end">
        <select 
          className="form-input max-w-xs bg-white border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
        >
          <option value="all">All Campaigns</option>
          {campaigns?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Coupons" value={stats?.total || 0} icon={<path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />} color="border-[#3E2723]" textColor="text-[#3E2723]" />
        <StatCard title="Active" value={stats?.active || 0} icon={<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />} color="border-green-500" textColor="text-green-600" />
        <StatCard title="Not Active" value={stats?.not_active || 0} icon={<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} color="border-amber-500" textColor="text-amber-600" />
        <StatCard title="Claimed" value={stats?.claimed || 0} icon={<path d="M5 13l4 4L19 7" />} color="border-blue-500" textColor="text-blue-600" />
        <StatCard title="Expired" value={stats?.expired || 0} icon={<path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />} color="border-red-500" textColor="text-red-600" />
        <StatCard title="Cancelled" value={stats?.cancelled || 0} icon={<path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />} color="border-gray-500" textColor="text-gray-600" />
        <StatCard title="Total Value" value={formatCurrency(stats?.totalValue || 0)} icon={<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} color="border-[#D4AF37]" textColor="text-[#D4AF37]" />
        <StatCard title="Claimed Value" value={formatCurrency(stats?.claimedValue || 0)} icon={<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} color="border-blue-500" textColor="text-blue-600" />
      </div>

      <div className="card mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="card-header px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Recent Coupons</h2>
          <Link href="/dashboard/coupons" className="text-sm font-medium text-[#D4AF37] hover:text-[#b8952b]">
            View All →
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentCoupons?.length > 0 ? recentCoupons.map((coupon: any) => {
                  const status = computeDisplayStatus(coupon);
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        <Link href={`/dashboard/coupons/${coupon.code}`} className="text-[#3E2723] hover:underline">
                          {coupon.code}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">{coupon.customer_name || '-'}</td>
                      <td className="py-4 px-6 text-sm text-gray-900 font-medium">{formatCurrency(coupon.value)}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`badge badge-${status.replace('_', '-')} px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500 text-sm">No recent coupons found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor }: any) {
  return (
    <div className={`stat-card bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="stat-value text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? new Intl.NumberFormat('en-IN').format(value) : value}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 bg-current ${textColor}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {icon}
          </svg>
        </div>
      </div>
    </div>
  );
}
