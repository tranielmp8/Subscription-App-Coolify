const COLORS = ['blue', 'green', 'purple', 'pink', 'orange', 'cyan', 'red', 'amber', 'teal', 'indigo'] as const;
export type TagColor = (typeof COLORS)[number];

const COLOR_CLASSES: Record<string, string> = {
	blue: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
	green: 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30',
	purple: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30',
	pink: 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30',
	orange: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30',
	cyan: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30',
	red: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30',
	amber: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
	teal: 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/30',
	indigo: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
};

export function getTagColor(name: string): string {
	let hash = 0;
	for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
	return COLORS[hash % COLORS.length];
}

export function tagColorClass(color: string): string {
	return COLOR_CLASSES[color] ?? 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30';
}
