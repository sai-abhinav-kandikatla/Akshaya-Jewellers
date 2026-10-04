'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCampaign } from '@/app/actions/campaigns';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || undefined;
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date.');
      setIsSubmitting(false);
      return;
    }

    try {
      await createCampaign({
        name,
        description,
        start_date: startDate,
        end_date: endDate,
      });
      router.push('/dashboard/campaigns');
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New Campaign</h1>
      </div>

      <div className="card bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="card-body p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="form-input w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              placeholder="e.g. Diwali Dhamaka 2024"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="form-input w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              placeholder="Brief description of the campaign..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="start_date" className="form-label block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                className="form-input w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_date" className="form-label block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                required
                className="form-input w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#3E2723] hover:bg-[#2D1C19] focus:outline-none disabled:opacity-70 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
