const fs = require('fs');
const path = require('path');

const code = `const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
  return info;
};

const sendTeacherCredentials = async (params) => {
  const { teacherEmail, teacherName, temporaryPassword, loginLink } = params;
  const htmlTemplate = [
    '<html><head><style>',
    'body { font-family: Arial, sans-serif; background: #f5f5f5; }',
    '.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }',
    '.header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 40px; text-align: center; }',
    '.content { padding: 40px; }',
    '.info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0; }',
    '.button { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }',
    '</style></head><body>',
    '<div class="container">',
    '<div class="header"><h1>Welcome to DIEMS</h1><p>Your teacher account has been created</p></div>',
    '<div class="content">',
    '<p>Dear <strong>' + teacherName + '</strong>,</p>',
    '<p>Your account has been successfully created. Below are your login credentials:</p>',
    '<div class="info-box">',
    '<p><strong>Email:</strong> ' + teacherEmail + '</p>',
    '<p><strong>Temporary Password:</strong> ' + temporaryPassword + '</p>',
    '</div>',
    '<p><strong>Next Steps:</strong></p>',
    '<ol><li>Click the login button below</li><li>Enter your email and temporary password</li><li>Change your password after first login</li></ol>',
    '<p style="text-align: center;"><a href="' + loginLink + '" class="button">Login to Dashboard</a></p>',
    '</div></div></body></html>'
  ].join('');
  
  return await sendEmail({ 
    to: teacherEmail, 
    subject: 'Welcome to DIEMS Attendance Management - Your Login Credentials', 
    html: htmlTemplate 
  });
};

module.exports = { sendEmail, sendTeacherCredentials };
`;

fs.writeFileSync(path.join(__dirname, '..', 'services', 'emailService.js'), code);
console.log('✅ emailService.js updated successfully');
