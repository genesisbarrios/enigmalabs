const fs = require('fs');
const PDFDocument = require('pdfkit');

const cursiveFontPath = require.resolve('@fontsource/dancing-script/files/dancing-script-latin-700-normal.woff');
const cursiveFontBuffer = fs.readFileSync(cursiveFontPath);

function formatFee(planType, amount) {
  const formatted = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (planType === 'monthly') return `$${formatted} per month (recurring monthly subscription)`;
  if (planType === 'one_time') {
    if (Number(amount) === 1000) return `$${formatted} (one-time payment — 5-page website)`;
    if (Number(amount) === 2000) return `$${formatted} (one-time payment — 10-page website)`;
    return `$${formatted} (one-time payment)`;
  }
  return `$${formatted} (negotiated fee)`;
}

function buildAgreementPdf({ planType, amount, clientName, clientAddress, jurisdiction, effectiveDate, signaturePngBuffer }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 54 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('Cursive', cursiveFontBuffer);

    const dateStr = new Date(effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.font('Helvetica-Bold').fontSize(16).text('WEB DEVELOPMENT SERVICES AGREEMENT', { align: 'center' });
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(10);
    doc.text(`This Web Development Services Agreement ("Agreement") is entered into as of ${dateStr} (the "Effective Date") by and between:`);
    doc.moveDown(0.5);
    doc.text('Developer: Gen Barrios ("Developer"), and');
    doc.text(`Client: ${clientName}, located at ${clientAddress} ("Client").`);
    doc.moveDown(0.5);
    doc.text('Developer and Client may each be referred to individually as a "Party" and collectively as the "Parties."');
    doc.moveDown(1);

    function section(title, body) {
      doc.font('Helvetica-Bold').fontSize(11).text(title);
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(10).text(body);
      doc.moveDown(0.75);
    }

    section(
      '1. Scope of Work',
      'Developer agrees to provide the following services (the "Services") and deliverables (the "Deliverables") to Client:\n\n' +
      'Design and development of a website / web application as scoped and agreed upon between Developer and Client.\n' +
      'Google Business Setup\n\n' +
      'Any work not explicitly described above is considered out of scope and will be handled under Section 4 (Change Requests).'
    );

    section(
      '2. Timeline',
      'Timelines assume timely feedback and content from Client. Delays in Client-provided content, feedback, or approvals (beyond 3 business days per round) will shift the timeline accordingly and are not the responsibility of Developer.'
    );

    section(
      '3. Payment Terms',
      `Total Project Fee: ${formatFee(planType, amount)}\n\n` +
      'The Total Project Fee does not include third-party costs such as hosting, domain registration, premium plugins/themes, stock photography, or paid API/service subscriptions. These are billed separately or paid directly by Client.'
    );

    section(
      '4. Change Requests',
      'Work outside the original Scope of Work (Section 1) is considered a change request. Developer will provide a written estimate of additional cost and time impact before proceeding. Client approval (email is sufficient) is required before out-of-scope work begins.\n\n' +
      'Included revision rounds: Additional revisions are billed at $45/hr.'
    );

    section(
      '5. Ownership & Intellectual Property',
      'Upon receipt of full and final payment, Developer assigns to Client all rights, title, and interest in the final Deliverables (custom code and design created specifically for this project), excluding any pre-existing tools, frameworks, libraries, or reusable code ("Developer Tools") owned by Developer or licensed from third parties. Developer grants Client a perpetual, royalty-free license to use any Developer Tools included in the Deliverables as part of the finished project.\n\n' +
      'Until full payment is received, all work product remains the property of Developer. Developer retains the right to display the completed project in its portfolio and marketing materials unless Client requests otherwise in writing.\n\n' +
      'Client represents that any content, images, logos, or materials it provides for use in the project are either owned by Client or properly licensed, and Client agrees to indemnify Developer against any claims arising from Client-provided materials.'
    );

    section(
      '6. Maintenance & Support',
      "This Agreement covers the initial build only. Following launch, Developer will provide a 30-day bug-fix period at no additional charge for defects in the original Deliverables (not new features, content changes, or third-party issues). Ongoing maintenance, updates, hosting management, or support beyond this period is available under a separate maintenance agreement or at Developer's then-current monthly rate of $15."
    );

    section(
      '7. Confidentiality',
      'Each Party agrees to keep confidential any non-public business, technical, or financial information disclosed by the other Party during the engagement, and to use such information only for purposes of completing this Agreement. This obligation survives termination of this Agreement for a period of 2 years.'
    );

    section(
      '8. Termination',
      "Either Party may terminate this Agreement with 14 days' written notice. If Client terminates, Client will pay Developer for all work completed up to the termination date, calculated on a pro-rata or hourly basis. If Developer terminates without cause, any deposit for incomplete work will be refunded on a pro-rata basis. Sections 5 (Ownership), 7 (Confidentiality), and 9 (Liability) survive termination."
    );

    section(
      '9. Limitation of Liability',
      "Developer's total liability under this Agreement is limited to the total fees paid by Client under this Agreement. Developer is not liable for indirect, incidental, or consequential damages, including lost profits or data loss, except to the extent caused by Developer's gross negligence or willful misconduct. Developer is not responsible for outages, security breaches, or failures of third-party services (hosting providers, plugins, payment processors, etc.) beyond Developer's reasonable control."
    );

    section(
      '10. Independent Contractor',
      'Developer is an independent contractor, not an employee, partner, or agent of Client. Developer is responsible for its own taxes, insurance, and benefits.'
    );

    section(
      '11. Governing Law',
      `This Agreement is governed by the laws of the ${jurisdiction}, without regard to conflict-of-law principles.`
    );

    section(
      '12. Entire Agreement',
      'This Agreement constitutes the entire understanding between the Parties regarding the Services and supersedes any prior discussions or agreements. Any amendments must be made in writing and signed by both Parties.'
    );

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(11).text('Signatures');
    doc.font('Helvetica').fontSize(10).text('By signing below, both Parties agree to the terms of this Agreement.');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(10).text('Developer');
    doc.font('Cursive').fontSize(24).text('Gen Barrios');
    doc.font('Helvetica').fontSize(10).text('Name: Gen Barrios');
    doc.text(`Date: ${dateStr}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(10).text('Client');
    if (signaturePngBuffer) {
      const signatureY = doc.y;
      doc.image(signaturePngBuffer, { width: 180, height: 60 });
      doc.y = signatureY + 65;
    }
    doc.font('Helvetica').fontSize(10).text(`Name: ${clientName}`);
    doc.text(`Date: ${dateStr}`);

    doc.end();
  });
}

module.exports = { buildAgreementPdf };
