import { generateToken } from 'generate-sms-verification-code';
import { sendEmail } from '@/lib/email';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generate2FACode(userId) {
  const code = generateToken(6, { type: 'number' });
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.twoFactorCode.create({
    data: {
      userId,
      code,
      expiresAt
    }
  });

  return code;
}

export async function verify2FACode(userId, code) {
  const validCode = await prisma.twoFactorCode.findFirst({
    where: {
      userId,
      code,
      expiresAt: {
        gt: new Date()
      },
      used: false
    }
  });

  if (!validCode) {
    return false;
  }

  await prisma.twoFactorCode.update({
    where: { id: validCode.id },
    data: { used: true }
  });

  return true;
}

export async function initiate2FA(user) {
  const code = await generate2FACode(user.id);
  await sendEmail({
    to: user.email,
    subject: 'Your CST Votes Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Verification Code</h2>
        <p>Hello ${user.name},</p>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `
  });
  return true;
}

export async function cleanupExpiredCodes() {
  await prisma.twoFactorCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true }
      ]
    }
  });
}