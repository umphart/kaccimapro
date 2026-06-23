import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.warn('⚠️ Service role key is not set. Admin user creation will not work.');
}

// Create a Supabase client with the service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to create a user without triggering email
export const createAutoConfirmedUser = async (email, password, userMetadata) => {
  try {
    if (!supabaseServiceRoleKey) {
      throw new Error('Service role key is not configured');
    }

    // Create user with admin API - this bypasses rate limits
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: userMetadata
    });

    if (error) {
      // If the error is about rate limit, try the alternative approach
      if (error.message?.includes('rate limit')) {
        console.log('Rate limit hit, trying alternative approach...');
        // Create the user and then manually confirm them
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: false, // Don't auto-confirm
          user_metadata: userMetadata
        });
        
        if (userError) throw userError;
        
        // Manually confirm the user
        if (userData?.user?.id) {
          const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            userData.user.id,
            { email_confirm: true }
          );
          
          if (confirmError) {
            console.error('Error confirming user:', confirmError);
            // User is created but not confirmed - still can be used
          }
        }
        
        return { success: true, data: userData };
      }
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating auto-confirmed user:', error);
    return { success: false, error };
  }
}; 