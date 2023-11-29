<script lang="ts">
	import * as devalue from 'devalue';
	import type { ComponentType } from 'svelte';
	import { SVELTE_CHUNK } from './modules.js';
	import { islandStore } from '$lib/store.js';

	/**
	 * The component to hydrate
	 */
	export let component: ComponentType;

	/**
	 * The props to pass to the component
	 */
	export let props: Record<string, unknown> = {};

	export let script: string | null = null;

	export let islandId: string | null = null;

	// Allocate an index and increment
	let idx: number;
	islandStore.update((store) => {
		idx = store[islandId!] ?? 0;

		return {
			...store,
			[islandId!]: (idx + 1) & 2147483647
		};
	});

	let fullId: string | null = null;
	$: fullId = `island-${islandId}-${idx}`;
</script>

<svelte:head>
	{#if import.meta.env.DEV}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `
			${'<scr'}ipt type="module" src="/island:lib"></script>
		`.trim()}
	{/if}
</svelte:head>
<is-land id="{fullId}" {...$$restProps}>
	<svelte:component this="{component}" />
	<template data-island>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `
			${'<scr'}ipt type="module">
				import * as component from "${script}";
				import "/${SVELTE_CHUNK}";

				const Component = Object.values(component)[0];

				new Component({
					target: document.getElementById("${fullId}"),
					props: ${devalue.uneval(props)},
					hydrate: true,
				});
			</script>
	`.trim()}
	</template>
</is-land>
