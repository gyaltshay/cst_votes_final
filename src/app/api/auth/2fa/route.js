import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { generateTwoFactorCode } from '@/lib/2fa';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.requires2FA) {
      return NextResponse.json(
        { error: '2FA not required for this user' },
        { status: 400 }
      );
    }

    const code = await generateTwoFactorCode(session.user.id);
    await sendVerificationEmail(session.user.email, code);

    return NextResponse.json({ message: '2FA code sent successfully' });
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    return NextResponse.json(
      { error: 'Failed to send 2FA code' },
      { status: 500 }
    );
  }
} 