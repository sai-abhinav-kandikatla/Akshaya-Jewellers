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
    <div className="campaign-create-page">
      <div className="page-heading">
        <h1>Create Campaign</h1>
      </div>

      <div className="campaign-create-form">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="campaign-create-error">
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="form-input"
              placeholder="e.g. Diwali Dhamaka 2024"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="form-input"
              placeholder="Brief description of the campaign..."
            ></textarea>
          </div>

          <div className="campaign-date-fields">
            <div className="form-group">
              <label htmlFor="start_date" className="form-label">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_date" className="form-label">
                End Date *
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="campaign-create-actions">
            <button
              type="button"
              onClick={() => router.back()}
              className="action-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="action-primary"
            >
              {isSubmitting ? (
                <>
                  Creating…
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
