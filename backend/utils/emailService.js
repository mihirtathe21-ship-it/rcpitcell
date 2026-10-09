const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;
const EMAIL_SERVICE_SECRET = process.env.EMAIL_SERVICE_SECRET;

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email through Google Apps Script
const sendViaGoogleScript = async (payload) => {
  if (!EMAIL_SERVICE_URL || !EMAIL_SERVICE_SECRET) {
    throw new Error('Email service environment variables are missing');
  }

  const response = await fetch(EMAIL_SERVICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      ...payload,
      secret: EMAIL_SERVICE_SECRET,
    }),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Email service HTTP error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Email sending failed');
  }

  return result;
};

// Send Email Verification OTP
export const sendVerificationEmail = async (email, name, otp) => {
  return sendViaGoogleScript({
    action: 'verification',
    to: email,
    name,
    otp: String(otp),
  });
};

// Send job notification to students
export const sendJobNotificationEmail = async (
  email,
  studentName,
  job
) => {
  return sendViaGoogleScript({
    action: 'jobNotification',
    to: email,
    name: studentName,
    job: {
      company: job.company,
      title: job.title,
      package: job.package,
      location: job.location,
      driveDate: job.driveDate
        ? new Date(job.driveDate).toDateString()
        : '',
      lastDateToApply: job.lastDateToApply
        ? new Date(job.lastDateToApply).toDateString()
        : '',
    },
  });
};