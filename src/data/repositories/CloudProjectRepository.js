import { isSupabaseConfigured, supabase } from '../../shared/lib/supabaseClient.js';

function toDbProject(project, ownerId) {
  return {
    id: project.id,
    owner_id: ownerId,
    title: project.title || project.draftForm?.projectTitle || 'SHIL SOLAR Project',
    client_name: project.clientName || project.draftForm?.clientName || '',
    city: project.city || project.draftForm?.city || '',
    system_type: project.systemType || project.draftForm?.systemType || '',
    status: project.status || 'draft',
    project_data: project,
    updated_at: new Date().toISOString(),
  };
}

function fromDbProject(row) {
  return {
    ...(row.project_data || {}),
    id: row.id,
    title: row.title || row.project_data?.title,
    clientName: row.client_name || row.project_data?.clientName,
    city: row.city || row.project_data?.city,
    systemType: row.system_type || row.project_data?.systemType,
    status: row.status || row.project_data?.status,
    updatedAt: row.updated_at || row.project_data?.updatedAt,
    createdAt: row.created_at || row.project_data?.createdAt,
    cloudSynced: true,
  };
}

export const CloudProjectRepository = {
  isEnabled() {
    return isSupabaseConfigured;
  },

  async list() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('app_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromDbProject);
  },

  async upsert(project, ownerId) {
    if (!isSupabaseConfigured || !ownerId) return null;
    const payload = toDbProject(project, ownerId);
    const { data, error } = await supabase
      .from('app_projects')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return fromDbProject(data);
  },

  async remove(projectId) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('app_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },
};
