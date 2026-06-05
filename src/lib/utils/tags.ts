const COLORS = ['blue', 'green', 'purple', 'pink', 'orange', 'cyan', 'red', 'amber', 'teal', 'indigo'] as const;
export type TagColor = (typeof COLORS)[number];

const COLOR_CLASSES: Record<string, string> = {
	blue: 'bg-blue-100 text-blue-700',
	green: 'bg-green-100 text-green-700',
	purple: 'bg-purple-100 text-purple-700',
	pink: 'bg-pink-100 text-pink-700',
	orange: 'bg-orange-100 text-orange-700',
	cyan: 'bg-cyan-100 text-cyan-700',
	red: 'bg-red-100 text-red-700',
	amber: 'bg-amber-100 text-amber-700',
	teal: 'bg-teal-100 text-teal-700',
	indigo: 'bg-indigo-100 text-indigo-700'
};

export function getTagColor(name: string): string {
	let hash = 0;
	for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
	return COLORS[hash % COLORS.length];
}

export function tagColorClass(color: string): string {
	return COLOR_CLASSES[color] ?? 'bg-gray-100 text-gray-700';
}
