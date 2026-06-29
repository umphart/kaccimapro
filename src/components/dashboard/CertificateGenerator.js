// src/components/dashboard/CertificateGenerator.js
import React, { useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

const CertificateGenerator = ({ organization, payment, onSuccess, onError, trigger, id }) => {
  const isGenerating = useRef(false);

  useEffect(() => {
    const handlePrintEvent = () => {
      if (isGenerating.current) {
        console.log('⏳ [Certificate] Already generating, skipping...');
        return;
      }
      
      isGenerating.current = true;
      generateAndPrintCertificate();
    };

    document.addEventListener('printCertificate', handlePrintEvent);

    return () => {
      document.removeEventListener('printCertificate', handlePrintEvent);
    };
  }, [organization, payment]);

  useEffect(() => {
    if (trigger) {
      console.log('🔄 [Certificate] Trigger prop received, generating...');
      const handlePrintEvent = () => {
        if (isGenerating.current) {
          console.log('⏳ [Certificate] Already generating, skipping...');
          return;
        }
        isGenerating.current = true;
        generateAndPrintCertificate();
      };
      handlePrintEvent();
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

  const generateAndPrintCertificate = async () => {
    console.log('🔄 [Certificate] Starting certificate generation for printing...');
    
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
      
      console.log('📱 [Certificate] Generating QR code for verification...');
      const qrDataUrl = await generateQRCode(verificationUrl);
      
      if (qrDataUrl) {
        try {
          const qrImage = await pdfDoc.embedPng(qrDataUrl);
          const qrSize = 70;
          const qrX = PW - 100;
          const qrY = 100;
          
          // QR Code background
          page.drawRectangle({
            x: qrX - 5,
            y: qrY - 5,
            width: qrSize + 10,
            height: qrSize + 10,
            color: rgb(1, 1, 1),
            borderWidth: 0
          });
          
          // QR Code image
          page.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrSize,
            height: qrSize,
          });
          
          // QR Label
          const qrLabel = 'Scan to Verify';
          const qrLabelWidth = helvB.widthOfTextAtSize(qrLabel, 8);
          page.drawText(qrLabel, {
            x: qrX + (qrSize - qrLabelWidth) / 2,
            y: qrY - 15,
            size: 8,
            font: helvB,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          // Verification instructions
          const verifyInstruction1 = 'Scan QR code or visit:';
          const verifyInstruction2 = verificationUrl;
          
          const instructionY = qrY - 40;
          page.drawText(verifyInstruction1, {
            x: qrX - 20,
            y: instructionY,
            size: 6,
            font: helv,
            color: rgb(0.4, 0.4, 0.4),
          });
          
          page.drawText(verifyInstruction2, {
            x: qrX - 20,
            y: instructionY - 12,
            size: 5,
            font: helvI,
            color: rgb(0.2, 0.4, 0.6),
          });
        } catch (qrError) {
          console.error('QR Code embedding error:', qrError);
        }
      }

      // Verification text at bottom
      const verifyText = 'This certificate can be verified online at ' + 
        `${window.location.origin}/verify-certificate`;
      const verifyTextWidth = helvI.widthOfTextAtSize(verifyText, 7);
      const verifyX = (PW - verifyTextWidth) / 2;
      page.drawText(verifyText, {
        x: verifyX,
        y: 45,
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

      // Open PDF in a new window with print dialog
      console.log('🖨️ [Certificate] Opening print dialog...');
      
      // Create a new window with the PDF
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
      }

      // Write the HTML with embedded PDF
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>KACCIMA Membership Certificate</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f5f5f5;
                font-family: Arial, sans-serif;
              }
              .print-container {
                width: 100%;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
              }
              object {
                width: 100%;
                height: 100%;
                border: none;
              }
              .controls {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 15px;
                z-index: 1000;
                background: white;
                padding: 15px 25px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              }
              .controls button {
                padding: 12px 28px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                transition: all 0.3s ease;
              }
              .btn-print {
                background: #15e420;
                color: white;
              }
              .btn-print:hover {
                background: #0fb815;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(21, 228, 32, 0.4);
              }
              .btn-close {
                background: #ff4444;
                color: white;
              }
              .btn-close:hover {
                background: #cc0000;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
              }
              .loading {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                z-index: 999;
              }
              .loading-spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #15e420;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @media print {
                body { background: white; }
                .controls { display: none !important; }
                .loading { display: none !important; }
                object { height: 100vh !important; width: 100% !important; }
              }
              @media (max-width: 768px) {
                .controls {
                  flex-direction: column;
                  width: 90%;
                  bottom: 20px;
                  padding: 12px 20px;
                }
                .controls button {
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="loading" id="loadingIndicator">
              <div class="loading-spinner"></div>
              <p>Loading certificate...</p>
            </div>

            <div class="print-container">
              <object 
                data="${url}" 
                type="application/pdf" 
                width="100%" 
                height="100%"
                id="pdfViewer"
              >
                <div style="text-align: center; padding: 50px;">
                  <h3>Unable to display PDF</h3>
                  <p>Your browser may not support PDF viewing.</p>
                  <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #15e420; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Print Certificate
                  </button>
                </div>
              </object>
            </div>

            <div class="controls no-print">
              <button class="btn-print" onclick="handlePrint()">
                🖨️ Print Certificate
              </button>
              <button class="btn-close" onclick="handleClose()">
                ✕ Close
              </button>
            </div>

            <script>
              let printAttempted = false;
              
              function handlePrint() {
                if (!printAttempted) {
                  printAttempted = true;
                  window.print();
                }
              }

              function handleClose() {
                window.close();
              }

              // Hide loading indicator when PDF loads
              document.getElementById('pdfViewer').addEventListener('load', function() {
                document.getElementById('loadingIndicator').style.display = 'none';
                // Auto-print after a short delay
                setTimeout(function() {
                  if (!printAttempted) {
                    handlePrint();
                  }
                }, 1500);
              });

              // Fallback: hide loading after 5 seconds
              setTimeout(function() {
                document.getElementById('loadingIndicator').style.display = 'none';
                if (!printAttempted) {
                  handlePrint();
                }
              }, 5000);

              // After printing, keep window open
              window.addEventListener('afterprint', function() {
                console.log('Print dialog closed');
              });
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();

      // Cleanup after print window is closed
      const checkWindowClosed = setInterval(() => {
        if (printWindow.closed) {
          clearInterval(checkWindowClosed);
          URL.revokeObjectURL(url);
          isGenerating.current = false;
          console.log('✅ [Certificate] Print window closed, cleanup complete');
          if (onSuccess) onSuccess();
        }
      }, 1000);

      // Cleanup after 10 minutes if still open
      setTimeout(() => {
        clearInterval(checkWindowClosed);
        if (!printWindow.closed) {
          URL.revokeObjectURL(url);
          isGenerating.current = false;
        }
      }, 600000);

      console.log('✅ [Certificate] Print dialog opened successfully');

    } catch (err) {
      console.error('❌ [Certificate] Generation error:', err);
      isGenerating.current = false;
      
      let errorMessage = 'Failed to generate certificate for printing';
      if (err.message) {
        if (err.message.includes('pop-up')) {
          errorMessage = 'Please allow pop-ups for this website to print the certificate.';
        } else {
          errorMessage = err.message;
        }
      }
      
      if (onError) onError(errorMessage);
    }
  };

  return null;
};

export default CertificateGenerator;