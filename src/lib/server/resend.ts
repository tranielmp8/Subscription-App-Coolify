import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { Subscription } from './db/schema';

const CYCLE_LABELS: Record<string, string> = {
	weekly: 'Weekly',
	monthly: 'Monthly',
	quarterly: 'Quarterly',
	biannual: 'Every 6 months',
	yearly: 'Yearly'
};

function getResend() {
	return new Resend(env.RESEND_API_KEY);
}

function formatResendError(error: unknown) {
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}

	return 'Email provider rejected the request';
}

export async function sendAuthCodeEmail({ to, otp }: { to: string; otp: string }) {
	const resend = getResend();

	const result = await resend.emails.send({
		from: env.RESEND_FROM_EMAIL,
		to,
		subject: `Your PrideNPurpose sign-in code: ${otp}`,
		html: `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 32px">
    <h1 style="margin:0 0 12px;color:#111827;font-size:22px">Sign in to PrideNPurpose</h1>
    <p style="color:#374151;font-size:14px">Enter this verification code to finish signing in:</p>
    <div style="margin:24px 0;padding:18px 20px;border-radius:10px;background:#eef2ff;color:#3730a3;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">${otp}</div>
    <p style="color:#6b7280;font-size:13px">This code expires soon. If you did not request it, you can ignore this email.</p>
  </div>
</body>
</html>`
	});

	if (result.error) {
		throw new Error(formatResendError(result.error));
	}

	return result.data;
}

export async function sendNotificationEmail({
	to,
	subscription,
	daysBefore
}: {
	to: string;
	subscription: Subscription;
	daysBefore: number;
}) {
	const resend = getResend();
	const amount = subscription.amount ? `$${parseFloat(subscription.amount).toFixed(2)}` : 'N/A';
	const cycle = CYCLE_LABELS[subscription.billingCycle] ?? subscription.billingCycle;
	const dueDate = new Date(subscription.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const subject =
		daysBefore === 0
			? `[Due Today] ${subscription.name} — ${amount}`
			: `[${daysBefore}d] ${subscription.name} renews in ${daysBefore} day${daysBefore === 1 ? '' : 's'} — ${amount}`;

	await resend.emails.send({
		from: env.RESEND_FROM_EMAIL,
		to,
		subject,
		html: buildHtml({ subscription, daysBefore, amount, cycle, dueDate })
	});
}

export async function sendTestNotificationEmail({
	to,
	subscription
}: {
	to: string;
	subscription: Subscription;
}) {
	const resend = getResend();
	const amount = subscription.amount ? `$${parseFloat(subscription.amount).toFixed(2)}` : 'N/A';

	await resend.emails.send({
		from: env.RESEND_FROM_EMAIL,
		to,
		subject: `[Test] ${subscription.name} notification setup`,
		html: `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 32px">
    <h1 style="margin:0 0 12px;color:#111827;font-size:22px">Test notification</h1>
    <p style="color:#374151;font-size:14px">Your email reminders are configured for ${subscription.name}.</p>
    <p style="color:#6b7280;font-size:14px">Amount: <strong>${amount}</strong></p>
  </div>
</body>
</html>`
	});
}

function buildHtml({
	subscription,
	daysBefore,
	amount,
	cycle,
	dueDate
}: {
	subscription: Subscription;
	daysBefore: number;
	amount: string;
	cycle: string;
	dueDate: string;
}) {
	const isUrgent = daysBefore <= 1;
	const badgeColor = isUrgent ? '#fee2e2' : '#fef3c7';
	const badgeText = isUrgent ? '#991b1b' : '#92400e';
	const label = daysBefore === 0 ? 'Due Today' : `Due in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`;

	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px}
    .wrap{max-width:540px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    .hdr{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center}
    .hdr h1{color:#fff;margin:0;font-size:22px;font-weight:700}
    .hdr p{color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px}
    .body{padding:28px 32px}
    .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:20px;background:${badgeColor};color:${badgeText}}
    .amount{font-size:36px;font-weight:700;color:#6366f1;text-align:center;margin:20px 0}
    .row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid #f3f4f6}
    .row:last-of-type{border:none}
    .lbl{color:#6b7280;font-size:14px}
    .val{color:#111827;font-size:14px;font-weight:600}
    .btn{display:inline-block;margin-top:20px;padding:11px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
    .foot{padding:20px 32px;background:#f9fafb;text-align:center;color:#9ca3af;font-size:12px}
  </style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>Subscription Reminder</h1>
    <p>${subscription.name}</p>
  </div>
  <div class="body">
    <span class="badge">${label}</span>
    <div class="amount">${amount}</div>
    <div class="row"><span class="lbl">Service</span><span class="val">${subscription.name}</span></div>
    <div class="row"><span class="lbl">Due Date</span><span class="val">${dueDate}</span></div>
    <div class="row"><span class="lbl">Billing Cycle</span><span class="val">${cycle}</span></div>
    ${subscription.category ? `<div class="row"><span class="lbl">Category</span><span class="val">${subscription.category}</span></div>` : ''}
    ${subscription.websiteUrl ? `<div style="text-align:center"><a class="btn" href="${subscription.websiteUrl}">Visit ${subscription.name} →</a></div>` : ''}
  </div>
  <div class="foot">PrideNPurpose Subscription Tracker</div>
</div>
</body>
</html>`;
}
