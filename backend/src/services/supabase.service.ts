import { config } from '../shared/config.js';

export class SupabaseStorageService {
  async createSignedUploadUrl(path: string) {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase storage is not configured');
    return { path, provider: 'supabase', uploadUrl: `${config.SUPABASE_URL}/storage/v1/object/upload/sign/${path}` };
  }
}
