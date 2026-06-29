// src/components/admin/reports/reportService.js
import { supabase } from '../../../supabaseClient';

export const fetchPayments = async (dateRange) => {
  try {
    console.log('=== FETCHING PAYMENTS ===');
    console.log('Date range:', dateRange);
    
    const startDate = dateRange.start ? new Date(dateRange.start).toISOString().split('T')[0] : null;
    const endDate = dateRange.end ? new Date(dateRange.end).toISOString().split('T')[0] : null;
    
    let allPayments = [];
    let organizationIds = new Set();
    
    // 1. Fetch from payments table (without join first)
    let query1 = supabase
      .from('payments')
      .select('*');

    if (startDate && endDate) {
      query1 = query1
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);
    }

    const { data: paymentsData, error: paymentsError } = await query1.order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching from payments table:', paymentsError);
    } else if (paymentsData) {
      console.log(`Found ${paymentsData.length} payments from payments table`);
      // Collect organization IDs
      paymentsData.forEach(p => {
        if (p.organization_id) organizationIds.add(p.organization_id);
      });
      // Add source identifier
      const processedPayments = paymentsData.map(p => ({
        ...p,
        source_table: 'payments',
        organization_id: p.organization_id
      }));
      allPayments = [...allPayments, ...processedPayments];
    }

    // 2. Fetch from admin_organization_payments table (without join first)
    let query2 = supabase
      .from('admin_organization_payments')
      .select('*');

    if (startDate && endDate) {
      query2 = query2
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);
    }

    const { data: adminPaymentsData, error: adminPaymentsError } = await query2.order('created_at', { ascending: false });

    if (adminPaymentsError) {
      console.error('Error fetching from admin_organization_payments table:', adminPaymentsError);
    } else if (adminPaymentsData) {
      console.log(`Found ${adminPaymentsData.length} payments from admin_organization_payments table`);
      // Collect organization IDs
      adminPaymentsData.forEach(p => {
        if (p.organization_id) organizationIds.add(p.organization_id);
      });
      // Add source identifier
      const processedAdminPayments = adminPaymentsData.map(p => ({
        ...p,
        source_table: 'admin_organization_payments',
        organization_id: p.organization_id
      }));
      allPayments = [...allPayments, ...processedAdminPayments];
    }

    // 3. Fetch all organizations in one query
    let organizationsMap = new Map();
    if (organizationIds.size > 0) {
      const orgIds = Array.from(organizationIds);
      console.log(`Fetching ${orgIds.length} organizations...`);
      
      // Fetch organizations in batches to avoid URL length limits
      const batchSize = 50;
      for (let i = 0; i < orgIds.length; i += batchSize) {
        const batch = orgIds.slice(i, i + batchSize);
        const { data: orgData, error: orgError } = await supabase
          .from('organizations_registry')
          .select('id, company_name, registration_number, email, phone_number1')
          .in('id', batch);
        
        if (orgError) {
          console.error('Error fetching organizations batch:', orgError);
        } else if (orgData) {
          orgData.forEach(org => {
            organizationsMap.set(org.id, org);
          });
        }
      }
      console.log(`Fetched ${organizationsMap.size} organizations`);
    }

    // 4. Enrich payments with organization data
    const enrichedPayments = allPayments.map(payment => {
      const org = organizationsMap.get(payment.organization_id);
      return {
        ...payment,
        organizations: org || null,
        organization_name: org?.company_name || 'N/A',
        organization_reg_number: org?.registration_number || 'N/A'
      };
    });

    // Sort all payments by created_at (most recent first)
    enrichedPayments.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // Log payment details
    console.log('=== TOTAL PAYMENTS ===');
    console.log('Total payments across both tables:', enrichedPayments.length);
    enrichedPayments.forEach((payment, index) => {
      console.log(`Payment #${index + 1}:`, {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        type: payment.payment_type || 'registration',
        date: payment.created_at,
        organization: payment.organization_name,
        reference: payment.payment_reference || 'N/A',
        source: payment.source_table
      });
    });

    return enrichedPayments;
    
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const fetchOrganizations = async (dateRange) => {
  try {
    console.log('=== FETCHING ORGANIZATIONS ===');
    console.log('Date range:', dateRange);
    
    const startDate = dateRange.start ? new Date(dateRange.start).toISOString().split('T')[0] : null;
    const endDate = dateRange.end ? new Date(dateRange.end).toISOString().split('T')[0] : null;
    
    let query = supabase
      .from('organizations_registry')
      .select('*');

    if (startDate && endDate) {
      query = query
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
    
    // Process and format organizations data
    const processedData = data?.map(org => ({
      ...org,
      // Format business_nature if it's an object
      business_nature_text: typeof org.business_nature === 'object' && org.business_nature !== null
        ? Object.values(org.business_nature).join(', ')
        : org.business_nature || 'N/A',
      // Format full address
      office_address: [
        org.house_number,
        org.street,
        org.lga,
        org.state
      ].filter(Boolean).join(', ') || 'N/A',
      // Add contact person fallback
      contact_person: org.contact_person || org.representative || 'N/A'
    })) || [];

    // Log organization details
    console.log('=== ORGANIZATIONS DATA ===');
    console.log('Total organizations:', processedData?.length || 0);
    processedData?.forEach((org, index) => {
      console.log(`Organization #${index + 1}:`, {
        id: org.id,
        company_name: org.company_name,
        registration_number: org.registration_number,
        email: org.email,
        phone: org.phone_number1,
        cac_number: org.cac_number,
        office_address: org.office_address,
        contact_person: org.contact_person,
        business_nature: org.business_nature_text,
        status: org.status,
        created_at: org.created_at
      });
    });

    return processedData || [];
    
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

export const fetchStats = async () => {
  try {
    console.log('=== FETCHING STATISTICS ===');
    
    let stats = {
      payments: {
        total: 0,
        amount: 0,
        pending: 0
      },
      organizations: {
        total: 0,
        approved: 0,
        pending: 0
      }
    };
    
    // 1. Payment stats from payments table
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status');
      
      if (paymentsError) {
        console.error('Error fetching payments stats:', paymentsError);
      } else if (paymentsData) {
        stats.payments.total += paymentsData.length;
        stats.payments.amount += paymentsData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        stats.payments.pending += paymentsData.filter(p => p.status === 'pending').length;
        console.log(`Payments table: ${paymentsData.length} records`);
      }
    } catch (error) {
      console.error('Error in payments stats:', error);
    }
    
    // 2. Payment stats from admin_organization_payments table
    try {
      const { data: adminPaymentsData, error: adminPaymentsError } = await supabase
        .from('admin_organization_payments')
        .select('amount, status');
      
      if (adminPaymentsError) {
        console.error('Error fetching admin payments stats:', adminPaymentsError);
      } else if (adminPaymentsData) {
        stats.payments.total += adminPaymentsData.length;
        stats.payments.amount += adminPaymentsData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        stats.payments.pending += adminPaymentsData.filter(p => p.status === 'pending').length;
        console.log(`Admin payments table: ${adminPaymentsData.length} records`);
      }
    } catch (error) {
      console.error('Error in admin payments stats:', error);
    }

    // 3. Organization stats
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations_registry')
        .select('status');
      
      if (orgError) {
        console.error('Error fetching organization stats:', orgError);
      } else if (orgData) {
        stats.organizations.total = orgData.length;
        stats.organizations.approved = orgData.filter(o => 
          o.status === 'approved' || o.status === 'active'
        ).length;
        stats.organizations.pending = orgData.filter(o => 
          o.status === 'pending' || o.status === 'pending_review'
        ).length;
        console.log(`Organizations table: ${orgData.length} records`);
      }
    } catch (error) {
      console.error('Error in organization stats:', error);
    }

    // Log statistics
    console.log('=== STATISTICS SUMMARY ===');
    console.log('Payment Stats:', {
      total: stats.payments.total,
      totalAmount: `₦${stats.payments.amount.toLocaleString()}`,
      pending: stats.payments.pending
    });
    console.log('Organization Stats:', {
      total: stats.organizations.total,
      approved: stats.organizations.approved,
      pending: stats.organizations.pending
    });

    return stats;
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

// Helper function to get organization name from payment
export const getOrganizationName = (payment) => {
  if (payment.organizations) {
    return payment.organizations.company_name || 'N/A';
  }
  if (payment.organization_name) {
    return payment.organization_name;
  }
  return 'N/A';
};

// Helper function to get organization registration number from payment
export const getOrganizationRegNumber = (payment) => {
  if (payment.organizations) {
    return payment.organizations.registration_number || 'N/A';
  }
  if (payment.organization_reg_number) {
    return payment.organization_reg_number;
  }
  return 'N/A';
};

// Helper function to get payment source
export const getPaymentSource = (payment) => {
  return payment.source_table || 'payments';
};