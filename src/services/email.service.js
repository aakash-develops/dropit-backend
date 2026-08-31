import { Resend } from "resend";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const recipient = Array.isArray(to) ? to : [to];

    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: recipient,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("Resend Email Error:", error);
    throw error;
  }
};

/**
 * Sends 6-digit numeric OTP email
 */
export const sendEmailOtp = async (to, otp) => {
  return await sendEmail({
    to,
    subject: "Your Password Reset OTP",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Your OTP code for resetting your password is:</p>
        <h1 style="background: #f3f4f6; display: inline-block; padding: 10px 20px; letter-spacing: 4px; color: #111827;">${otp}</h1>
        <p>This code will expire shortly.</p>
      </div>
    `,
  });
};