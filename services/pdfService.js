import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { InstitutionConstants } from '../config/institutionConfig.js';

export const generateCertificatePdf = async (issuedCert, studentProfile, certificateRequest) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Set margin: 0 to prevent PDFKit from automatically inserting page breaks
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const token = issuedCert?.verificationToken || 'VALID';
      const verificationUrl = `${frontendUrl}/verify/${token}`;

      const pageWidth = doc.page.width; // 595.28 pt
      const pageHeight = doc.page.height; // 841.89 pt

      // 1. Draw Outer & Inner Double Navy Border
      const outerMargin = 22;
      doc.lineWidth(2.5)
        .rect(outerMargin, outerMargin, pageWidth - 2 * outerMargin, pageHeight - 2 * outerMargin)
        .stroke('#1e3a8a');

      const innerMargin = 27;
      doc.lineWidth(0.8)
        .rect(innerMargin, innerMargin, pageWidth - 2 * innerMargin, pageHeight - 2 * innerMargin)
        .stroke('#1e3a8a');

      // 2. Letterhead Header (Absolute Positioning)
      let curY = 55;
      doc.font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#1e3a8a')
        .text(InstitutionConstants.COLLEGE_NAME.toUpperCase(), 40, curY, { width: pageWidth - 80, align: 'center' });

      curY += 26;
      doc.font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor('#475569')
        .text(InstitutionConstants.COLLEGE_ADDRESS, 40, curY, { width: pageWidth - 80, align: 'center' });

      curY += 22;
      // Decorative Line Separator
      doc.lineWidth(1.5)
        .moveTo(45, curY)
        .lineTo(pageWidth - 45, curY)
        .stroke('#1e3a8a');

      // 3. Meta (Ref No & Date)
      curY += 18;
      const certNo = issuedCert?.certificateNumber || 'GPM/CERT/OFFICIAL';
      const issueDate = certificateRequest?.approvedDate
        ? new Date(certificateRequest.approvedDate)
        : (issuedCert?.issueDate ? new Date(issuedCert.issueDate) : new Date());

      const options = { day: '2-digit', month: 'long', year: 'numeric' };
      const formattedDate = issueDate.toLocaleDateString('en-GB', options);

      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0f172a')
        .text(`Ref No: ${certNo}`, 45, curY, { width: 250, align: 'left' });

      doc.text(`Date: ${formattedDate}`, pageWidth - 295, curY, { width: 250, align: 'right' });

      // 4. Certificate Title
      curY += 45;
      doc.font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#b91c1c')
        .text('BONAFIDE CERTIFICATE', 40, curY, { width: pageWidth - 80, align: 'center' });

      // Title Underline
      const titleWidth = 220;
      const titleX = (pageWidth - titleWidth) / 2;
      doc.lineWidth(1.5)
        .moveTo(titleX, curY + 24)
        .lineTo(titleX + titleWidth, curY + 24)
        .stroke('#b91c1c');

      // 5. Body Text
      curY += 55;
      const studentName = (studentProfile?.fullName || certificateRequest?.user?.username || 'STUDENT').toUpperCase();
      const enrollmentNo = studentProfile?.enrollmentNo || 'N/A';
      const yearOfStudy = studentProfile?.yearOfStudy || 'Diploma Study';
      const dept = studentProfile?.department || 'Engineering';
      const academicYear = studentProfile?.academicYear || '2025-2026';
      const purposeText = (certificateRequest?.purpose || 'OFFICIAL PURPOSE').toUpperCase();

      doc.font('Helvetica')
        .fontSize(11.5)
        .fillColor('#0f172a')
        .lineGap(9);

      const para1 = `This is to certify that Mr. / Ms. ${studentName}, bearing Enrollment No. ${enrollmentNo}, is a genuine and bonafide student of this institution studying in ${yearOfStudy} (${dept}) during the Academic Year ${academicYear}.`;
      doc.text(para1, 55, curY, { width: pageWidth - 110, align: 'justify' });

      curY = doc.y + 16;
      const para2 = `This certificate is issued upon the student's request for the purpose of: ${purposeText}. To the best of our knowledge, his/her character and conduct during the stay in the college have been GOOD.`;
      doc.text(para2, 55, curY, { width: pageWidth - 110, align: 'justify' });

      // 6. Footer Section (Fixed Y near bottom: Y = 640)
      const footerY = 640;

      // Generate QR Code Buffer
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 90, margin: 1 });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

      // Column 1: QR Code
      doc.image(qrBuffer, 55, footerY, { fit: [85, 85] });
      doc.font('Helvetica-Oblique')
        .fontSize(8)
        .fillColor('#64748b')
        .text('Scan to Verify Authenticity', 45, footerY + 90, { width: 105, align: 'center' });

      // Column 2: Official Seal Box
      doc.font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#475569')
        .text('[ OFFICIAL EMBLEM SEAL ]\n\nGovernment Polytechnic, Miraj', 175, footerY + 25, { width: 150, align: 'center' });

      // Column 3: Indian Govt Standard Digital Signature Box
      const sigX = pageWidth - 240;
      const sigWidth = 185;
      const sigHeight = 100;

      // Background Tint & Green Border
      doc.rect(sigX, footerY, sigWidth, sigHeight)
        .fillAndStroke('#ecfdf5', '#059669');

      // Signature Header Badge
      doc.font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#059669')
        .text('Signature Valid', sigX + 8, footerY + 6);

      // IST Date Formatting
      const istDateStr = issueDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      doc.font('Helvetica')
        .fontSize(7.5)
        .fillColor('#1e293b')
        .lineGap(2);

      const sigBodyText = `Digitally Signed by: Principal / Head of Institution\nIssuer: Government Polytechnic Miraj CA\nDate: ${istDateStr}\nReason: Official Bonafide Document Approval\nLocation: Miraj, District Sangli, Maharashtra`;

      doc.text(sigBodyText, sigX + 8, footerY + 20, { width: sigWidth - 16 });

      // 7. Verification Footer Disclaimer (Fixed Y = 785)
      const disclaimerY = 785;
      doc.font('Helvetica-Oblique')
        .fontSize(7.5)
        .fillColor('#64748b')
        .text(`Note: This is an officially system-generated document digitally signed under Indian e-Sign / PKI Governance framework. Authenticity can be verified online at ${verificationUrl}`, 40, disclaimerY, { width: pageWidth - 80, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
