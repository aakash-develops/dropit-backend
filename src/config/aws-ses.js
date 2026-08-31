import AWS from "aws-sdk";

// 1. Configure AWS SDK using environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "eu-north-1",
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

/**
 * Sends an HTML email via AWS SES
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} body - HTML email content
 */
export const sendEmail = async (to, subject, body) => {
  // 2. Validate input parameters
  if (!to || !subject || !body) {
    throw new Error("Missing required email parameters: 'to', 'subject', and 'body' are required.");
  }

  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: body,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: process.env.AWS_SES_SENDER || "bhariyatransport@gmail.com",
  };

  try {
    // 3. Trigger email send with async/await
    const result = await ses.sendEmail(params).promise();
    return result;
  } catch (error) {
    console.error(`AWS SES Email Dispatch Error (${to}):`, error.message);
    throw error; // Re-throw so calling service can handle failure
  }
};