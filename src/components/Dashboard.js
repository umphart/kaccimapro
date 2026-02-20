import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Box, CircularProgress } from '@mui/material';
import Layout from './Layout';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [alert, setAlert] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('none');

  useEffect(() => {
    checkUser();
  }, []);

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

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

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
        setEditFormData(orgData);
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

  const handleEditToggle = () => {
    if (editing) {
      handleSaveProfile();
    } else {
      setEditing(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          company_name: editFormData.company_name,
          office_address: editFormData.office_address,
          business_nature: editFormData.business_nature,
          bankers: editFormData.bankers,
          email: editFormData.email,
          contact_person: editFormData.contact_person,
          phone_number: editFormData.phone_number
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setOrganization(editFormData);
      setEditing(false);
      showAlert('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('error', 'Failed to update profile');
    }
  };

  const generateCertificate = async () => {
    try {
      const btn = document.getElementById('downloadCertificate');
      btn.textContent = 'Generating...';
      btn.disabled = true;

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const PW = page.getWidth(), PH = page.getHeight();

      const tryEmbed = async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) return null;
          const bytes = await response.arrayBuffer();
          try {
            return await pdfDoc.embedPng(bytes);
          } catch {
            try {
              return await pdfDoc.embedJpg(bytes);
            } catch {
              return null;
            }
          }
        } catch {
          return null;
        }
      };

      const logoImg = await tryEmbed('/static/logo.png');
      const presSigImg = await tryEmbed('/static/pressign.png');
      const dirSigImg = await tryEmbed('/static/dgsign.png');

      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helvB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvI = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      // Draw borders
      page.drawRectangle({
        x: 20, y: 20, width: PW - 40, height: PH - 40,
        borderColor: rgb(0.2, 0.4, 0.6), borderWidth: 4
      });
      page.drawRectangle({
        x: 24, y: 24, width: PW - 48, height: PH - 48,
        borderColor: rgb(0, 0.6, 0), borderWidth: 2
      });

      // Watermark
      if (logoImg) {
        const wmW = 100, wmH = 100;
        const marginX = (PW - wmW * 3) / 4;
        const marginY = (PH - wmH * 3) / 4;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const x = marginX + col * (wmW + marginX);
            const y = PH - marginY - wmH - row * (wmH + marginY);
            page.drawImage(logoImg, {
              x, y, width: wmW, height: wmH, opacity: 0.1
            });
          }
        }
      }

      const drawCenter = (txt, y, size, font = helv, color = rgb(0,0,0)) => {
        const w = font.widthOfTextAtSize(txt, size);
        page.drawText(txt, { x: PW/2 - w/2, y, size, font, color });
      };

      // Certificate number
      const serialNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const year = new Date().getFullYear();
      const certText = `Certificate No: KACCIMA/${year}/${serialNumber}`;
      const textWidth = helv.widthOfTextAtSize(certText, 9);
      const certY = PH - 50;
      page.drawText(certText, {
        x: (PW - textWidth) / 2,
        y: certY,
        size: 9,
        font: helv,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Logo
      if (logoImg) {
        const logoSize = 60;
        const padding = 10;
        const logoX = (PW - logoSize) / 2;
        const logoY = certY - padding - logoSize;
        page.drawImage(logoImg, {
          x: logoX,
          y: logoY,
          width: logoSize,
          height: logoSize,
        });
      }

      // Title
      drawCenter('KANO CHAMBER OF COMMERCE, INDUSTRY,', PH - 140, 20, helvB, rgb(0, 0, 0));
      drawCenter('MINES & AGRICULTURE (KACCIMA)', PH - 170, 20, helvB, rgb(0, 0, 0));
      drawCenter('Motto: co-operation, Honesty and Business Development', PH - 210, 10, helvI, rgb(0.2, 0.4, 0.6));
      drawCenter('MEMBERSHIP CERTIFICATE', PH - 240, 18, helvB, rgb(0, 0.6, 0));

      const underlineY = PH - 245;
      const halfW = 350 / 2;
      page.drawLine({
        start: { x: PW/2 - halfW, y: underlineY },
        end: { x: PW/2 + halfW, y: underlineY },
        thickness: 1,
        color: rgb(0, 0.6, 0),
      });

      let y = PH - 300;
      drawCenter('This is to certify that', y, 12);
      y -= 80;

      drawCenter(organization?.company_name || 'Company Name', y, 20, helvB, rgb(0, 0.6, 0));
      y -= 60;

      [
        `Business Address: ${organization?.office_address || ''}`,
        `Nature of Business: ${organization?.business_nature || ''}`,
        `CAC Number: ${organization?.cac_number || ''}`
      ].forEach(line => {
        drawCenter(line, y, 10);
        y -= 35;
      });

      y -= 20;
      drawCenter('is a duly registered member of KACCIMA in good standing.', y, 12);
      y -= 60;
      drawCenter(`Registration Date: ${payment?.day}-${payment?.month}-${payment?.year}`, y, 10);
      y -= 35;
      drawCenter(`Membership Status: Active`, y, 10);

      // Signatures
      const sigLineY = 100;
      const sigW = 120;
      const sigH = 50;

      const leftX = PW/2 - sigW - 50;
      if (presSigImg) {
        page.drawLine({ start: { x: leftX, y: sigLineY }, end: { x: leftX + sigW, y: sigLineY }, thickness: 1 });
        page.drawImage(presSigImg, { x: leftX, y: sigLineY, width: sigW, height: sigH });
        page.drawText('President, KACCIMA', { x: leftX, y: sigLineY - 10, size: 9, font: helv });
      }

      const rightX = PW/2 + 50;
      if (dirSigImg) {
        page.drawLine({ start: { x: rightX, y: sigLineY }, end: { x: rightX + sigW, y: sigLineY }, thickness: 1 });
        page.drawImage(dirSigImg, { x: rightX, y: sigLineY, width: sigW, height: sigH });
        page.drawText('Director General, KACCIMA', { x: rightX, y: sigLineY - 10, size: 9, font: helv });
      }

      const today = new Date();
      const dt = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
      const dateText = `Dated this ${dt}`;
      const dateWidth = helvI.widthOfTextAtSize(dateText, 9);
      page.drawText(dateText, { x: (PW - dateWidth) / 2, y: 40, size: 9, font: helvI, color: rgb(0.2, 0.2, 0.2) });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KACCIMA_Certificate_${organization?.company_name?.replace(/ /g,'_') || 'Certificate'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to generate certificate');
    } finally {
      const btn = document.getElementById('downloadCertificate');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Download Certificate';
      }
    }
  };

const generateReceipt = async () => {
  try {
    const btn = document.getElementById('downloadReceipt');
    btn.textContent = 'Generating...';
    btn.disabled = true;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 280]);
    const PW = page.getWidth(), PH = page.getHeight();

    const tryEmbed = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const bytes = await response.arrayBuffer();
        try { return await pdfDoc.embedPng(bytes); }
        catch { try { return await pdfDoc.embedJpg(bytes); } catch { return null; } }
      } catch { return null; }
    };

    const logoImg = await tryEmbed('/static/logo.png');
    
    // Use a font that supports Unicode characters
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // For the Naira symbol, we'll use a workaround - write "N" instead of "₦"
    // Or better, we can use a custom font that supports Unicode
    // Since we can't embed custom fonts easily, we'll use "N" as a substitute

    const drawCenter = (txt, y, size, font = helv, color = rgb(0, 0, 0)) => {
      const w = font.widthOfTextAtSize(txt, size);
      page.drawText(txt, { x: (PW - w) / 2, y, size, font, color });
    };

    const drawLeft = (txt, x, y, size, font = helv, color = rgb(0, 0, 0)) => {
      page.drawText(txt, { x, y, size, font, color });
    };

    const drawRight = (txt, x, y, size, font = helv, color = rgb(0, 0, 0)) => {
      const w = font.widthOfTextAtSize(txt, size);
      page.drawText(txt, { x: x - w, y, size, font, color });
    };

    // Helper function to format amount without Naira symbol
    const formatAmount = (amount) => {
      return `N${parseFloat(amount).toLocaleString()}.00`;
    };

    // Watermark
    if (logoImg) {
      const wmWidth = 300;
      const wmHeight = (logoImg.height / logoImg.width) * wmWidth;
      page.drawImage(logoImg, {
        x: (PW - wmWidth) / 2,
        y: (PH - wmHeight) / 2,
        width: wmWidth,
        height: wmHeight,
        opacity: 0.2,
      });
    }

    // Top logo
    let logoHeight = 0;
    if (logoImg) {
      const topWidth = 80;
      logoHeight = (logoImg.height / logoImg.width) * topWidth;
      page.drawImage(logoImg, {
        x: (PW - topWidth) / 2,
        y: PH - logoHeight - 10,
        width: topWidth,
        height: logoHeight,
      });
    }

    drawCenter('PAYMENT RECEIPT', PH - logoHeight - 25, 14, helvB);

    const today = new Date();
    const dateStr = today.toLocaleDateString();
    const receiptNumber = `REC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    drawLeft(`Date: ${dateStr}`, 50, PH - logoHeight - 42, 9);
    drawRight(`Receipt No: ${receiptNumber}`, PW - 50, PH - logoHeight - 42, 9);

    page.drawLine({
      start: { x: 50, y: PH - logoHeight - 52 },
      end: { x: PW - 50, y: PH - logoHeight - 52 },
      thickness: 1
    });

    let y = PH - logoHeight - 65;

    drawLeft('Received from:', 50, y, 9, helvB);
    drawLeft(organization?.company_name || 'Company Name', 150, y, 9); y -= 16;

    drawLeft('The sum of:', 50, y, 9, helvB);
    // Use the formatted amount without the ₦ symbol
    drawLeft(formatAmount(payment?.amount || '25000'), 150, y, 9); y -= 16;

    drawLeft('Payment method:', 50, y, 9, helvB);
    drawLeft(payment?.method || 'Bank Transfer', 150, y, 9); y -= 16;

    drawLeft('For:', 50, y, 9, helvB);
    drawLeft('Membership Fee', 150, y, 9); y -= 18;

    page.drawLine({ start: { x: 50, y }, end: { x: PW - 50, y }, thickness: 1 });
    y -= 12;

    drawLeft('Amount in words:', 50, y, 9, helvB);
    drawLeft('twenty five thousand naira only', 150, y, 9);

    const sigY = 25;
    drawLeft('Received by:', 50, sigY, 9);
    page.drawLine({ start: { x: 50, y: sigY - 5 }, end: { x: 200, y: sigY - 5 }, thickness: 1 });
    drawLeft('(Signature)', 50, sigY - 15, 8);

    drawRight('Date:', PW - 200, sigY, 9);
    page.drawLine({ start: { x: PW - 200, y: sigY - 5 }, end: { x: PW - 50, y: sigY - 5 }, thickness: 1 });
    drawRight('(Date)', PW - 50, sigY - 15, 8);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KACCIMA_Receipt_${receiptNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Error generating receipt:', err);
    showAlert('error', 'Failed to generate receipt: ' + err.message);
  } finally {
    const btn = document.getElementById('downloadReceipt');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Download Receipt';
    }
  }
};
  const handleProceedToPayment = () => {
    navigate('/payment', { state: { organization } });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  const renderContent = () => {
    if (registrationStatus === 'none') {
      return (
        <section className="dashboard-content">
          <div className="welcome-card">
            <h2>Welcome to KACCIMA!</h2>
            <p>You haven't completed your organization registration yet.</p>
            <button 
              onClick={() => navigate('/organization-registration')} 
              className="btn next-step"
              style={{ fontSize: '1.2rem', padding: '15px 30px' }}
            >
              Complete Organization Registration
            </button>
          </div>
        </section>
      );
    }

    if (registrationStatus === 'pending') {
      return (
        <section className="dashboard-content">
          <div className="notification warning">
            <h3>Registration Under Review</h3>
            <p>Your organization registration has been submitted and is pending approval. You will be notified once your registration is approved.</p>
            <p>Status: <strong>Pending Approval</strong></p>
          </div>

          <div className="profile-section">
            <h2 className="section-title">Submitted Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <div className="field-label">Company Name</div>
                <div className="field-value">{organization?.company_name || 'N/A'}</div>
              </div>
              <div className="profile-field">
                <div className="field-label">Email</div>
                <div className="field-value">{organization?.email || 'N/A'}</div>
              </div>
              <div className="profile-field">
                <div className="field-label">Submission Date</div>
                <div className="field-value">
                  {organization?.created_at ? new Date(organization.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (payment?.status === 'pending') {
      return (
        <section className="dashboard-content">
          <div className="notification warning">
            <h3>Payment Under Verification</h3>
            <p>Your payment receipt has been submitted and is pending verification. This usually takes 24-48 hours.</p>
          </div>

          <div className="profile-section">
            <h2 className="section-title">Payment Details</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <div className="field-label">Amount Paid</div>
                <div className="field-value">₦{payment?.amount}</div>
              </div>
              <div className="profile-field">
                <div className="field-label">Payment Method</div>
                <div className="field-value">{payment?.method}</div>
              </div>
              <div className="profile-field">
                <div className="field-label">Payment Date</div>
                <div className="field-value">{payment?.day}-{payment?.month}-{payment?.year}</div>
              </div>
              <div className="profile-field">
                <div className="field-label">Status</div>
                <div className="field-value">
                  <span className="status-badge status-pending">Pending Verification</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (payment?.status === 'rejected') {
      return (
        <section className="dashboard-content">
          <div className="notification error">
            <h3>Payment Verification Failed</h3>
            <p>Your payment could not be verified. Please submit a new payment receipt.</p>
          </div>

          <button onClick={handleProceedToPayment} className="btn next-step">
            Resubmit Payment
          </button>
        </section>
      );
    }

    if (payment?.status === 'accepted' || payment?.status === 'approved') {
      return (
        <section className="dashboard-content">
          <div className="notification success">
            <p>Your membership is active! Status: <strong>Active Member</strong></p>
          </div>
          
          <div className="profile-card">
            <h3 className="section-title">Membership Subscription</h3>
            <div className="profile-grid">
              <div className="profile-field">
                <div className="field-label">Registration Date</div>
                <div className="field-value">{payment?.day}-{payment?.month}-{payment?.year}</div>
              </div>

              <div className="profile-field">
                <div className="field-label">Expected Renewal Date</div>
                <div className="field-value">
                  January 1, {(payment?.year || new Date().getFullYear()) + 1}
                  {countdown && <span className="countdown"> ({countdown} remaining)</span>}
                </div>
              </div>
            </div>

            <div className="button-group">
              <button 
                onClick={generateCertificate} 
                className="btn outline" 
                id="downloadCertificate"
              >
                Download Certificate
              </button>

              <button 
                onClick={generateReceipt} 
                className="btn outline" 
                id="downloadReceipt"
              >
                Download Receipt
              </button>
            </div>
          </div>

          <div className="profile-section">
            <h2 className="section-title">Profile Information</h2>
            <div className="profile-grid">
              {!editing ? (
                <>
                  <div className="profile-field">
                    <div className="field-label">Company Name</div>
                    <div className="field-value">{organization?.company_name || 'N/A'}</div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Office Address</div>
                    <div className="field-value">{organization?.office_address || 'N/A'}</div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Business Nature</div>
                    <div className="field-value">{organization?.business_nature || 'N/A'}</div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Bankers</div>
                    <div className="field-value">{organization?.bankers || 'N/A'}</div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Email</div>
                    <div className="field-value">{organization?.email || 'N/A'}</div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">CAC Number</div>
                    <div className="field-value">{organization?.cac_number || 'N/A'}</div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Phone</div>
                    <div className="field-value">{organization?.phone_number || 'N/A'}</div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Membership Status</div>
                    <div className="field-value">
                      <span className="status-badge status-accepted">Active Member</span>
                    </div>
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Edit</div>
                    <button className="btn edit-btn" onClick={handleEditToggle}>
                      Edit Profile
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-field">
                    <div className="field-label">Company Name</div>
                    <input
                      type="text"
                      name="company_name"
                      className="value-input"
                      value={editFormData.company_name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Office Address</div>
                    <input
                      type="text"
                      name="office_address"
                      className="value-input"
                      value={editFormData.office_address || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Business Nature</div>
                    <input
                      type="text"
                      name="business_nature"
                      className="value-input"
                      value={editFormData.business_nature || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Bankers</div>
                    <input
                      type="text"
                      name="bankers"
                      className="value-input"
                      value={editFormData.bankers || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Email</div>
                    <input
                      type="email"
                      name="email"
                      className="value-input"
                      value={editFormData.email || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Contact Person</div>
                    <input
                      type="text"
                      name="contact_person"
                      className="value-input"
                      value={editFormData.contact_person || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Phone Number</div>
                    <input
                      type="tel"
                      name="phone_number"
                      className="value-input"
                      value={editFormData.phone_number || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="profile-field">
                    <div className="field-label">Actions</div>
                    <div className="button-group">
                      <button className="btn" onClick={handleEditToggle}>
                        Save Changes
                      </button>
                      <button className="btn outline" onClick={() => setEditing(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="dashboard-content">
        <p>Loading your information...</p>
      </section>
    );
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
      
      <Layout>
        {renderContent()}

        {(payment?.status === 'accepted' || payment?.status === 'approved') && (
          <>
            <div className="profile-info">
              <h3 className="section-title">Membership Information</h3>
              <p>As a member of KACCIMA, you are entitled to various benefits including access to business resources, networking opportunities, and support for your business growth.</p>
            </div>

            <div className="profile-info">
              <h3 className="section-title">Contact Information</h3>
              <p>Contact us: info@kaccima.ng | +2347063174462</p>
            </div>
          </>
        )}
      </Layout>
    </>
  );
};

export default Dashboard;