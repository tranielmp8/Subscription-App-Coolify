<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let step = $state<'email' | 'verify'>('email');
	let email = $state('');
	let name = $state('');
	let otp = $state('');
	let message = $state('');
	let messageType = $state<'success' | 'error'>('success');
	let codeExpiresIn = $state<number | null>(null);
	let submitting = $state(false);

	const isVerifyStep = $derived(step === 'verify');
	const displayedCodeExpiresIn = $derived(codeExpiresIn ?? data.codeExpiresIn);

	async function postJson(url: string, body: Record<string, string>) {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(payload.message ?? 'Request failed');
		return payload;
	}

	async function sendCode() {
		submitting = true;
		message = '';
		try {
			const result = await postJson('/api/login/send-code', { email, name });
			codeExpiresIn = result.codeExpiresIn ?? data.codeExpiresIn;
			message = result.message ?? `Code sent to ${email}`;
			messageType = 'success';
			step = 'verify';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Could not send verification code';
			messageType = 'error';
		} finally { submitting = false; }
	}

	async function verifyCode() {
		submitting = true;
		message = '';
		try {
			await postJson('/api/login/verify-code', { email, name, otp });
			window.location.href = '/dashboard';
		} catch (error) {
			message = error instanceof Error ? error.message : 'Invalid or expired code';
			messageType = 'error';
		} finally { submitting = false; }
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-game px-4 py-12">
	<div class="w-full max-w-md">
		<div class="rounded-2xl card-dark p-8 shadow-[0_0_40px_rgba(139,92,246,0.15),0_0_0_1px_rgba(139,92,246,0.2)]">
			<div class="mb-7">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-[0_0_18px_rgba(139,92,246,0.55)]">
					<span class="text-lg font-black text-white">P</span>
				</div>
				<h1 class="text-2xl font-black text-slate-100">
					{isVerifyStep ? 'Enter your code' : 'Welcome back'}
				</h1>
				<p class="mt-1.5 text-sm text-slate-500">
					{isVerifyStep
						? `Enter the 6-digit code sent to ${email}.`
						: 'Use your email to get a secure verification code. New accounts are created automatically.'}
				</p>
			</div>

			{#if message}
				<div class="mb-5 rounded-xl px-4 py-3 text-sm font-medium {messageType === 'success'
					? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
					: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'}">
					{message}
				</div>
			{/if}

			{#if isVerifyStep}
				<form onsubmit={(e) => { e.preventDefault(); void verifyCode(); }} class="space-y-4">
					<label class="block">
						<span class="mb-1.5 block text-sm font-semibold text-slate-300">Verification code</span>
						<input
							bind:value={otp}
							inputmode="numeric"
							autocomplete="one-time-code"
							maxlength="6"
							required
							class="w-full rounded-xl border border-violet-900/40 bg-[var(--surface)] px-3 py-3 text-center text-2xl font-black tracking-[0.35em] text-slate-100 placeholder:text-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
						/>
					</label>
					<p class="text-xs text-slate-600">Code expires in {displayedCodeExpiresIn} seconds.</p>
					<button type="submit" disabled={submitting}
						class="w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-3 text-sm font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_rgba(139,92,246,0.55)] transition-all disabled:cursor-not-allowed disabled:opacity-50">
						{submitting ? 'Verifying…' : 'Verify and continue'}
					</button>
				</form>
				<form onsubmit={(e) => { e.preventDefault(); void sendCode(); }} class="mt-3">
					<button type="submit" disabled={submitting}
						class="w-full rounded-xl border border-violet-900/30 bg-[var(--subtle-hover)] px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-[var(--subtle-strong)] hover:text-slate-200 transition-all disabled:cursor-not-allowed disabled:opacity-50">
						{submitting ? 'Sending…' : 'Send a new code'}
					</button>
				</form>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); void sendCode(); }} class="space-y-4">
					<label class="block">
						<span class="mb-1.5 block text-sm font-semibold text-slate-300">Email</span>
						<input
							type="email"
							bind:value={email}
							autocomplete="email"
							required
							class="w-full rounded-xl border border-violet-900/40 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
						/>
					</label>
					<label class="block">
						<span class="mb-1.5 block text-sm font-semibold text-slate-300">
							Name <span class="font-normal text-slate-600">(optional)</span>
						</span>
						<input
							bind:value={name}
							autocomplete="name"
							class="w-full rounded-xl border border-violet-900/40 bg-[var(--surface)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
						/>
					</label>
					<button type="submit" disabled={submitting}
						class="w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-3 text-sm font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_rgba(139,92,246,0.55)] transition-all disabled:cursor-not-allowed disabled:opacity-50">
						{submitting ? 'Sending…' : 'Email me a code'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
