<script lang="ts">
	import { tagColorClass } from '$lib/utils/tags';

	let { data } = $props();

	// ── Filter state ──────────────────────────────────────────────────
	let searchQuery = $state('');
	let selectedCycle = $state('all');
	let selectedStatus = $state('all');
	let activeTagNames = $state<string[]>([]);

	// ── Constants ────────────────────────────────────────────────────
	const CYCLE_LABELS: Record<string, string> = {
		weekly: 'Weekly',
		biweekly: 'Bi-weekly',
		monthly: 'Monthly',
		quarterly: 'Quarterly',
		biannual: 'Every 6mo',
		yearly: 'Yearly'
	};

	const CYCLE_PERIOD: Record<string, string> = {
		weekly: '/wk',
		biweekly: '/2wk',
		monthly: '/mo',
		quarterly: '/qtr',
		biannual: '/6mo',
		yearly: '/yr'
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

	// ── Tabs with totals ─────────────────────────────────────────────
	const allCyclesInData = $derived(
		[...new Set(data.items.map((i) => i.billingCycle))].sort(
			(a, b) => CYCLE_ORDER.indexOf(a) - CYCLE_ORDER.indexOf(b)
		)
	);

	const CYCLE_ORDER = ['weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'yearly'];

	// ── Derived filtered list ────────────────────────────────────────
	let filteredItems = $derived.by(() => {
		let result = data.items;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter((i) => i.name.toLowerCase().includes(q));
		}

		if (selectedCycle !== 'all') {
			result = result.filter((i) => i.billingCycle === selectedCycle);
		}

		if (selectedStatus !== 'all') {
			if (selectedStatus === 'active') result = result.filter((i) => i.isActive && i.daysUntil >= 0);
			else if (selectedStatus === 'overdue') result = result.filter((i) => i.isActive && i.daysUntil < 0);
			else if (selectedStatus === 'due_soon') result = result.filter((i) => i.isActive && i.daysUntil >= 0 && i.daysUntil <= 7);
			else if (selectedStatus === 'inactive') result = result.filter((i) => !i.isActive);
		}

		if (activeTagNames.length > 0) {
			result = result.filter((i) =>
				activeTagNames.some((name) => i.tags.some((t) => t.name === name))
			);
		}

		return result;
	});

	let filteredTotal = $derived(
		filteredItems
			.filter((i) => i.isActive && i.amount)
			.reduce((sum, i) => sum + parseFloat(i.amount!), 0)
	);

	// ── Helpers ──────────────────────────────────────────────────────
	function statusDot(days: number, active: boolean) {
		if (!active) return 'bg-gray-300';
		if (days < 0) return 'bg-red-500';
		if (days <= 3) return 'bg-orange-500';
		if (days <= 7) return 'bg-amber-400';
		return 'bg-emerald-400';
	}

	function daysLabel(days: number) {
		if (days < 0) return `${Math.abs(days)}d overdue`;
		if (days === 0) return 'Due today';
		if (days === 1) return 'Due tomorrow';
		return `${days}d away`;
	}

	function daysColor(days: number, active: boolean) {
		if (!active) return 'text-gray-400';
		if (days < 0) return 'text-red-600 font-semibold';
		if (days <= 3) return 'text-orange-600 font-semibold';
		if (days <= 7) return 'text-amber-600';
		return 'text-gray-400';
	}

	function toggleTagFilter(name: string) {
		if (activeTagNames.includes(name)) {
			activeTagNames = activeTagNames.filter((n) => n !== name);
		} else {
			activeTagNames = [...activeTagNames, name];
		}
	}

	function tabTotal(cycle: string): string {
		const t = data.cycleTotals[cycle];
		return t ? `$${t.toFixed(2)}` : '';
	}
</script>

<div class="space-y-5">
	<!-- Search + Add -->
	<div class="flex items-center gap-3">
		<div class="relative flex-1">
			<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="search"
				placeholder="Search subscriptions…"
				bind:value={searchQuery}
				class="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
			/>
		</div>
		<a
			href="/subscriptions/new"
			class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
		>
			+ Add Subscription
		</a>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-500">Monthly Est.</p>
			<p class="mt-1 text-xl font-bold text-gray-900">${data.stats.totalMonthly.toFixed(2)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-500">Active</p>
			<p class="mt-1 text-xl font-bold text-gray-900">{data.stats.totalActive}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-500">Due This Week</p>
			<p class="mt-1 text-xl font-bold {data.stats.dueSoon > 0 ? 'text-amber-600' : 'text-gray-900'}">{data.stats.dueSoon}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-500">Overdue</p>
			<p class="mt-1 text-xl font-bold {data.stats.overdue > 0 ? 'text-red-600' : 'text-gray-900'}">{data.stats.overdue}</p>
		</div>
	</div>

	<!-- Billing cycle tabs -->
	<div class="overflow-x-auto">
		<div class="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm w-max min-w-full">
			<button
				onclick={() => (selectedCycle = 'all')}
				class="flex flex-col items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap
					{selectedCycle === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}"
			>
				<span>All</span>
				<span class="text-xs opacity-70 mt-0.5">{data.items.length} subs</span>
			</button>
			{#each allCyclesInData as cycle}
				<button
					onclick={() => (selectedCycle = cycle)}
					class="flex flex-col items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap
						{selectedCycle === cycle ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}"
				>
					<span>{CYCLE_LABELS[cycle] ?? cycle}</span>
					<span class="text-xs opacity-70 mt-0.5">{tabTotal(cycle) || '—'}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Filter row: status + active tag pills -->
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Status:</span>
		{#each [['all','All'],['active','Active'],['overdue','Overdue'],['due_soon','Due Soon'],['inactive','Inactive']] as [val, label]}
			<button
				onclick={() => (selectedStatus = val)}
				class="rounded-full px-3 py-1 text-xs font-medium transition-colors
					{selectedStatus === val ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
			>
				{label}
			</button>
		{/each}

		{#if activeTagNames.length > 0}
			<span class="ml-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Tags:</span>
			{#each activeTagNames as name}
				<button
					onclick={() => toggleTagFilter(name)}
					class="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
				>
					{name}
					<span class="leading-none">×</span>
				</button>
			{/each}
			<button
				onclick={() => (activeTagNames = [])}
				class="text-xs text-gray-400 hover:text-gray-600"
			>
				Clear all
			</button>
		{/if}
	</div>

	<!-- Subscription list -->
	<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
		<div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
			<div class="flex items-center gap-3">
				<h2 class="text-sm font-semibold text-gray-900">
					{selectedCycle === 'all' ? 'All Subscriptions' : (CYCLE_LABELS[selectedCycle] ?? selectedCycle) + ' Subscriptions'}
				</h2>
				<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{filteredItems.length}</span>
			</div>
			{#if filteredTotal > 0}
				<span class="text-sm font-semibold text-gray-700">
					${filteredTotal.toFixed(2)}{selectedCycle !== 'all' ? (CYCLE_PERIOD[selectedCycle] ?? '') : ' /mo equiv.'}
				</span>
			{/if}
		</div>

		{#if filteredItems.length === 0}
			<div class="px-6 py-14 text-center">
				<p class="text-gray-400 text-sm">
					{searchQuery || activeTagNames.length || selectedStatus !== 'all' || selectedCycle !== 'all'
						? 'No subscriptions match your filters.'
						: 'No subscriptions yet.'}
				</p>
				{#if !searchQuery && !activeTagNames.length && selectedStatus === 'all' && selectedCycle === 'all'}
					<a href="/subscriptions/new" class="mt-2 inline-block text-sm text-indigo-600 hover:underline">
						Add your first subscription →
					</a>
				{/if}
			</div>
		{:else}
			<ul class="divide-y divide-gray-100">
				{#each filteredItems as item}
					<li class="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/50">
						<div class="mt-1.5 h-2 w-2 shrink-0 rounded-full {statusDot(item.daysUntil, item.isActive)}"></div>

						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="font-medium text-gray-900">{item.name}</span>
								{#if item.category}
									<span class="rounded-full px-2 py-0.5 text-xs font-medium {CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-700'}">
										{item.category}
									</span>
								{/if}
								{#each item.tags as tag}
									<button
										onclick={() => toggleTagFilter(tag.name)}
										class="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 {tagColorClass(tag.color)}
											{activeTagNames.includes(tag.name) ? 'ring-1 ring-offset-1 ring-current' : ''}"
										title="Filter by {tag.name}"
									>
										{tag.name}
									</button>
								{/each}
								{#if !item.isActive}
									<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">inactive</span>
								{/if}
							</div>
							<div class="mt-0.5 flex flex-wrap gap-x-3 text-sm">
								{#if item.amount}
									<span class="font-medium text-gray-700">
										${parseFloat(item.amount).toFixed(2)}{CYCLE_PERIOD[item.billingCycle] ?? ''}
									</span>
								{/if}
								<span class="text-gray-400">
									Due {new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
								</span>
								<span class={daysColor(item.daysUntil, item.isActive)}>
									{daysLabel(item.daysUntil)}
								</span>
							</div>
						</div>

						<div class="flex shrink-0 gap-1">
							<a href="/subscriptions/{item.id}" class="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50">View</a>
							<a href="/subscriptions/{item.id}/edit" class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100">Edit</a>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
