// src/components/dashboard/CertificateGenerator.js
import React, { useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

const CertificateGenerator = ({ organization, payment, onSuccess, onError, trigger, id }) => {
  const isGenerating = useRef(false);

  useEffect(() => {
    const handleDownloadEvent = () => {
      // Prevent multiple simultaneous generations
      if (isGenerating.current) {
        console.log('⏳ [Certificate] Already generating, skipping...');
        return;
      }
      
      isGenerating.current = true;
      generateCertificate();
    };

    // Listen for the custom event
    document.addEventListener('downloadCertificate', handleDownloadEvent);

    return () => {
      document.removeEventListener('downloadCertificate', handleDownloadEvent);
    };
  }, [organization, payment]);

  // Also trigger on prop change if needed
  useEffect(() => {
    if (trigger) {
      console.log('🔄 [Certificate] Trigger prop received, generating...');
      const handleDownloadEvent = () => {
        if (isGenerating.current) {
          console.log('⏳ [Certificate] Already generating, skipping...');
          return;
        }
        isGenerating.current = true;
        generateCertificate();
      };
      handleDownloadEvent();
    }
  }, [trigger]);

  const generateQRCode = async (text) => {
    try {
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 100,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      return null;
    }
  };

  const generateCertificate = async () => {
    console.log('🔄 [Certificate] Starting certificate generation...');
    
    try {
      console.log('📄 [Certificate] Creating PDF document...');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 portrait
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

      console.log('🖼️ [Certificate] Loading images...');
      const logoImg = await tryEmbed('/static/logo.png');
      const presSigImg = await tryEmbed('/static/pressign.png');
      const dirSigImg = await tryEmbed('/static/dgsign.png');

      console.log('📝 [Certificate] Embedding fonts...');
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

      // Add Registration Number
      const registrationNumber = organization?.registration_number || 'N/A';
      drawCenter(`Registration Number: ${registrationNumber}`, y, 10, helv, rgb(0, 0, 0));
      y -= 35;

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
      
      const regDate = payment ? `${payment.day}-${payment.month}-${payment.year}` : new Date().toLocaleDateString();
      drawCenter(`Registration Date: ${regDate}`, y, 10);
      y -= 35;
      drawCenter(`Membership Status: Active`, y, 10);

      // QR CODE SECTION - Verification
      const verificationUrl = `${window.location.origin}/verify-certificate?reg=${encodeURIComponent(registrationNumber)}`;
      
      console.log('📱 [Certificate] Generating QR code...');
      const qrDataUrl = await generateQRCode(verificationUrl);
      
      if (qrDataUrl) {
        try {
          const qrImage = await pdfDoc.embedPng(qrDataUrl);
          const qrSize = 60;
          const qrX = PW - 90;
          const qrY = 90;
          
          page.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrSize,
            height: qrSize,
          });
          
          const qrLabel = 'Verify Certificate';
          const qrLabelWidth = helv.widthOfTextAtSize(qrLabel, 7);
          page.drawText(qrLabel, {
            x: qrX + (qrSize - qrLabelWidth) / 2,
            y: qrY - 12,
            size: 7,
            font: helv,
            color: rgb(0.3, 0.3, 0.3),
          });
        } catch (qrError) {
          console.error('QR Code embedding error:', qrError);
        }
      }

      const verifyText = 'Scan QR code to verify this certificate';
      const verifyTextWidth = helvI.widthOfTextAtSize(verifyText, 7);
      const verifyX = PW - 90 + (60 - verifyTextWidth) / 2;
      page.drawText(verifyText, {
        x: verifyX,
        y: 70,
        size: 7,
        font: helvI,
        color: rgb(0.4, 0.4, 0.4),
      });

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

      console.log('💾 [Certificate] Saving PDF...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KACCIMA_Certificate_${organization?.company_name?.replace(/ /g,'_') || 'Certificate'}.pdf`;
      document.body.appendChild(a);
      console.log('📥 [Certificate] Triggering download...');
      a.click();
      document.body.removeChild(a);
      console.log('🗑️ [Certificate] Cleaning up...');
      URL.revokeObjectURL(url);

      isGenerating.current = false;
      console.log('✅ [Certificate] Generation complete, calling onSuccess');
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('❌ [Certificate] Generation error:', err);
      isGenerating.current = false;
      if (onError) onError('Failed to generate certificate');
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default CertificateGenerator;