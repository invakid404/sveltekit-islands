<script lang="ts">
	import * as devalue from 'devalue';
	import type { Component } from 'svelte';
	import { SVELTE_CHUNK } from './modules.js';
	import { islandStore } from '$lib/store.js';

	type Props = {
		component: Component<any>;
		props?: any
		script?: string;
		islandId?: string;
	}

	let { component: C, props = {}, script, islandId, ...rest }: Props = $props();

	// Allocate an index and increment
	let idx = $state<number>();
	islandStore.update((store) => {
		idx = store[islandId!] ?? 0;

		return {
			...store,
			[islandId!]: (idx + 1) & 2147483647
		};
	});

	let fullId = $derived(`island-${islandId}-${idx}`);
</script>

<svelte:head>
	{#if import.meta.env.DEV}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `
			${'<scr'}ipt type="module" src="/island:lib"></script>
		`.trim()}
	{/if}
</svelte:head>
<is-land id={fullId} {...rest}>
	<C {...props} />
	<template data-island>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `
			${'<scr'}ipt type="module">
				import * as Component from "${script}";
				import "/${SVELTE_CHUNK}";

				const component = Object.values(Component).find((entry) => entry != null && entry.__island != null).__island;

				component({
					target: document.getElementById("${fullId}"),
					props: ${devalue.uneval(props)},
					hydrate: true,
				});
			</script>
	`.trim()}
	</template>
</is-land>
