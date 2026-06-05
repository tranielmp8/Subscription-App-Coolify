<script lang="ts">
	import { enhance } from '$app/forms';
	import { tagColorClass } from '$lib/utils/tags';

	let { data, form } = $props();

	let showPassword = $state(false);
	let confirmDelete = $state(false);
	let copied = $state('');

	const CYCLE_LABELS: Record<string, string> = {
		weekly: 'Weekly',
		biweekly: 'Bi-weekly',
		monthly: 'Monthly',
		quarterly: 'Quarterly',
		biannual: 'Every 6 months',
		yearly: 'Yearly'
	};

	const CATEGORY_COLORS: Record<string, string> = {
		entertainment: 'bg-pink-100 text-pink-700',
		productivity: 'bg-blue-100 text-blue-700',
		utilities: 'bg-yellow-100 text-yellow-700',
		health: 'bg-green-100 text-green-700',
		education: 'bg-purple-100 text-purple-700',
		gaming: 'bg-orange-100 text-orange-700',
		news: 'bg-cyan-100 text-cyan-700',
		cloud: 'bg-sky-100 text-sky-700',
		business: 'bg-indigo-100 text-indigo-700',
		other: 'bg-gray-100 text-gray-700'
	};

	function statusBadge(days: number, active: boolean) {
		if (!active) return 'bg-gray-100 text-gray-500';
		if (days < 0) return 'bg-red-100 text-red-700';
		if (days <= 3) return 'bg-orange-100 text-orange-700';
		if (days <= 7) return 'bg-amber-100 text-amber-700';
		return 'bg-emerald-100 text-emerald-700';
	}

	function daysLabel(days: number) {
		if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
		if (days === 0) return 'Due today';
		if (days === 1) return 'Due tomorrow';
		return `Due in ${days} days`;
	}

	function formatReminderDate(date: string) {
		return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatReminderTime(time: string) {
		const [hourRaw, minute] = time.split(':');
		const hour = Number(hourRaw);
		const suffix = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minute} ${suffix}`;
	}

	function formatEventTime(date: string | Date) {
		return new Date(date).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	async function copyText(text: string, key: string) {
		await navigator.clipboard.writeText(text);
		copied = key;
		setTimeout(() => (copied = ''), 1500);
	}

	const {
		subscription: sub,
		credentials,
		notifications,
		nextNotification,
		notificationHistory,
		tags,
		daysUntil
	} = $derived(data);
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Breadcrumb & header -->
	<div>
		<a href="/dashboard" class="text-sm text-indigo-600 hover:underline">← Back to Dashboard</a>
		<div class="mt-2 flex flex-wrap items-start justify-between gap-3">
			<div>
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="text-2xl font-bold text-gray-900">{sub.name}</h1>
					{#if sub.category}
						<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {CATEGORY_COLORS[sub.category] ?? 'bg-gray-100 text-gray-700'}">
							{sub.category}
						</span>
					{/if}
					{#each tags as tag}
						<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {tagColorClass(tag.color)}">{tag.name}</span>
					{/each}
					<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {statusBadge(daysUntil, sub.isActive)}">
						{#if !sub.isActive}Inactive{:else}{daysLabel(daysUntil)}{/if}
					</span>
				</div>
				{#if sub.description}
					<p class="mt-1 text-sm text-gray-500">{sub.description}</p>
				{/if}
			</div>
			<a
				href="/subscriptions/{sub.id}/edit"
				class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				Edit
			</a>
		</div>
	</div>

	<!-- Billing info -->
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Billing</h2>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#if sub.amount}
				<div>
					<p class="text-xs text-gray-500">Amount</p>
					<p class="mt-1 text-xl font-bold text-gray-900">
						{sub.currency} ${parseFloat(sub.amount).toFixed(2)}
					</p>
				</div>
			{/if}
			<div>
				<p class="text-xs text-gray-500">Billing Cycle</p>
				<p class="mt-1 font-medium text-gray-900">{CYCLE_LABELS[sub.billingCycle] ?? sub.billingCycle}</p>
			</div>
			<div>
				<p class="text-xs text-gray-500">Next Due</p>
				<p class="mt-1 font-medium text-gray-900">
					{new Date(sub.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</p>
			</div>
			{#if sub.websiteUrl}
				<div>
					<p class="text-xs text-gray-500">Website</p>
					<a
						href={sub.websiteUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-1 block truncate text-sm font-medium text-indigo-600 hover:underline"
					>
						{new URL(sub.websiteUrl).hostname}
					</a>
				</div>
			{/if}
		</div>

		{#if sub.isActive}
			<form method="POST" action="?/markPaid" use:enhance class="mt-5 border-t border-gray-100 pt-4">
				<button
					type="submit"
					class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
				>
					✓ Mark as Paid — advance to next cycle
				</button>
			</form>
		{/if}
	</section>

	<!-- Credentials -->
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Credentials</h2>
		{#if credentials?.username || credentials?.password}
			<div class="space-y-3">
				{#if credentials.username}
					<div class="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
						<div>
							<p class="text-xs text-gray-500">Username / Email</p>
							<p class="mt-0.5 font-medium text-gray-900">{credentials.username}</p>
						</div>
						<button
							onclick={() => copyText(credentials!.username!, 'username')}
							class="shrink-0 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200"
						>
							{copied === 'username' ? '✓ Copied' : 'Copy'}
						</button>
					</div>
				{/if}
				{#if credentials.password}
					<div class="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
						<div class="min-w-0 flex-1">
							<p class="text-xs text-gray-500">Password</p>
							<p class="mt-0.5 font-mono font-medium tracking-wider text-gray-900">
								{showPassword ? credentials.password : '•'.repeat(Math.min(credentials.password.length, 16))}
							</p>
						</div>
						<div class="flex shrink-0 gap-1">
							<button
								onclick={() => (showPassword = !showPassword)}
								class="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200"
							>
								{showPassword ? 'Hide' : 'Show'}
							</button>
							<button
								onclick={() => copyText(credentials!.password!, 'password')}
								class="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200"
							>
								{copied === 'password' ? '✓ Copied' : 'Copy'}
							</button>
						</div>
					</div>
				{/if}
				{#if credentials?.notes}
					<div class="rounded-lg bg-gray-50 px-4 py-3">
						<p class="text-xs text-gray-500">Notes</p>
						<p class="mt-0.5 text-sm text-gray-700">{credentials.notes}</p>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-sm text-gray-400">No credentials saved. <a href="/subscriptions/{sub.id}/edit" class="text-indigo-600 hover:underline">Add them →</a></p>
		{/if}
	</section>

	<!-- Notifications -->
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Notifications</h2>
			{#if notifications?.recipientEmail}
				<form method="POST" action="?/sendTestNotification" use:enhance>
					<button
						type="submit"
						class="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
					>
						Send Test Email
					</button>
				</form>
			{/if}
		</div>
		{#if form?.testSent}
			<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Test email sent.</div>
		{:else if form?.error}
			<div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</div>
		{/if}
		{#if notifications}
			<div class="space-y-2 text-sm">
				<div class="flex items-center gap-2">
					<span class="h-2 w-2 rounded-full {notifications.enabled ? 'bg-emerald-500' : 'bg-gray-300'}"></span>
					<span class="text-gray-700">{notifications.enabled ? 'Enabled' : 'Disabled'}</span>
				</div>
				<p class="text-gray-500">Sending to: <span class="font-medium text-gray-700">{notifications.recipientEmail}</span></p>
				<p class="text-gray-500">
					Notify: <span class="font-medium text-gray-700">{notifications.daysBeforeList.sort((a, b) => b - a).join(', ')} day{notifications.daysBeforeList.length > 1 ? 's' : ''} before</span>
				</p>
				<p class="text-gray-500">
					Time: <span class="font-medium text-gray-700">{formatReminderTime(notifications.notifyTime)} {notifications.timezone}</span>
				</p>
				{#if nextNotification}
					<p class="text-gray-500">
						Next reminder:
						<span class="font-medium text-gray-700">
							{formatReminderDate(nextNotification.date)} around {formatReminderTime(nextNotification.time)}
						</span>
					</p>
				{:else if notifications.enabled}
					<p class="text-gray-500">Next reminder: <span class="font-medium text-gray-700">None left before this due date</span></p>
				{/if}
			</div>
		{:else}
			<p class="text-sm text-gray-400">No notifications configured. <a href="/subscriptions/{sub.id}/edit" class="text-indigo-600 hover:underline">Set them up →</a></p>
		{/if}
	</section>

	<!-- Notification history -->
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Notification History</h2>
		{#if notificationHistory.length}
			<div class="divide-y divide-gray-100">
				{#each notificationHistory as event}
					<div class="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
						<div>
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full {event.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'}"></span>
								<p class="text-sm font-medium text-gray-900">
									{event.status === 'sent' ? 'Sent' : 'Failed'}
									{event.eventType === 'test' ? ' test email' : ` ${event.daysBefore} day reminder`}
								</p>
							</div>
							<p class="mt-1 text-xs text-gray-500">{event.recipientEmail}</p>
							{#if event.message}
								<p class="mt-1 text-xs text-gray-400">{event.message}</p>
							{/if}
						</div>
						<p class="text-xs text-gray-400">{formatEventTime(event.createdAt)}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-gray-400">No notification activity yet.</p>
		{/if}
	</section>

	<!-- Danger zone -->
	<section class="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-red-500">Danger Zone</h2>
		<div class="flex flex-wrap items-center gap-3">
			<form method="POST" action="?/toggleActive" use:enhance>
				<button
					type="submit"
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					{sub.isActive ? 'Deactivate' : 'Reactivate'} Subscription
				</button>
			</form>
			{#if !confirmDelete}
				<button
					onclick={() => (confirmDelete = true)}
					class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
				>
					Delete Subscription
				</button>
			{:else}
				<div class="flex items-center gap-2">
					<span class="text-sm text-red-600">Are you sure?</span>
					<form method="POST" action="?/delete" use:enhance>
						<button
							type="submit"
							class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
						>
							Yes, Delete
						</button>
					</form>
					<button
						onclick={() => (confirmDelete = false)}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</section>
</div>
