<script lang="ts">
	import { page } from '$app/state';

	let { children, data } = $props();

	const navLinks = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/subscriptions/new', label: '+ Add Subscription' }
	];

	const accountLabel = $derived(data.user.name || data.user.email);
</script>

<div class="min-h-screen bg-gray-50">
	<header class="border-b border-gray-200 bg-white shadow-sm">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a href="/dashboard" class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600"
				>
					<span class="text-sm font-bold text-white">P</span>
				</div>
				<span class="font-semibold text-gray-900">PrideNPurpose</span>
				<span class="hidden text-gray-400 sm:inline">/ Subscriptions</span>
			</a>
			<nav class="flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-lg px-3 py-2 text-sm font-medium transition-colors
						{page.url.pathname === link.href || (link.href !== '/dashboard' && page.url.pathname.startsWith(link.href.replace('/new', '')))
							? 'bg-indigo-50 text-indigo-700'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
					>
						{link.label}
					</a>
				{/each}
				<div
					class="hidden max-w-48 truncate border-l border-gray-200 pl-3 text-sm text-gray-500 md:block"
					title={data.user.email}
				>
					{accountLabel}
				</div>
				<form method="post" action="/logout">
					<button
						type="submit"
						class="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
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
