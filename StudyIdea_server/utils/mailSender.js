// Importing nodemailer for sending emails
const nodemailer = require("nodemailer");

// Function to send email
const mailSender = async (email, title, body) => {
    try {
        // Create transporter using nodemailer
        let transporter = nodemailer.createTransport({
            // Gmail SMTP host from environment variables
            host: process.env.MAIL_HOST, // smtp.gmail.com
            port: 465, // Gmail secure port
            secure: true, // Use SSL
            auth: {
                user: process.env.MAIL_USER,  // Your email from .env file
                pass: process.env.MAIL_PASS,  // Your app password from Gmail
            },
        });

        // Send email using the transporter
        let info = await transporter.sendMail({
            from: `StudyIdea || CodeHelp - Apex-Team <${process.env.MAIL_USER}>`,  // Sender name + email
            to: `${email}`,          // Recipient's email
            subject: `${title}`,     // Email subject
            html: `${body}`,         // Email body content (HTML allowed)
        });

        console.log("✅ Email sent successfully:", info.response);
        return info;
    } catch (error) {
        console.log("❌ Error while sending email:", error.message);
        throw error;
    }
};

// Exporting the mailSender function
module.exports = mailSender;
