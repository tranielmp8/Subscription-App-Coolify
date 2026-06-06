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

	// ── Tabs ─────────────────────────────────────────────────────────
	const CYCLE_ORDER = ['weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'yearly'];

	const allCyclesInData = $derived(
		[...new Set(data.items.map((i) => i.billingCycle))].sort(
			(a, b) => CYCLE_ORDER.indexOf(a) - CYCLE_ORDER.indexOf(b)
		)
	);

	// ── Derived filtered list ─────────────────────────────────────────
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

	// ── Helpers ───────────────────────────────────────────────────────
	function statusDot(days: number, active: boolean) {
		if (!active) return 'bg-slate-600';
		if (days < 0) return 'bg-red-500 shadow-[0_0_7px_#ef4444]';
		if (days <= 3) return 'bg-orange-500 shadow-[0_0_7px_#f97316]';
		if (days <= 7) return 'bg-amber-400 shadow-[0_0_7px_#fbbf24]';
		return 'bg-emerald-400 shadow-[0_0_7px_#34d399]';
	}

	function daysLabel(days: number) {
		if (days < 0) return `${Math.abs(days)}d overdue`;
		if (days === 0) return 'Due today';
		if (days === 1) return 'Due tomorrow';
		return `${days}d away`;
	}

	function daysColor(days: number, active: boolean) {
		if (!active) return 'text-slate-600';
		if (days < 0) return 'text-red-400 font-semibold';
		if (days <= 3) return 'text-orange-400 font-semibold';
		if (days <= 7) return 'text-amber-400';
		return 'text-slate-600';
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
			<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="search"
				placeholder="Search subscriptions…"
				bind:value={searchQuery}
				class="w-full rounded-xl border border-violet-900/30 bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
			/>
		</div>
		<a
			href="/subscriptions/new"
			class="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_rgba(139,92,246,0.55)] transition-all"
		>
			+ Add
		</a>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="relative overflow-hidden rounded-xl card-dark p-4 glow-violet">
			<div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-violet-400"></div>
			<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Monthly Est.</p>
			<p class="mt-2 text-2xl font-black gradient-text">${data.stats.totalMonthly.toFixed(2)}</p>
		</div>
		<div class="relative overflow-hidden rounded-xl card-dark p-4 glow-cyan">
			<div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
			<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Active</p>
			<p class="mt-2 text-2xl font-black text-cyan-300">{data.stats.totalActive}</p>
		</div>
		<div class="relative overflow-hidden rounded-xl card-dark p-4 {data.stats.dueSoon > 0 ? 'glow-amber' : ''}">
			<div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 to-amber-400"></div>
			<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Due This Week</p>
			<p class="mt-2 text-2xl font-black {data.stats.dueSoon > 0 ? 'text-amber-300' : 'text-slate-300'}">{data.stats.dueSoon}</p>
		</div>
		<div class="relative overflow-hidden rounded-xl card-dark p-4 {data.stats.overdue > 0 ? 'glow-red' : ''}">
			<div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-red-400"></div>
			<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Overdue</p>
			<p class="mt-2 text-2xl font-black {data.stats.overdue > 0 ? 'text-red-400' : 'text-slate-300'}">{data.stats.overdue}</p>
		</div>
	</div>

	<!-- Billing cycle tabs — underline indicator style -->
	<div class="overflow-x-auto">
		<div class="flex border-b border-violet-900/20 w-max min-w-full">
			<button
				onclick={() => (selectedCycle = 'all')}
				class="relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap
					{selectedCycle === 'all' ? 'text-[var(--accent-2)]' : 'text-slate-500 hover:text-slate-300'}"
			>
				All
				<span class="rounded-full px-1.5 py-0.5 text-xs font-bold
					{selectedCycle === 'all'
						? 'bg-violet-500/20 text-[var(--accent-2)]'
						: 'bg-[var(--subtle-hover)] text-slate-500'}">
					{data.items.length}
				</span>
				{#if selectedCycle === 'all'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_4px_rgba(139,92,246,0.7)]"></div>
				{/if}
			</button>
			{#each allCyclesInData as cycle}
				<button
					onclick={() => (selectedCycle = cycle)}
					class="relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap
						{selectedCycle === cycle ? 'text-[var(--accent-2)]' : 'text-slate-500 hover:text-slate-300'}"
				>
					{CYCLE_LABELS[cycle] ?? cycle}
					{#if tabTotal(cycle)}
						<span class="text-xs font-medium {selectedCycle === cycle ? 'text-slate-400' : 'text-slate-600'}">
							{tabTotal(cycle)}
						</span>
					{/if}
					{#if selectedCycle === cycle}
						<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_4px_rgba(139,92,246,0.7)]"></div>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Filter row: status + active tag pills -->
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-xs font-semibold uppercase tracking-widest text-slate-600">Status:</span>
		{#each [['all','All'],['active','Active'],['overdue','Overdue'],['due_soon','Due Soon'],['inactive','Inactive']] as [val, label]}
			<button
				onclick={() => (selectedStatus = val)}
				class="rounded-full px-3 py-1 text-xs font-semibold transition-all
					{selectedStatus === val
						? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/40 shadow-[0_0_8px_rgba(139,92,246,0.2)]'
						: 'bg-[var(--subtle-hover)] text-slate-500 hover:text-slate-300'}"
			>
				{label}
			</button>
		{/each}

		{#if activeTagNames.length > 0}
			<span class="ml-2 text-xs font-semibold uppercase tracking-widest text-slate-600">Tags:</span>
			{#each activeTagNames as name}
				<button
					onclick={() => toggleTagFilter(name)}
					class="flex items-center gap-1 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400 ring-1 ring-violet-500/35 hover:bg-violet-500/30 transition-all"
				>
					{name}<span class="leading-none">×</span>
				</button>
			{/each}
			<button
				onclick={() => (activeTagNames = [])}
				class="text-xs text-slate-600 hover:text-slate-400 transition-colors"
			>
				Clear all
			</button>
		{/if}
	</div>

	<!-- Subscription list -->
	<div class="rounded-xl card-dark overflow-hidden">
		<div class="flex items-center justify-between border-b border-violet-900/20 px-5 py-3.5">
			<div class="flex items-center gap-3">
				<h2 class="text-sm font-bold text-slate-200">
					{selectedCycle === 'all' ? 'All Subscriptions' : (CYCLE_LABELS[selectedCycle] ?? selectedCycle) + ' Subscriptions'}
				</h2>
				<span class="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-400 ring-1 ring-violet-500/30">{filteredItems.length}</span>
			</div>
			{#if filteredTotal > 0}
				<span class="text-sm font-bold gradient-text">
					${filteredTotal.toFixed(2)}{selectedCycle !== 'all' ? (CYCLE_PERIOD[selectedCycle] ?? '') : ' /mo equiv.'}
				</span>
			{/if}
		</div>

		{#if filteredItems.length === 0}
			<div class="px-6 py-14 text-center">
				<p class="text-slate-600 text-sm">
					{searchQuery || activeTagNames.length || selectedStatus !== 'all' || selectedCycle !== 'all'
						? 'No subscriptions match your filters.'
						: 'No subscriptions yet.'}
				</p>
				{#if !searchQuery && !activeTagNames.length && selectedStatus === 'all' && selectedCycle === 'all'}
					<a href="/subscriptions/new" class="mt-3 inline-block text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
						Add your first subscription →
					</a>
				{/if}
			</div>
		{:else}
			<ul class="divide-y divide-violet-900/15">
				{#each filteredItems as item}
					<li class="flex items-start gap-3 px-5 py-4 hover:bg-[var(--subtle)] transition-colors">
						<div class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full {statusDot(item.daysUntil, item.isActive)}"></div>

						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="font-semibold text-slate-100">{item.name}</span>
								{#if item.category}
									<span class="rounded-full px-2 py-0.5 text-xs font-medium {CATEGORY_COLORS[item.category] ?? 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30'}">
										{item.category}
									</span>
								{/if}
								{#each item.tags as tag}
									<button
										onclick={() => toggleTagFilter(tag.name)}
										class="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 {tagColorClass(tag.color)}
											{activeTagNames.includes(tag.name) ? 'ring-1 ring-offset-1 ring-offset-[var(--surface)] ring-current' : ''}"
										title="Filter by {tag.name}"
									>
										{tag.name}
									</button>
								{/each}
								{#if !item.isActive}
									<span class="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-600/30">inactive</span>
								{/if}
							</div>
							<div class="mt-0.5 flex flex-wrap gap-x-3 text-sm">
								{#if item.amount}
									<span class="font-bold text-violet-300">
										${parseFloat(item.amount).toFixed(2)}{CYCLE_PERIOD[item.billingCycle] ?? ''}
									</span>
								{/if}
								<span class="text-slate-600">
									Due {new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
								</span>
								<span class={daysColor(item.daysUntil, item.isActive)}>
									{daysLabel(item.daysUntil)}
								</span>
							</div>
						</div>

						<div class="flex shrink-0 gap-1">
							<a href="/subscriptions/{item.id}" class="rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-400 ring-1 ring-violet-500/30 hover:bg-violet-500/25 transition-all">View</a>
							<a href="/subscriptions/{item.id}/edit" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-[var(--subtle-hover)] hover:text-slate-300 transition-all">Edit</a>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
