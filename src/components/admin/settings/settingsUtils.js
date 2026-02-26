import { supabase } from '../../../supabaseClient';

// ============ FETCH FUNCTIONS ============
export const fetchAdmins = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};

export const fetchOrganizations = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

// FIXED: Corrected function name from loadSettingslectures to loadSettings
export const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('adminSettings');
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
};

// ============ ADMIN FUNCTIONS ============
export const handleCreateAdmin = async (formData, showAlert) => {
  if (formData.password !== formData.confirmPassword) {
    showAlert('error', 'Passwords do not match');
    return null;
  }

  if (formData.password.length < 6) {
    showAlert('error', 'Password must be at least 6 characters');
    return null;
  }

  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          is_admin: true
        }
      }
    });

    if (authError) throw authError;

    // Add to admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        user_id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        admin_type: formData.adminType,
        permissions: formData.adminType === 'approver' 
          ? { can_approve: true, can_review: true }
          : { can_review: true, can_approve: false }
      }])
      .select()
      .single();

    if (error) throw error;

    showAlert('success', 'Admin created successfully');
    return data;
  } catch (error) {
    console.error('Error creating admin:', error);
    showAlert('error', error.message);
    return null;
  }
};

export const handleUpdateAdmin = async (adminId, formData, showAlert) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        full_name: formData.fullName,
        admin_type: formData.adminType,
        permissions: formData.adminType === 'approver' 
          ? { can_approve: true, can_review: true }
          : { can_review: true, can_approve: false }
      })
      .eq('id', adminId)
      .select()
      .single();

    if (error) throw error;

    showAlert('success', 'Admin updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating admin:', error);
    showAlert('error', error.message);
    return null;
  }
};

export const handleDeleteAdmin = async (adminId, showAlert) => {
  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (error) throw error;

    showAlert('success', 'Admin deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting admin:', error);
    showAlert('error', error.message);
    return false;
  }
};

// ============ ORGANIZATION FUNCTIONS ============
export const handleCreateOrganization = async (formData, showAlert) => {
  try {
    let userId = null;
    
    // Create auth user if password is provided
    if (formData.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.contact_person,
            company_name: formData.company_name
          }
        }
      });

      if (authError) throw authError;
      userId = authData.user.id;
    }

    // Create organization record
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        company_name: formData.company_name,
        email: formData.email,
        phone_number: formData.phone_number,
        office_address: formData.office_address,
        business_nature: formData.business_nature,
        cac_number: formData.cac_number,
        contact_person: formData.contact_person,
        representative: formData.representative,
        nigerian_directors: parseInt(formData.nigerian_directors) || 0,
        non_nigerian_directors: parseInt(formData.non_nigerian_directors) || 0,
        nigerian_employees: parseInt(formData.nigerian_employees) || 0,
        non_nigerian_employees: parseInt(formData.non_nigerian_employees) || 0,
        bankers: formData.bankers,
        referee1_name: formData.referee1_name,
        referee1_business: formData.referee1_business,
        referee1_phone: formData.referee1_phone,
        referee1_reg_number: formData.referee1_reg_number,
        referee2_name: formData.referee2_name,
        referee2_business: formData.referee2_business,
        referee2_phone: formData.referee2_phone,
        referee2_reg_number: formData.referee2_reg_number,
        id_type: formData.id_type,
        status: formData.status,
        user_id: userId,
        re_upload_count: 0,
        document_rejection_reasons: {}
      }])
      .select()
      .single();

    if (error) throw error;

    showAlert('success', 'Organization created successfully');
    return data;
  } catch (error) {
    console.error('Error creating organization:', error);
    showAlert('error', error.message);
    return null;
  }
};

export const handleUpdateOrganization = async (orgId, formData, showAlert) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        company_name: formData.company_name,
        email: formData.email,
        phone_number: formData.phone_number,
        office_address: formData.office_address,
        business_nature: formData.business_nature,
        cac_number: formData.cac_number,
        contact_person: formData.contact_person,
        representative: formData.representative,
        nigerian_directors: parseInt(formData.nigerian_directors) || 0,
        non_nigerian_directors: parseInt(formData.non_nigerian_directors) || 0,
        nigerian_employees: parseInt(formData.nigerian_employees) || 0,
        non_nigerian_employees: parseInt(formData.non_nigerian_employees) || 0,
        bankers: formData.bankers,
        referee1_name: formData.referee1_name,
        referee1_business: formData.referee1_business,
        referee1_phone: formData.referee1_phone,
        referee1_reg_number: formData.referee1_reg_number,
        referee2_name: formData.referee2_name,
        referee2_business: formData.referee2_business,
        referee2_phone: formData.referee2_phone,
        referee2_reg_number: formData.referee2_reg_number,
        id_type: formData.id_type,
        status: formData.status
      })
      .eq('id', orgId)
      .select()
      .single();

    if (error) throw error;

    showAlert('success', 'Organization updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating organization:', error);
    showAlert('error', error.message);
    return null;
  }
};

export const handleDeleteOrganization = async (orgId, showAlert) => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (error) throw error;

    showAlert('success', 'Organization deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting organization:', error);
    showAlert('error', error.message);
    return false;
  }
};