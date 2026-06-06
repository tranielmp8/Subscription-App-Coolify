<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import TagInput from '$lib/components/TagInput.svelte';

	let { data, form } = $props();

	let sub = $derived(data.subscription);
	let credentials = $derived(data.credentials);
	let notifications = $derived(data.notifications);

	let showPassword = $state(false);
	let notifEnabled = $state(untrack(() => data.notifications?.enabled ?? false));

	const NOTIFICATION_DAYS = [1, 3, 7, 14, 30];
	const TIMEZONES = [
		['America/Chicago', 'Central Time'],
		['America/New_York', 'Eastern Time'],
		['America/Denver', 'Mountain Time'],
		['America/Los_Angeles', 'Pacific Time'],
		['America/Phoenix', 'Arizona Time'],
		['UTC', 'UTC']
	];
	let selectedDays = $state<number[]>(untrack(() => data.notifications?.daysBeforeList ?? [7, 3, 1]));

	function toggleDay(day: number) {
		if (selectedDays.includes(day)) {
			selectedDays = selectedDays.filter((d) => d !== day);
		} else {
			selectedDays = [...selectedDays, day].sort((a, b) => b - a);
		}
	}

	const CATEGORIES = [
		'entertainment', 'productivity', 'utilities', 'health',
		'education', 'gaming', 'news', 'cloud', 'business', 'other'
	];
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6">
		<a href="/subscriptions/{sub.id}" class="text-sm text-violet-400 hover:text-violet-300 transition-colors">← Back to {sub.name}</a>
		<h1 class="mt-2 text-2xl font-black text-slate-100">Edit Subscription</h1>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-xl bg-red-500/15 p-4 text-sm text-red-400 ring-1 ring-red-500/30">{form.error}</div>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<!-- Basic Info -->
		<section class="rounded-xl card-dark p-6">
			<h2 class="mb-5 text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Basic Info</h2>
			<div class="space-y-4">
				<div>
					<label for="name" class="mb-1.5 block text-sm font-semibold text-slate-300">Name *</label>
					<input id="name" name="name" type="text" required value={sub.name}
						class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
				</div>
				<div>
					<label for="description" class="mb-1.5 block text-sm font-semibold text-slate-300">Description</label>
					<textarea id="description" name="description" rows="2"
						class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
					>{sub.description ?? ''}</textarea>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="category" class="mb-1.5 block text-sm font-semibold text-slate-300">Category</label>
						<select id="category" name="category" class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all">
							{#each CATEGORIES as cat}
								<option value={cat} selected={sub.category === cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="website_url" class="mb-1.5 block text-sm font-semibold text-slate-300">Website URL</label>
						<input id="website_url" name="website_url" type="url" value={sub.websiteUrl ?? ''}
							class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
					</div>
				</div>
				<div>
					<label for="tag-input-field" class="mb-1.5 block text-sm font-semibold text-slate-300">Tags</label>
					<p class="mb-2 text-xs text-slate-600">Type to search or create. Press Enter or comma to add.</p>
					<TagInput allTags={data.allTags} initialNames={data.currentTagNames} />
				</div>
			</div>
		</section>

		<!-- Billing -->
		<section class="rounded-xl card-dark p-6">
			<h2 class="mb-5 text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Billing</h2>
			<div class="space-y-4">
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label for="amount" class="mb-1.5 block text-sm font-semibold text-slate-300">Amount</label>
						<input id="amount" name="amount" type="number" min="0" step="0.01" value={sub.amount ?? ''}
							class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
					</div>
					<div>
						<label for="currency" class="mb-1.5 block text-sm font-semibold text-slate-300">Currency</label>
						<select id="currency" name="currency" class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all">
							{#each ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as c}
								<option value={c} selected={sub.currency === c}>{c}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="billing_cycle" class="mb-1.5 block text-sm font-semibold text-slate-300">Billing Cycle</label>
						<select id="billing_cycle" name="billing_cycle" class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all">
							{#each [['weekly','Weekly'],['biweekly','Bi-weekly'],['monthly','Monthly'],['quarterly','Quarterly'],['biannual','Every 6 Months'],['yearly','Yearly']] as [val, label]}
								<option value={val} selected={sub.billingCycle === val}>{label}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<label for="due_date" class="mb-1.5 block text-sm font-semibold text-slate-300">Next Due Date *</label>
					<input id="due_date" name="due_date" type="date" required value={sub.dueDate}
						class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
				</div>
			</div>
		</section>

		<!-- Credentials -->
		<section class="rounded-xl card-dark p-6">
			<h2 class="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Credentials</h2>
			<p class="mb-5 text-xs text-slate-600">Passwords are encrypted at rest.</p>
			<div class="space-y-4">
				<div>
					<label for="username" class="mb-1.5 block text-sm font-semibold text-slate-300">Username / Email</label>
					<input id="username" name="username" type="text" value={credentials?.username ?? ''}
						class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
				</div>
				<div>
					<label for="password" class="mb-1.5 block text-sm font-semibold text-slate-300">Password</label>
					<div class="relative">
						<input id="password" name="password" type={showPassword ? 'text' : 'password'} value={credentials?.password ?? ''}
							class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 pr-20 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
						<button type="button" onclick={() => (showPassword = !showPassword)}
							class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-[var(--subtle-hover)] hover:text-slate-300 transition-all">
							{showPassword ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
				<div>
					<label for="notes" class="mb-1.5 block text-sm font-semibold text-slate-300">Notes</label>
					<textarea id="notes" name="notes" rows="2"
						class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
					>{credentials?.notes ?? ''}</textarea>
				</div>
			</div>
		</section>

		<!-- Notifications -->
		<section class="rounded-xl card-dark p-6">
			<div class="mb-5 flex items-center justify-between">
				<div>
					<h2 class="text-xs font-bold uppercase tracking-widest text-[var(--heading-color)]">Email Notifications</h2>
					<p class="mt-1 text-xs text-slate-600">Get reminded before this subscription renews.</p>
				</div>
				<label class="flex cursor-pointer items-center gap-2.5">
					<div class="relative">
						<input type="checkbox" name="notifications_enabled" bind:checked={notifEnabled} class="sr-only" />
						<div class="h-5 w-9 rounded-full transition-colors {notifEnabled ? 'bg-violet-600' : 'bg-[var(--subtle-strong)]'}"></div>
						<div class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {notifEnabled ? 'translate-x-4' : ''}"></div>
					</div>
					<span class="text-sm font-semibold {notifEnabled ? 'text-violet-400' : 'text-slate-500'}">{notifEnabled ? 'On' : 'Off'}</span>
				</label>
			</div>

			{#if notifEnabled}
				<div class="space-y-4">
					<div>
						<label for="notification_email" class="mb-1.5 block text-sm font-semibold text-slate-300">Notify this email</label>
						<input id="notification_email" name="notification_email" type="email" required={notifEnabled} value={notifications?.recipientEmail ?? ''}
							class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
					</div>
					<div>
						<p class="mb-2.5 text-sm font-semibold text-slate-300">Notify me this many days before:</p>
						<div class="flex flex-wrap gap-3">
							{#each NOTIFICATION_DAYS as day}
								<label class="flex cursor-pointer items-center gap-1.5">
									<input type="checkbox" name="notification_days" value={day}
										checked={selectedDays.includes(day)} onchange={() => toggleDay(day)}
										class="h-4 w-4 rounded border-violet-900/50 bg-[var(--surface)] text-violet-600 focus:ring-violet-500/20" />
									<span class="text-sm text-slate-300">{day} day{day === 1 ? '' : 's'}</span>
								</label>
							{/each}
						</div>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label for="notification_time" class="mb-1.5 block text-sm font-semibold text-slate-300">Send reminders at</label>
							<input id="notification_time" name="notification_time" type="time" value={notifications?.notifyTime ?? '08:00'} step="900"
								class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all" />
						</div>
						<div>
							<label for="notification_timezone" class="mb-1.5 block text-sm font-semibold text-slate-300">Timezone</label>
							<select id="notification_timezone" name="notification_timezone"
								class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all">
								{#each TIMEZONES as [value, label]}
									<option value={value} selected={(notifications?.timezone ?? 'America/Chicago') === value}>{label}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<div class="flex gap-3">
			<button type="submit"
				class="rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_rgba(139,92,246,0.55)] transition-all">
				Save Changes
			</button>
			<a href="/subscriptions/{sub.id}" class="rounded-xl border border-violet-900/30 bg-[var(--subtle-hover)] px-6 py-2.5 text-sm font-semibold text-slate-400 hover:bg-[var(--subtle-strong)] hover:text-slate-200 transition-all">
				Cancel
			</a>
		</div>
	</form>
</div>
