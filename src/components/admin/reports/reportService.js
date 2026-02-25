import { supabase } from '../../../supabaseClient';

export const fetchPayments = async (dateRange) => {
  try {
    let query = supabase
      .from('payments')
      .select('*, organizations(company_name, email, phone_number)');

    if (dateRange.start && dateRange.end) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', `${dateRange.end}T23:59:59`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    // Log payment details
    console.log('=== PAYMENTS DATA ===');
    console.log('Total payments:', data?.length || 0);
    data?.forEach((payment, index) => {
      console.log(`Payment #${index + 1}:`, {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        type: payment.payment_type,
        date: payment.created_at,
        organization: payment.organizations?.company_name || 'N/A',
        reference: payment.reference
      });
    });
    
    return data || [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const fetchOrganizations = async (dateRange) => {
  try {
    let query = supabase
      .from('organizations')
      .select('*');

    if (dateRange.start && dateRange.end) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', `${dateRange.end}T23:59:59`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    // Log organization details
    console.log('=== ORGANIZATIONS DATA ===');
    console.log('Total organizations:', data?.length || 0);
    data?.forEach((org, index) => {
      console.log(`Organization #${index + 1}:`, {
        id: org.id,
        company_name: org.company_name,
        email: org.email,
        phone: org.phone_number,
        cac_number: org.cac_number,
        office_address: org.office_address,
        contact_person: org.contact_person,
        representative: org.representative,
        business_nature: org.business_nature,
        status: org.status
      });
    });
    
    return data || [];
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

export const fetchStats = async () => {
  try {
    // Payment stats
    const { data: paymentData } = await supabase
      .from('payments')
      .select('amount, status');

    const totalPayments = paymentData?.length || 0;
    const totalAmount = paymentData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingPayments = paymentData?.filter(p => p.status === 'pending').length || 0;

    // Organization stats
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: approvedOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const stats = {
      payments: {
        total: totalPayments,
        amount: totalAmount,
        pending: pendingPayments
      },
      organizations: {
        total: totalOrgs || 0,
        approved: approvedOrgs || 0,
        pending: (totalOrgs || 0) - (approvedOrgs || 0)
      }
    };

    // Log statistics
    console.log('=== STATISTICS ===');
    console.log('Payment Stats:', {
      total: totalPayments,
      totalAmount: `₦${totalAmount.toLocaleString()}`,
      pending: pendingPayments
    });
    console.log('Organization Stats:', {
      total: totalOrgs || 0,
      approved: approvedOrgs || 0,
      pending: (totalOrgs || 0) - (approvedOrgs || 0)
    });

    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};