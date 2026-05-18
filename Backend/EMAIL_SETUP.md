# 📧 Email Feature - Teacher & Student Credentials

## Overview
When a new teacher or student is created through the admin dashboard, they automatically receive a **professional welcome email** containing their login credentials and a direct link to the login page.

---

## 🎯 Features

### ✅ Automatic Credential Delivery
- **Teachers** receive emails with temporary password when created
- **Students** receive emails with temporary password and roll number
- Emails sent immediately after account creation
- HTML-formatted professional emails with DIEMS branding

### ✅ Email Contents
**For Teachers:**
- Teacher's name (personalized)
- Email address
- Temporary password
- Direct login link
- Security instructions

**For Students:**
- Student's name (personalized)
- Email address
- Roll number
- Temporary password
- Direct login link
- Security instructions

### ✅ Robust Error Handling
- If email fails to send, it doesn't block the account creation
- Error logs show in server console for admin to investigate
- User is still created even if email service is temporarily unavailable

---

## 🔧 Setup Instructions

### Step 1: Configure Gmail SMTP (Recommended)

**Option A: Using Gmail with App Password (Recommended)**

1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** and **Windows Computer**
3. Google will generate a **16-character password**
4. Copy this password

**Option B: Using Gmail with Regular Password**
- If you don't have 2FA enabled, you can use your regular Gmail password
- Less secure, not recommended

### Step 2: Update .env File

Edit `Backend/.env`:

```env
# Email Configuration
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=your-gmail@gmail.com
```

**Example:**
```env
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@diems.edu.in
SMTP_PASS=abcd efgh ijkl mnop
FROM_EMAIL=admin@diems.edu.in
```

### Step 3: Restart Backend Server

After updating `.env`, restart the backend:

```bash
npm run dev
```

---

## 📝 Using the Email Feature

### Creating a Teacher

**Admin Form → Create Teacher**

1. Fill in teacher details:
   - Name
   - Email ✅ (email will be used)
   - Subjects
   - Classes
   - etc.

2. Click **Create Teacher**

3. **Automatic Actions:**
   - ✅ Teacher account created in database
   - ✅ Email sent with credentials
   - ✅ Confirmation shown to admin

### Creating a Student

**Admin Form → Create Student**

1. Fill in student details:
   - Name
   - Email ✅ (email will be used)
   - Roll Number
   - Class
   - etc.

2. Click **Create Student**

3. **Automatic Actions:**
   - ✅ Student account created in database
   - ✅ Email sent with credentials
   - ✅ Confirmation shown to admin

---

## 📧 Email Template Preview

### Teacher Welcome Email

```
┌─────────────────────────────────────┐
│   Welcome to DIEMS Attendance       │
│   Your teacher account has been     │
│         created                     │
└─────────────────────────────────────┘

Dear Dr. John Smith,

Your account has been successfully created. 
Below are your login credentials:

Email: john.smith@diems.edu.in
Temporary Password: aB$d#kL9@mX2

NEXT STEPS:
1. Click the login button below
2. Enter your email and temporary password
3. Change your password after first login

[Login to Dashboard]
```

---

## 🔐 Security Best Practices

### For Admins
- ✅ Do NOT share your SMTP password in code/repo
- ✅ Use environment variables for sensitive data
- ✅ Keep SMTP credentials in `.env` (add to `.gitignore`)
- ✅ Rotate SMTP password periodically

### For Users
- ✅ Teachers/Students receive temporary passwords
- ✅ Users must change password on first login
- ✅ Credentials sent via SMTP (encrypted)
- ✅ Each user gets unique password

### .gitignore Check
Make sure `.env` is in `.gitignore`:

```
.env
.env.local
.env.*.local
```

---

## 🛠️ Troubleshooting

### Email Not Sending

**Check 1: .env Configuration**
```bash
# Backend/.env should have:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com  # Must be valid
SMTP_PASS=16-char-app-password   # Must be correct
```

**Check 2: Gmail App Password**
- Go to https://myaccount.google.com/apppasswords
- Verify the 16-character password is correct
- If spaces in password, remove them

**Check 3: Server Logs**
```bash
# Check console output for email errors:
$ npm run dev

# Look for messages like:
# "Failed to send credentials email: ..."
# "Error sending teacher credentials email: ..."
```

**Check 4: Network/Internet**
- Ensure backend has internet access
- Gmail SMTP requires outbound connection to smtp.gmail.com:587

### Email Formatting Issues

If emails don't display properly:
1. Check email client supports HTML
2. Try sending test email manually
3. Verify SMTP connection with:
   ```bash
   telnet smtp.gmail.com 587
   ```

### "User already exists" Error

If trying to create duplicate email:
1. Check if teacher/student already exists
2. Use unique email address
3. Email is unique identifier in system

---

## 📧 API Integration Details

### When Teacher is Created

```javascript
// Backend/controllers/adminController.js
exports.createTeacher = asyncHandler(async (req, res) => {
  // ... create teacher in database ...
  
  // Send email
  await sendTeacherCredentials({
    teacherEmail: email,
    teacherName: name,
    temporaryPassword: password,
    loginLink: loginLink
  });
  
  // Return success
  res.status(201).json(teacher);
});
```

### When Student is Created

```javascript
// Backend/controllers/adminController.js
exports.createStudent = asyncHandler(async (req, res) => {
  // ... create student in database ...
  
  // Send email
  await sendStudentCredentials({
    studentEmail: email,
    studentName: name,
    rollNumber: rollNo,
    temporaryPassword: password,
    loginLink: loginLink
  });
  
  // Return success
  res.status(201).json(student);
});
```

---

## 📊 Email Service Module

**Location:** `Backend/services/emailService.js`

**Exports:**
- `sendEmail(params)` - Generic email sender
- `sendTeacherCredentials(params)` - Teacher welcome email
- `sendStudentCredentials(params)` - Student welcome email

**Usage:**
```javascript
const { sendTeacherCredentials, sendStudentCredentials } = 
  require('../services/emailService');

// Send teacher email
await sendTeacherCredentials({
  teacherEmail: 'teacher@example.com',
  teacherName: 'Dr. Smith',
  temporaryPassword: 'TempPass123!',
  loginLink: 'http://localhost:5173'
});

// Send student email
await sendStudentCredentials({
  studentEmail: 'student@example.com',
  studentName: 'John Doe',
  rollNumber: 'FYCS001',
  temporaryPassword: 'TempPass123!',
  loginLink: 'http://localhost:5173'
});
```

---

## 🔄 Future Enhancements

Potential improvements:
- [ ] Email templates stored in database
- [ ] Custom email branding/logos
- [ ] Multiple language support
- [ ] Email verification links
- [ ] Password reset emails
- [ ] Attendance report emails
- [ ] Scheduled bulk email reminders
- [ ] Email scheduling (send at specific time)

---

## 📞 Support

If emails aren't sending:

1. **Check .env variables** - ensure SMTP credentials are correct
2. **Check Gmail settings** - ensure App Password is generated correctly
3. **Check logs** - `npm run dev` shows error messages
4. **Test SMTP** - use online SMTP checkers
5. **Contact Admin** - escalate if persistent issues

---

## Summary

✅ **Email Feature Enabled!**

Teachers and students now receive professional welcome emails with their login credentials automatically when accounts are created. The system handles errors gracefully without blocking account creation.

**Next Steps:**
1. Configure your Gmail account with App Password
2. Update `.env` with SMTP credentials
3. Restart backend server
4. Test by creating a teacher/student and checking email!

