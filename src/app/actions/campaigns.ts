'use server'

import { createClient } from '@/lib/supabase/server';
import { ApiResponse, Campaign, CreateCampaignInput } from '@/lib/types';
import { logAuditEvent } from './audit';

export async function createCampaign(input: CreateCampaignInput): Promise<ApiResponse<Campaign>> {
  try {
    const supabase = await createClient();
    
    if (!input.name || !input.start_date || !input.end_date) {
      return { success: false, error: 'Name, start date, and end date are required.' };
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: input.name,
        description: input.description,
        start_date: input.start_date,
        end_date: input.end_date,
        is_active: input.is_active !== undefined ? input.is_active : true,
        budget: input.budget || 0
      })
      .select()
      .single();

    if (error || !data) {
      console.error('createCampaign error:', error);
      return { success: false, error: 'Failed to create campaign.' };
    }

    await logAuditEvent('CAMPAIGN_CREATED', undefined, data.id, { name: data.name });

    return { success: true, data };
  } catch (error) {
    console.error('createCampaign exception:', error);
    return { success: false, error: 'An unexpected error occurred while creating the campaign.' };
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const supabase = await createClient();
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
  try {
    const supabase = await createClient();
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('updateCampaign error:', error);
      return { success: false, error: 'Failed to update campaign.' };
    }

    await logAuditEvent('CAMPAIGN_UPDATED', undefined, id, updates);

    return { success: true, message: 'Campaign updated successfully.' };
  } catch (error) {
    console.error('updateCampaign exception:', error);
    return { success: false, error: 'An unexpected error occurred while updating the campaign.' };
  }
}
