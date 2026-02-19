import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const PaymentStep = ({ organizationId, user, showAlert }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [paymentDetails] = useState({
    membershipType: 'Corporate Membership',
    registrationFee: 10000,
    subscriptionFee: 15000,
    total: 25000
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'File size must be less than 5MB');
        e.target.value = null;
        return;
      }

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

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!receiptFile) {
      showAlert('error', 'Please select a payment receipt');
      return;
    }

    setLoading(true);

    try {
      // Upload receipt
      const timestamp = Date.now();
      const cleanFileName = receiptFile.name.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\s+/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      const filePath = `${user.id}/receipts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          organization_id: organizationId,
          user_id: user.id,
          amount: paymentDetails.total,
          payment_method: 'Bank Transfer',
          receipt_path: filePath,
          status: 'pending'
        }]);

      if (paymentError) throw paymentError;

      showAlert('success', 'Registration and payment submitted successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      showAlert('error', error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleLater = () => {
    showAlert('info', 'You can complete payment later from your dashboard');
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="form-step active">
      <h2>Complete Payment</h2>
      <p className="form-instruction">
        Your organization registration has been submitted. Please complete the payment to activate your membership.
      </p>

      <div className="payment-summary" style={{ marginBottom: '30px' }}>
        <h3>Payment Summary</h3>
        <div className="summary-item">
          <span>Registration Fee:</span>
          <span>₦{paymentDetails.registrationFee.toLocaleString()}.00</span>
        </div>
        <div className="summary-item">
          <span>Subscription Fee:</span>
          <span>₦{paymentDetails.subscriptionFee.toLocaleString()}.00</span>
        </div>
        <div className="summary-item total">
          <strong>Total:</strong>
          <strong>₦{paymentDetails.total.toLocaleString()}.00</strong>
        </div>
      </div>

      <div className="bank-details" style={{ marginBottom: '30px' }}>
        <h3>Bank Transfer Details</h3>
        <p><strong>Bank:</strong> Jaiz Bank</p>
        <p><strong>Account Name:</strong> KANO CHAMBER OF COMMERCE, INDUSTRY, MINES AND AGRICULTURE</p>
        <p><strong>Account Number:</strong> 0000374891</p>
      </div>

      <form onSubmit={handlePayment}>
        <div className="form-group">
          <label>Upload Payment Receipt *</label>
          <p className="file-hint">
            After making the transfer, upload your payment receipt here.
            <br />
            <small>Accepted formats: JPG, PNG, PDF (Max: 5MB)</small>
          </p>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            required
          />
          {fileName && <small className="file-name">Selected: {fileName}</small>}
        </div>

        <div className="form-navigation" style={{ flexDirection: 'column', gap: '10px' }}>
          <button 
            type="submit" 
            className="btn submit" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Processing...' : 'Submit Payment'}
          </button>
          <button 
            type="button" 
            className="btn outline" 
            onClick={handleLater}
            style={{ width: '100%' }}
          >
            Pay Later
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentStep;