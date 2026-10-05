'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Campaign, CreateCampaignInput } from '@/lib/types';
import { writeAuditEvent } from '@/lib/audit/events';
import { isAdminAuthenticated } from '@/lib/auth/requireAdmin';

export async function createCampaign(input: CreateCampaignInput): Promise<ApiResponse<Campaign>> {
  try {
    if (!(await isAdminAuthenticated())) return { success: false, error: 'Unauthorized.' };
    const supabase = createAdminClient();
    
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    if (!name || !input.start_date || !input.end_date) {
      return { success: false, error: 'Name, start date, and end date are required.' };
    }
    if (name.length > 120 || input.start_date > input.end_date) {
      return { success: false, error: 'Enter a campaign name under 120 characters and a valid date range.' };
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        description: input.description?.trim() || null,
        start_date: input.start_date,
        end_date: input.end_date,
        status: input.is_active === false ? 'INACTIVE' : 'ACTIVE',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('createCampaign error:', error);
      return { success: false, error: 'Failed to create campaign.' };
    }

    await writeAuditEvent('CAMPAIGN_CREATED', undefined, data.id, { name: data.name });

    return { success: true, data };
  } catch (error) {
    console.error('createCampaign exception:', error);
    return { success: false, error: 'An unexpected error occurred while creating the campaign.' };
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  if (!(await isAdminAuthenticated())) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('getCampaigns error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getCampaigns exception:', error);
    return [];
  }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  if (!(await isAdminAuthenticated())) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('getCampaignById exception:', error);
    return null;
  }
}

export async function updateCampaign(id: string, updates: Partial<CreateCampaignInput>): Promise<ApiResponse> {
  try {
    if (!(await isAdminAuthenticated())) return { success: false, error: 'Unauthorized.' };
    const supabase = createAdminClient();
    const safeUpdates: Record<string, unknown> = {};
    if (typeof updates.name === 'string') safeUpdates.name = updates.name.trim().slice(0, 120);
    if (typeof updates.description === 'string') safeUpdates.description = updates.description.trim() || null;
    if (typeof updates.start_date === 'string') safeUpdates.start_date = updates.start_date;
    if (typeof updates.end_date === 'string') safeUpdates.end_date = updates.end_date;
    if (typeof updates.is_active === 'boolean') safeUpdates.status = updates.is_active ? 'ACTIVE' : 'INACTIVE';
    if (Object.keys(safeUpdates).length === 0) return { success: false, error: 'No valid campaign changes were provided.' };

    const { data, error } = await supabase
      .from('campaigns')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('updateCampaign error:', error);
      return { success: false, error: 'Failed to update campaign.' };
    }

    await writeAuditEvent('CAMPAIGN_UPDATED', undefined, id, safeUpdates);

    return { success: true, message: 'Campaign updated successfully.' };
  } catch (error) {
    console.error('updateCampaign exception:', error);
    return { success: false, error: 'An unexpected error occurred while updating the campaign.' };
  }
}
