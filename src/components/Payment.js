import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    membershipType: 'Corporate Membership',
    registrationFee: 10000,
    subscriptionFee: 15000,
    total: 25000
  });

  useEffect(() => {
    checkUser();
    
    // Get organization from location state or fetch it
    if (location.state?.organization) {
      setOrganization(location.state.organization);
    } else {
      fetchOrganization();
    }
  }, [location.state]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    }
  };

  const fetchOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setOrganization(orgData);
    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load organization data');
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'File size must be less than 5MB');
        e.target.value = null;
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('error', 'Please upload JPG, PNG, or PDF files only');
        e.target.value = null;
        return;
      }

      setReceiptFile(file);
      setFileName(file.name);
    }
  };

  const uploadReceipt = async () => {
    try {
      if (!user) throw new Error('Please login first');
      if (!organization) throw new Error('Organization data not found');
      if (!receiptFile) throw new Error('Please select a receipt file');

      // Create a clean filename
      const timestamp = Date.now();
      const cleanFileName = receiptFile.name
        .replace(/[^a-zA-Z0-9.]/g, '_')
        .replace(/\s+/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      
      // Upload path: user_id/receipts/filename
      const filePath = `${user.id}/receipts/${fileName}`;
      
      console.log('Uploading receipt to:', filePath);
      
      // Upload to documents bucket
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, receiptFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Save payment record to database
      const { error: dbError } = await supabase
        .from('payments')
        .insert([
          {
            organization_id: organization.id,
            user_id: user.id,
            amount: paymentDetails.total,
            payment_method: 'Bank Transfer',
            receipt_path: filePath,
            status: 'pending',
            created_at: new Date()
          }
        ]);

      if (dbError) throw dbError;

      showAlert('success', 'Payment receipt uploaded successfully! Awaiting verification.');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error uploading receipt:', error);
      showAlert('error', error.message || 'Failed to upload receipt');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await uploadReceipt();
    setLoading(false);
  };

  return (
    <>
      {alert && (
        <div className={`mui-alert mui-alert-${alert.type}`}>
          <span className="material-icons mui-alert-icon">
            {alert.type === 'success' ? 'check_circle' : alert.type === 'info' ? 'info' : 'error'}
          </span>
          <span>{alert.message}</span>
        </div>
      )}


      <main className="payment-container">
        {/* Payment Summary Section */}
        <section className="payment-summary">
          <h2 className="section-title">Membership Summary</h2>
          
          <div className="summary-item">
            <span className="summary-label">Membership Type:</span>
            <span className="summary-value">{paymentDetails.membershipType}</span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Company Name:</span>
            <span className="summary-value">{organization?.company_name || 'Loading...'}</span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">CAC Number:</span>
            <span className="summary-value">{organization?.cac_number || 'Loading...'}</span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Registration Fee:</span>
            <span className="summary-value">₦{paymentDetails.registrationFee.toLocaleString()}.00</span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Subscription Fee:</span>
            <span className="summary-value">₦{paymentDetails.subscriptionFee.toLocaleString()}.00</span>
          </div>
          
          <div className="summary-item total-amount">
            <span className="summary-label">Total Amount Due:</span>
            <span className="summary-value">₦{paymentDetails.total.toLocaleString()}.00</span>
          </div>
          
          <div className="payment-instructions">
            <h3>Payment Instructions</h3>
            <p>Complete your membership registration by making payment through bank transfer.</p>
            <p>Your membership will be activated within 24-48 hours after payment verification.</p>
            <p><strong>Note:</strong> For renewal payments, the amount is ₦15,000.00</p>
          </div>
        </section>

        {/* Payment Form Section */}
        <section className="payment-form">
          <h2 className="section-title">Bank Transfer Payment</h2>
          
          <div className="bank-details">
            <h3>KACCIMA Bank Details</h3>
            <div className="bank-info">
              <strong>Bank Name:</strong> Jaiz Bank
            </div>
            <div className="bank-info">
              <strong>Account Name:</strong> KANO CHAMBER OF COMMERCE, INDUSTRY, MINES AND AGRICULTURE
            </div>
            <div className="bank-info">
              <strong>Account Number:</strong> 0000374891
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="paymentReceipt" className="form-label">
                Upload Payment Receipt <span className="required">*</span>
              </label>
              <p className="file-hint">
                After making the transfer, upload your payment receipt here.
                <br />
                <small>Accepted formats: JPG, PNG, PDF (Max size: 5MB)</small>
              </p>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="paymentReceipt"
                  className="form-control"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  required
                />
                {fileName && (
                  <span className="file-name">Selected: {fileName}</span>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !receiptFile}
              >
                {loading ? 'Uploading...' : 'Submit Payment Proof'}
              </button>
            </div>
          </form>

          <div className="payment-note">
            <p>
              <small>
                By submitting this payment proof, you confirm that you have made the transfer 
                to the provided bank account. Your membership will be activated after verification.
              </small>
            </p>
          </div>
        </section>
      </main>


    </>
  );
};

export default Payment;