const baseUrl = process.env.NOTIFICATION_CRON_URL;

if (!baseUrl) {
	console.error('Missing NOTIFICATION_CRON_URL. Set it to your deployed app URL, for example https://your-app.up.railway.app.');
	process.exit(1);
}

const url = new URL('/api/cron/notifications', baseUrl);
const headers = {};

if (process.env.CRON_SECRET) {
	headers['x-cron-secret'] = process.env.CRON_SECRET;
}

try {
	const response = await fetch(url, {
		method: 'POST',
		headers
	});

	const body = await response.text();

	if (!response.ok) {
		console.error(`Notification cron failed with HTTP ${response.status}: ${body}`);
		process.exit(1);
	}

	console.log(`Notification cron completed: ${body}`);
} catch (error) {
	console.error('Notification cron request failed:', error);
	process.exit(1);
}
