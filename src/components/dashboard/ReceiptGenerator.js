import React, { useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const ReceiptGenerator = ({ organization, payment, onSuccess, onError, trigger, id }) => {
  const hasGenerated = useRef(false);

  useEffect(() => {
    const handleDownloadEvent = () => {
      if (!hasGenerated.current) {
        generateReceipt();
      }
    };

    // Listen for the custom event
    document.addEventListener('downloadReceipt', handleDownloadEvent);

    return () => {
      document.removeEventListener('downloadReceipt', handleDownloadEvent);
    };
  }, []);

  const generateReceipt = async () => {
    if (hasGenerated.current) return;
    
    hasGenerated.current = true;
    
    try {
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
      
      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helvB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

      // Helper function to format amount
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

      // Call success callback
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Error generating receipt:', err);
      if (onError) onError('Failed to generate receipt: ' + err.message);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default ReceiptGenerator;