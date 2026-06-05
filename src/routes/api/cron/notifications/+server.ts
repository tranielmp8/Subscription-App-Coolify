import { json } from '@sveltejs/kit';
import { runNotifications } from '$lib/server/notifications';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const secret = request.headers.get('x-cron-secret');
	if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await runNotifications();
		return json({ ok: true, ...result });
	} catch (err) {
		return json({ ok: false, error: String(err) }, { status: 500 });
	}
};
