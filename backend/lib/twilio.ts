import twilio from 'twilio';

function getTwilioClient(): ReturnType<typeof twilio> | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith('your_') || token.startsWith('your_')) {
    return null;
  }
  return twilio(sid, token);
}

function getTwilioPhoneNumber(): string {
  return process.env.TWILIO_PHONE_NUMBER || '';
}

export { getTwilioClient, getTwilioPhoneNumber };
