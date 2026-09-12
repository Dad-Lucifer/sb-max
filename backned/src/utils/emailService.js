const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, code) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[Mock Email] To: ${email}, Code: ${code}`);
        return true; // Mock success if not configured
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your Account - Thunder Gaming Cafe',
        text: `Your verification code is: ${code}`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #1a3c5e;">Thunder Gaming Cafe</h2>
        <p>Thank you for signing up.</p>
        <p>Please use the following code to verify your account:</p>
        <h1 style="background: #fbbf24; display: inline-block; padding: 10px 20px; border-radius: 5px;">${code}</h1>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendVerificationEmail };
