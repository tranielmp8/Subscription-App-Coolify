<script lang="ts">
	import { untrack } from 'svelte';
	import { tagColorClass } from '$lib/utils/tags';

	interface Tag { id: string; name: string; color: string; }

	let { allTags = [], initialNames = [] }: { allTags: Tag[]; initialNames: string[] } = $props();

	let selected = $state<string[]>(untrack(() => [...initialNames]));
	let inputValue = $state('');
	let focused = $state(false);
	let highlightIndex = $state(-1);

	let suggestions = $derived(
		allTags
			.filter((t) => !selected.includes(t.name))
			.filter((t) => t.name.toLowerCase().includes(inputValue.toLowerCase().trim()))
	);

	let canCreate = $derived(
		inputValue.trim().length > 0 &&
			!allTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()) &&
			!selected.some((n) => n.toLowerCase() === inputValue.trim().toLowerCase())
	);

	let showDropdown = $derived(
		(focused && (suggestions.length > 0 || canCreate) && inputValue.trim().length > 0) ||
		(focused && suggestions.length > 0)
	);

	function add(name: string) {
		const t = name.trim();
		if (!t || selected.some((n) => n.toLowerCase() === t.toLowerCase())) return;
		selected = [...selected, t];
		inputValue = '';
		highlightIndex = -1;
	}

	function remove(name: string) { selected = selected.filter((n) => n !== name); }

	function onkeydown(e: KeyboardEvent) {
		const totalOptions = suggestions.length + (canCreate ? 1 : 0);
		if (e.key === 'ArrowDown') { e.preventDefault(); highlightIndex = Math.min(highlightIndex + 1, totalOptions - 1); }
		else if (e.key === 'ArrowUp') { e.preventDefault(); highlightIndex = Math.max(highlightIndex - 1, -1); }
		else if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightIndex >= 0 && highlightIndex < suggestions.length) add(suggestions[highlightIndex].name);
			else if (highlightIndex === suggestions.length && canCreate) add(inputValue);
			else if (inputValue.trim()) add(inputValue);
		} else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
			selected = selected.slice(0, -1);
		} else if (e.key === 'Escape') { focused = false; }
		else if (e.key === ',') { e.preventDefault(); if (inputValue.trim()) add(inputValue); }
	}

	function getColorClass(name: string): string {
		const found = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
		return found ? tagColorClass(found.color) : 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30';
	}
</script>

{#each selected as name}
	<input type="hidden" name="tag_names" value={name} />
{/each}

<div class="relative">
	<div
		role="none"
		class="flex min-h-[42px] flex-wrap gap-1.5 rounded-xl border border-violet-900/30 bg-[var(--surface)] px-2 py-1.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 cursor-text transition-all"
		onclick={() => document.getElementById('tag-input-field')?.focus()}
	>
		{#each selected as name}
			<span class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {getColorClass(name)}">
				{name}
				<button type="button" onclick={(e) => { e.stopPropagation(); remove(name); }}
					aria-label="Remove {name}" class="hover:opacity-70 leading-none">×</button>
			</span>
		{/each}
		<input
			id="tag-input-field"
			type="text"
			bind:value={inputValue}
			onfocus={() => { focused = true; highlightIndex = -1; }}
			onblur={() => setTimeout(() => (focused = false), 150)}
			{onkeydown}
			oninput={() => (highlightIndex = -1)}
			placeholder={selected.length === 0 ? 'Type to add or create tags…' : ''}
			autocomplete="off"
			class="min-w-[140px] flex-1 border-none bg-transparent py-0.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
		/>
	</div>

	{#if showDropdown}
		<div
			role="listbox"
			class="absolute top-full left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-violet-900/30 bg-[var(--surface)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
		>
			{#each suggestions as tag, i}
				<button type="button" role="option" aria-selected={i === highlightIndex}
					onmousedown={() => add(tag.name)}
					class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--subtle-hover)] {i === highlightIndex ? 'bg-[var(--subtle-hover)]' : ''}">
					<span class="rounded-full px-2 py-0.5 text-xs font-medium {tagColorClass(tag.color)}">{tag.name}</span>
				</button>
			{/each}
			{#if canCreate}
				<button type="button" role="option" aria-selected={highlightIndex === suggestions.length}
					onmousedown={() => add(inputValue)}
					class="flex w-full items-center gap-2 border-t border-violet-900/20 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--subtle-hover)] {highlightIndex === suggestions.length ? 'bg-[var(--subtle-hover)]' : ''}">
					<span class="text-xs text-slate-500">Create</span>
					<span class="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30">"{inputValue.trim()}"</span>
				</button>
			{/if}
		</div>
	{/if}
</div>
