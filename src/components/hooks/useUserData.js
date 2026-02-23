import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export const useUserData = (user) => {
  const [organization, setOrganization] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('none');

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  // Countdown timer effect
  useEffect(() => {
    if (payment?.year) {
      const renewalDate = new Date(`${parseInt(payment.year) + 1}-01-01`);
      const timer = setInterval(() => {
        const now = new Date();
        const diff = renewalDate - now;
        if (diff <= 0) {
          setCountdown('Expired');
          clearInterval(timer);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          setCountdown(`${days} day(s)`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [payment]);

  const fetchOrganizationData = async () => {
    try {
      if (!user) return;

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (orgError && orgError.code !== 'PGRST116') {
        console.error('Error fetching organization:', orgError);
      }
      
      if (orgData) {
        setOrganization(orgData);
        setRegistrationStatus(orgData.status?.toLowerCase() || 'pending');
        
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false });

        if (paymentError) {
          console.error('Error fetching payment:', paymentError);
        }

        if (paymentData && paymentData.length > 0) {
          const latestPayment = paymentData[0];
          setPayment({
            id: latestPayment.id,
            status: latestPayment.status,
            day: new Date(latestPayment.created_at).getDate(),
            month: new Date(latestPayment.created_at).getMonth() + 1,
            year: new Date(latestPayment.created_at).getFullYear(),
            amount: latestPayment.amount,
            method: latestPayment.payment_method,
            receipt_path: latestPayment.receipt_path
          });
        } else {
          setPayment(null);
        }
      } else {
        setRegistrationStatus('none');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchOrganizationData();
  };

  return {
    organization,
    payment,
    loading,
    registrationStatus,
    countdown,
    refreshData
  };
};