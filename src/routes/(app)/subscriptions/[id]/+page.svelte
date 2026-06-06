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
		entertainment: 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30',
		productivity: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
		utilities: 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30',
		health: 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30',
		education: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30',
		gaming: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30',
		news: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30',
		cloud: 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30',
		business: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30',
		other: 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30'
	};

	function statusBadge(days: number, active: boolean) {
		if (!active) return 'bg-slate-700/50 text-slate-400 ring-1 ring-slate-600/30';
		if (days < 0) return 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30';
		if (days <= 3) return 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30';
		if (days <= 7) return 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30';
		return 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30';
	}

	function daysLabel(days: number) {
		if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
		if (days === 0) return 'Due today';
		if (days === 1) return 'Due tomorrow';
		return `Due in ${days} days`;
	}

	function formatReminderDate(date: string) {
		return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
			month: 'short', day: 'numeric', year: 'numeric'
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
			month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
		});
	}

	async function copyText(text: string, key: string) {
		await navigator.clipboard.writeText(text);
		copied = key;
		setTimeout(() => (copied = ''), 1500);
	}

	const { subscription: sub, credentials, notifications, nextNotification, notificationHistory, tags, daysUntil } = $derived(data);
</script>

<div class="mx-auto max-w-2xl space-y-5">
	<!-- Breadcrumb & header -->
	<div>
		<a href="/dashboard" class="text-sm text-violet-400 hover:text-violet-300 transition-colors">← Back to Dashboard</a>
		<div class="mt-3 flex flex-wrap items-start justify-between gap-3">
			<div>
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="text-2xl font-black text-slate-100">{sub.name}</h1>
					{#if sub.category}
						<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {CATEGORY_COLORS[sub.category] ?? 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30'}">
							{sub.category}
						</span>
					{/if}
					{#each tags as tag}
						<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {tagColorClass(tag.color)}">{tag.name}</span>
					{/each}
					<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold {statusBadge(daysUntil, sub.isActive)}">
						{#if !sub.isActive}Inactive{:else}{daysLabel(daysUntil)}{/if}
					</span>
				</div>
				{#if sub.description}
					<p class="mt-1.5 text-sm text-slate-500">{sub.description}</p>
				{/if}
			</div>
			<a
				href="/subscriptions/{sub.id}/edit"
				class="rounded-xl border border-violet-900/30 bg-[var(--subtle-hover)] px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-[var(--subtle-strong)] hover:text-slate-100 transition-all"
			>
				Edit
			</a>
		</div>
	</div>

	<!-- Billing info -->
	<section class="rounded-xl card-dark p-6">
		<h2 class="mb-5 text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Billing</h2>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#if sub.amount}
				<div>
					<p class="text-xs text-slate-500">Amount</p>
					<p class="mt-1 text-xl font-black gradient-text">
						{sub.currency} ${parseFloat(sub.amount).toFixed(2)}
					</p>
				</div>
			{/if}
			<div>
				<p class="text-xs text-slate-500">Billing Cycle</p>
				<p class="mt-1 font-semibold text-slate-200">{CYCLE_LABELS[sub.billingCycle] ?? sub.billingCycle}</p>
			</div>
			<div>
				<p class="text-xs text-slate-500">Next Due</p>
				<p class="mt-1 font-semibold text-slate-200">
					{new Date(sub.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</p>
			</div>
			{#if sub.websiteUrl}
				<div>
					<p class="text-xs text-slate-500">Website</p>
					<a href={sub.websiteUrl} target="_blank" rel="noopener noreferrer"
						class="mt-1 block truncate text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
						{new URL(sub.websiteUrl).hostname}
					</a>
				</div>
			{/if}
		</div>

		{#if sub.isActive}
			<form method="POST" action="?/markPaid" use:enhance class="mt-5 border-t border-violet-900/20 pt-4">
				<button type="submit"
					class="rounded-xl bg-emerald-500/20 px-5 py-2 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/35 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all">
					✓ Mark as Paid — advance to next cycle
				</button>
			</form>
		{/if}
	</section>

	<!-- Credentials -->
	<section class="rounded-xl card-dark p-6">
		<h2 class="mb-5 text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Credentials</h2>
		{#if credentials?.username || credentials?.password}
			<div class="space-y-3">
				{#if credentials.username}
					<div class="flex items-center justify-between gap-3 rounded-xl bg-[var(--subtle-hover)] px-4 py-3 ring-1 ring-violet-900/20">
						<div>
							<p class="text-xs text-slate-500">Username / Email</p>
							<p class="mt-0.5 font-semibold text-slate-200">{credentials.username}</p>
						</div>
						<button onclick={() => copyText(credentials!.username!, 'username')}
							class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-[var(--subtle-strong)] hover:text-slate-200 transition-all">
							{copied === 'username' ? '✓ Copied' : 'Copy'}
						</button>
					</div>
				{/if}
				{#if credentials.password}
					<div class="flex items-center justify-between gap-3 rounded-xl bg-[var(--subtle-hover)] px-4 py-3 ring-1 ring-violet-900/20">
						<div class="min-w-0 flex-1">
							<p class="text-xs text-slate-500">Password</p>
							<p class="mt-0.5 font-mono font-semibold tracking-wider text-slate-200">
								{showPassword ? credentials.password : '•'.repeat(Math.min(credentials.password.length, 16))}
							</p>
						</div>
						<div class="flex shrink-0 gap-1">
							<button onclick={() => (showPassword = !showPassword)}
								class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-[var(--subtle-strong)] hover:text-slate-200 transition-all">
								{showPassword ? 'Hide' : 'Show'}
							</button>
							<button onclick={() => copyText(credentials!.password!, 'password')}
								class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-[var(--subtle-strong)] hover:text-slate-200 transition-all">
								{copied === 'password' ? '✓ Copied' : 'Copy'}
							</button>
						</div>
					</div>
				{/if}
				{#if credentials?.notes}
					<div class="rounded-xl bg-[var(--subtle-hover)] px-4 py-3 ring-1 ring-violet-900/20">
						<p class="text-xs text-slate-500">Notes</p>
						<p class="mt-0.5 text-sm text-slate-300">{credentials.notes}</p>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-sm text-slate-600">No credentials saved. <a href="/subscriptions/{sub.id}/edit" class="text-violet-400 hover:text-violet-300 transition-colors">Add them →</a></p>
		{/if}
	</section>

	<!-- Notifications -->
	<section class="rounded-xl card-dark p-6">
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Notifications</h2>
			{#if notifications?.recipientEmail}
				<form method="POST" action="?/sendTestNotification" use:enhance>
					<button type="submit"
						class="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-400 hover:bg-violet-500/20 transition-all">
						Send Test Email
					</button>
				</form>
			{/if}
		</div>
		{#if form?.testSent}
			<div class="mb-4 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-400 ring-1 ring-emerald-500/30">Test email sent.</div>
		{:else if form?.error}
			<div class="mb-4 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/30">{form.error}</div>
		{/if}
		{#if notifications}
			<div class="space-y-2 text-sm">
				<div class="flex items-center gap-2">
					<span class="h-2 w-2 rounded-full {notifications.enabled ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-slate-600'}"></span>
					<span class="text-slate-300">{notifications.enabled ? 'Enabled' : 'Disabled'}</span>
				</div>
				<p class="text-slate-500">Sending to: <span class="font-semibold text-slate-300">{notifications.recipientEmail}</span></p>
				<p class="text-slate-500">
					Notify: <span class="font-semibold text-slate-300">{notifications.daysBeforeList.sort((a, b) => b - a).join(', ')} day{notifications.daysBeforeList.length > 1 ? 's' : ''} before</span>
				</p>
				<p class="text-slate-500">
					Time: <span class="font-semibold text-slate-300">{formatReminderTime(notifications.notifyTime)} {notifications.timezone}</span>
				</p>
				{#if nextNotification}
					<p class="text-slate-500">
						Next reminder: <span class="font-semibold text-slate-300">{formatReminderDate(nextNotification.date)} around {formatReminderTime(nextNotification.time)}</span>
					</p>
				{:else if notifications.enabled}
					<p class="text-slate-500">Next reminder: <span class="font-semibold text-slate-300">None left before this due date</span></p>
				{/if}
			</div>
		{:else}
			<p class="text-sm text-slate-600">No notifications configured. <a href="/subscriptions/{sub.id}/edit" class="text-violet-400 hover:text-violet-300 transition-colors">Set them up →</a></p>
		{/if}
	</section>

	<!-- Notification history -->
	<section class="rounded-xl card-dark p-6">
		<h2 class="mb-5 text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Notification History</h2>
		{#if notificationHistory.length}
			<div class="divide-y divide-violet-900/20">
				{#each notificationHistory as event}
					<div class="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
						<div>
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full {event.status === 'sent' ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}"></span>
								<p class="text-sm font-semibold text-slate-200">
									{event.status === 'sent' ? 'Sent' : 'Failed'}
									{event.eventType === 'test' ? ' test email' : ` ${event.daysBefore} day reminder`}
								</p>
							</div>
							<p class="mt-1 text-xs text-slate-500">{event.recipientEmail}</p>
							{#if event.message}
								<p class="mt-1 text-xs text-slate-600">{event.message}</p>
							{/if}
						</div>
						<p class="text-xs text-slate-600">{formatEventTime(event.createdAt)}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-slate-600">No notification activity yet.</p>
		{/if}
	</section>

	<!-- Danger zone -->
	<section class="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
		<h2 class="mb-5 text-xs font-bold uppercase tracking-widest text-red-400/80">Danger Zone</h2>
		<div class="flex flex-wrap items-center gap-3">
			<form method="POST" action="?/toggleActive" use:enhance>
				<button type="submit"
					class="rounded-xl border border-violet-900/30 bg-[var(--subtle-hover)] px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-[var(--subtle-strong)] transition-all">
					{sub.isActive ? 'Deactivate' : 'Reactivate'} Subscription
				</button>
			</form>
			{#if !confirmDelete}
				<button onclick={() => (confirmDelete = true)}
					class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all">
					Delete Subscription
				</button>
			{:else}
				<div class="flex items-center gap-2">
					<span class="text-sm text-red-400">Are you sure?</span>
					<form method="POST" action="?/delete" use:enhance>
						<button type="submit"
							class="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:bg-red-700 transition-all">
							Yes, Delete
						</button>
					</form>
					<button onclick={() => (confirmDelete = false)}
						class="rounded-xl border border-violet-900/30 bg-[var(--subtle-hover)] px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-[var(--subtle-strong)] transition-all">
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</section>
</div>
