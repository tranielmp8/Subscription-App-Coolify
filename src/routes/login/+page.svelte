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

		if (!response.ok) {
			throw new Error(payload.message ?? 'Request failed');
		}

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
		} finally {
			submitting = false;
		}
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
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
	<div class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<div class="mb-6">
			<div
				class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600"
			>
				<span class="text-sm font-bold text-white">P</span>
			</div>
			<h1 class="text-2xl font-bold text-gray-900">Sign in or create account</h1>
			<p class="mt-1 text-sm text-gray-500">
				{isVerifyStep
					? `Enter the 6-digit code sent to ${email}.`
					: 'Use your email to get a secure verification code. New emails are created automatically after verification.'}
			</p>
		</div>

		{#if message}
			<div
				class="mb-4 rounded-lg px-3 py-2 text-sm {messageType === 'success'
					? 'bg-emerald-50 text-emerald-700'
					: 'bg-red-50 text-red-700'}"
			>
				{message}
			</div>
		{/if}

		{#if isVerifyStep}
			<form
				onsubmit={(event) => {
					event.preventDefault();
					void verifyCode();
				}}
				class="space-y-4"
			>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Verification code</span>
					<input
						bind:value={otp}
						inputmode="numeric"
						autocomplete="one-time-code"
						maxlength="6"
						required
						class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-2xl font-semibold tracking-[0.35em] text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
					/>
				</label>

				<p class="text-xs text-gray-500">Code expires in {displayedCodeExpiresIn} seconds.</p>

				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submitting ? 'Verifying...' : 'Verify and continue'}
				</button>
			</form>

			<form
				onsubmit={(event) => {
					event.preventDefault();
					void sendCode();
				}}
				class="mt-3"
			>
				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submitting ? 'Sending...' : 'Send a new code'}
				</button>
			</form>
		{:else}
			<form
				onsubmit={(event) => {
					event.preventDefault();
					void sendCode();
				}}
				class="space-y-4"
			>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
					<input
						type="email"
						bind:value={email}
						autocomplete="email"
						required
						class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700"
						>Name <span class="text-gray-400">(optional)</span></span
					>
					<input
						bind:value={name}
						autocomplete="name"
						class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
					/>
				</label>

				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submitting ? 'Sending...' : 'Email me a code'}
				</button>
			</form>
		{/if}
	</div>
</div>
