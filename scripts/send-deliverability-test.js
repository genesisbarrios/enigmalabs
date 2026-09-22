// Sends a real "cold email" — the same template/from-address/sending path
// used for actual lead outreach (see buildColdEmailHtml + sendLeadEmail in
// server.js) — to a test inbox, so you can check whether it lands in the
// inbox or spam. No lead record is touched; this just reproduces the exact
// content and sender a real prospect would receive.
//
// Usage: node scripts/send-deliverability-test.js [recipient@email.com]
// (defaults to genesisbarriosdev@gmail.com if no argument is given)

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Matches server.js exactly — cold/lead emails send from AGREEMENT_FROM_EMAIL,
// not a dedicated "outreach" address, so this test reflects the real sender.
const FROM = process.env.AGREEMENT_FROM_EMAIL || 'agreements@enigma-labs.com';
const SITE_URL = process.env.SITE_URL || 'https://enigma-labs.com';
const CALENDAR_LINK = process.env.CALENDAR_LINK || 'https://calendly.com/enigmalabsmusic/chat';
const TO = process.argv[2] || 'genesisbarriosdev@gmail.com';

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY not set (checked .env.local). Aborting.');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// Reproduces renderBrandedEmail() + buildColdEmailHtml()'s no-website branch
// from server.js line-for-line (minus the tracking pixel, which needs a real
// lead _id) so the test email matches what a real prospect actually gets.
function buildTestColdEmailHtml() {
  const paragraphs = [
    `I came across <strong>Test Business</strong>'s business page and noticed you don't currently have a website to showcase your business and make it easier for customers to find you online.`,
    `To give you an idea of what's possible, I went ahead and built you a brand new website from scratch. I'd love to show it to you — there's no obligation, and it only takes about 5-10 minutes.`,
    `Would you be available for a quick call sometime in the next day or two? Here's my calendar link for you to schedule it at your convenience:`
  ];
  const paragraphsHtml = paragraphs.map((p) => `<p style="line-height: 1.6;">${p}</p>`).join('\n');

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px;">Hi,</h2>
      ${paragraphsHtml}
      <p style="text-align: center; margin: 32px 0;">
        <a href="${CALENDAR_LINK}" style="background:#68FF00; color:#111; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:6px; display:inline-block;">
          Schedule call
        </a>
      </p>
      <p style="line-height: 1.6;">Looking forward to hearing from you,<br/><br/>Gen Barrios<br/><a href="${SITE_URL}" style="color:#111;">enigma-labs.com</a></p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}"><img src="${SITE_URL}/logo.png" alt="Enigma Labs" width="150" style="display:inline-block;" /></a>
      </div>
    </div>
  `;
}

async function main() {
  console.log(`Sending test cold email from "${FROM}" to "${TO}"...`);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [TO],
    subject: 'Free Website Mockup 🖥️ for Test Business',
    html: buildTestColdEmailHtml()
  });

  if (error) {
    console.error('Send failed:', error);
    process.exit(1);
  }

  console.log('Sent. Resend id:', data.id);
  console.log(`Check the inbox AND spam/promotions folder for ${TO}.`);
  console.log('For a numeric spam score instead, send the same test to a mail-tester.com address.');
}

main();
