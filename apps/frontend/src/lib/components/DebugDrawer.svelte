<script>
	import { createDialog, melt } from '@melt-ui/svelte';
	import { fade, fly } from 'svelte/transition';

	const {
		elements: { trigger, overlay, content, title, description, close, portalled },
		states: { open }
	} = createDialog({
		forceVisible: true
	});
</script>

<button
	use:melt={$trigger}
	class="absolute top-4 right-4 z-50 text-magnum-700 focus:ring-magnum-400 inline-flex items-center justify-center rounded-md bg-white px-4
    py-2 leading-none font-medium shadow-lg focus:ring
    focus:outline-none"
>
	DEBUG MENU
</button>
{#if $open}
	<div class="" use:melt={$portalled}>
		<div
			use:melt={$overlay}
			class="fixed inset-0 z-50 bg-black/50"
			transition:fade={{ duration: 150 }}
		></div>
		<div
			use:melt={$content}
			class="fixed top-0 left-0 z-50 h-screen w-full max-w-[350px] bg-white p-6
            shadow-lg focus:outline-none"
			transition:fly={{
				x: -350,
				duration: 300,
				opacity: 1
			}}
		>
			<button
				use:melt={$close}
				aria-label="Close"
				class="text-magnum-800 hover:bg-magnum-100 focus:shadow-magnum-400 focus:ring-magnum-400 absolute top-[10px]
                right-[10px] inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full focus:ring-2
                focus:outline-none"
			>
				x
			</button>
			<h2 use:melt={$title} class="mb-0 text-lg font-medium text-black">Debug</h2>

		</div>
	</div>
{/if}
