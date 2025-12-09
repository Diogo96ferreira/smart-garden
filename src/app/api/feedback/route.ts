import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAuthUser } from '@/lib/supabaseServer';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const TO_EMAIL = 'diogo96ferreira@gmail.com';
// NOTE: This "from" address must be a verified domain on your Resend account.
// Using the default 'onboarding@resend.dev' for demonstration.
const FROM_EMAIL = 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const emailHtml = `
      <h1>Feedback from Smart Garden User</h1>
      <p><b>User:</b> ${user?.email ?? 'Anonymous'}</p>
      <p><b>User ID:</b> ${user?.id ?? 'N/A'}</p>
      <hr>
      <p><b>Message:</b></p>
      <pre style="white-space: pre-wrap; font-family: sans-serif;">${message}</pre>
    `;

    if (!resend) {
      console.warn('Resend API key is not configured. Feedback saved to logs only.');
      console.info('Feedback message:', { user: user?.email ?? 'Anonymous', message });
      return NextResponse.json({ success: true, delivered: false });
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: 'New Feedback from Smart Garden App',
      html: emailHtml,
      replyTo: user?.email ?? undefined,
    });

    return NextResponse.json({ success: true, delivered: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error sending feedback email:', errorMessage);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
