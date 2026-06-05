<script lang="ts">
	import { enhance } from '$app/forms';
	import TagInput from '$lib/components/TagInput.svelte';

	let { data, form } = $props();
	let showPassword = $state(false);
	let notifEnabled = $state(false);

	const CATEGORIES = [
		'entertainment', 'productivity', 'utilities', 'health',
		'education', 'gaming', 'news', 'cloud', 'business', 'other'
	];

	const NOTIFICATION_DAYS = [1, 3, 7, 14, 30];
	const TIMEZONES = [
		['America/Chicago', 'Central Time'],
		['America/New_York', 'Eastern Time'],
		['America/Denver', 'Mountain Time'],
		['America/Los_Angeles', 'Pacific Time'],
		['America/Phoenix', 'Arizona Time'],
		['UTC', 'UTC']
	];
	let selectedDays = $state<number[]>([7, 3, 1]);

	function toggleDay(day: number) {
		if (selectedDays.includes(day)) {
			selectedDays = selectedDays.filter((d) => d !== day);
		} else {
			selectedDays = [...selectedDays, day].sort((a, b) => b - a);
		}
	}
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6">
		<a href="/dashboard" class="text-sm text-indigo-600 hover:underline">← Back to Dashboard</a>
		<h1 class="mt-2 text-2xl font-bold text-gray-900">Add Subscription</h1>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{form.error}</div>
	{/if}

	<form method="POST" use:enhance class="space-y-6">
		<!-- Basic Info -->
		<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Basic Info</h2>
			<div class="space-y-4">
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-gray-700">Name *</label>
					<input
						id="name" name="name" type="text" required
						placeholder="Netflix, Spotify, Adobe CC…"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					/>
				</div>
				<div>
					<label for="description" class="mb-1 block text-sm font-medium text-gray-700">Description</label>
					<textarea
						id="description" name="description" rows="2"
						placeholder="Optional notes about this subscription"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					></textarea>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="category" class="mb-1 block text-sm font-medium text-gray-700">Category</label>
						<select id="category" name="category" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
							{#each CATEGORIES as cat}
								<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="website_url" class="mb-1 block text-sm font-medium text-gray-700">Website URL</label>
						<input id="website_url" name="website_url" type="url" placeholder="https://netflix.com"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
					</div>
				</div>
				<div>
					<label for="tag-input-field" class="mb-1 block text-sm font-medium text-gray-700">Tags</label>
					<p class="mb-1.5 text-xs text-gray-400">Type to search or create. Press Enter or comma to add.</p>
					<TagInput allTags={data.allTags} initialNames={[]} />
				</div>
			</div>
		</section>

		<!-- Billing -->
		<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Billing</h2>
			<div class="space-y-4">
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label for="amount" class="mb-1 block text-sm font-medium text-gray-700">Amount</label>
						<input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="15.99"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
					</div>
					<div>
						<label for="currency" class="mb-1 block text-sm font-medium text-gray-700">Currency</label>
						<select id="currency" name="currency" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
							{#each ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as c}
								<option value={c}>{c}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="billing_cycle" class="mb-1 block text-sm font-medium text-gray-700">Billing Cycle</label>
						<select id="billing_cycle" name="billing_cycle" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
							<option value="weekly">Weekly</option>
							<option value="biweekly">Bi-weekly</option>
							<option value="monthly" selected>Monthly</option>
							<option value="quarterly">Quarterly</option>
							<option value="biannual">Every 6 Months</option>
							<option value="yearly">Yearly</option>
						</select>
					</div>
				</div>
				<div>
					<label for="due_date" class="mb-1 block text-sm font-medium text-gray-700">Next Due Date *</label>
					<input id="due_date" name="due_date" type="date" required
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
				</div>
			</div>
		</section>

		<!-- Credentials -->
		<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">Credentials</h2>
			<p class="mb-4 text-xs text-gray-400">Optional — passwords are encrypted at rest.</p>
			<div class="space-y-4">
				<div>
					<label for="username" class="mb-1 block text-sm font-medium text-gray-700">Username / Email</label>
					<input id="username" name="username" type="text" placeholder="you@example.com"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
				</div>
				<div>
					<label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
					<div class="relative">
						<input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 pr-20 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
						<button type="button" onclick={() => (showPassword = !showPassword)}
							class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
							{showPassword ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
				<div>
					<label for="notes" class="mb-1 block text-sm font-medium text-gray-700">Notes</label>
					<textarea id="notes" name="notes" rows="2" placeholder="e.g. 2-device plan, shared with family"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"></textarea>
				</div>
			</div>
		</section>

		<!-- Notifications -->
		<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Email Notifications</h2>
					<p class="mt-0.5 text-xs text-gray-400">Get reminded before this subscription renews.</p>
				</div>
				<label class="flex cursor-pointer items-center gap-2">
					<div class="relative">
						<input type="checkbox" name="notifications_enabled" bind:checked={notifEnabled} class="sr-only" />
						<div class="h-5 w-9 rounded-full transition-colors {notifEnabled ? 'bg-indigo-600' : 'bg-gray-300'}"></div>
						<div class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {notifEnabled ? 'translate-x-4' : ''}"></div>
					</div>
					<span class="text-sm text-gray-600">{notifEnabled ? 'On' : 'Off'}</span>
				</label>
			</div>
			{#if notifEnabled}
				<div class="space-y-4">
					<div>
						<label for="notification_email" class="mb-1 block text-sm font-medium text-gray-700">Notify this email</label>
						<input id="notification_email" name="notification_email" type="email" required={notifEnabled}
							placeholder="you@example.com"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
					</div>
					<div>
						<p class="mb-2 text-sm font-medium text-gray-700">Notify me this many days before:</p>
						<div class="flex flex-wrap gap-2">
							{#each NOTIFICATION_DAYS as day}
								<label class="flex cursor-pointer items-center gap-1.5">
									<input type="checkbox" name="notification_days" value={day}
										checked={selectedDays.includes(day)} onchange={() => toggleDay(day)}
										class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
									<span class="text-sm text-gray-700">{day} day{day === 1 ? '' : 's'}</span>
								</label>
							{/each}
						</div>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label for="notification_time" class="mb-1 block text-sm font-medium text-gray-700">Send reminders at</label>
							<input
								id="notification_time"
								name="notification_time"
								type="time"
								value="08:00"
								step="900"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="notification_timezone" class="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
							<select
								id="notification_timezone"
								name="notification_timezone"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
							>
								{#each TIMEZONES as [value, label]}
									<option value={value} selected={value === 'America/Chicago'}>{label}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<div class="flex gap-3">
			<button type="submit"
				class="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none">
				Save Subscription
			</button>
			<a href="/dashboard" class="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
				Cancel
			</a>
		</div>
	</form>
</div>
