<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { children, data } = $props();

	const navLinks = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/subscriptions/new', label: '+ Add Subscription' }
	];

	const accountLabel = $derived(data.user.name || data.user.email);
	let isDark = $state(true);

	onMount(() => {
		isDark = (localStorage.getItem('theme') ?? 'dark') === 'dark';
	});

	function toggleTheme() {
		isDark = !isDark;
		const theme = isDark ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<div class="min-h-screen bg-game">
	<header
		class="sticky top-0 z-50 border-b border-violet-900/30 bg-[var(--header-bg)] backdrop-blur-md shadow-[0_1px_0_rgba(139,92,246,0.15)]"
	>
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a href="/dashboard" class="flex items-center gap-2.5">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-[0_0_14px_rgba(139,92,246,0.5)]"
				>
					<span class="text-sm font-black text-white">P</span>
				</div>
				<div class="hidden sm:block">
					<span class="gradient-text font-bold text-base tracking-wide">PrideNPurpose</span>
					<span class="text-slate-600 text-sm"> / Subscriptions</span>
				</div>
			</a>

			<nav class="flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200
						{page.url.pathname === link.href || (link.href !== '/dashboard' && page.url.pathname.startsWith(link.href.replace('/new', '')))
							? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/35 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
							: 'text-slate-500 hover:text-slate-300 hover:bg-[var(--subtle-hover)]'}"
					>
						{link.label}
					</a>
				{/each}

				<!-- Light / dark toggle -->
				<button
					onclick={toggleTheme}
					class="rounded-lg p-2 text-slate-500 transition-all hover:bg-[var(--subtle-hover)] hover:text-slate-300"
					title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
					aria-label="Toggle theme"
				>
					{#if isDark}
						<!-- Sun -->
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z" />
						</svg>
					{:else}
						<!-- Moon -->
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
						</svg>
					{/if}
				</button>

				<div class="hidden md:flex items-center gap-2 ml-1 pl-3 border-l border-[var(--divider)]">
					<div class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]"></div>
					<span class="max-w-40 truncate text-xs text-slate-400" title={data.user.email}>
						{accountLabel}
					</span>
				</div>

				<form method="post" action="/logout">
					<button
						type="submit"
						class="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-[var(--subtle-hover)] hover:text-slate-300"
						title={data.user.email}
					>
						Sign out
					</button>
				</form>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8">
		{@render children()}
	</main>
</div>
