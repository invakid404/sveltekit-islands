<script lang="ts">
	import * as devalue from 'devalue';
	import type { ComponentType } from 'svelte';

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
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `
		${'<scr'}ipt type="module" src="/__islands/is-land.js"></script>
	`.trim()}
</svelte:head>
<is-land id="island-{islandId}" {...$$restProps}>
	<svelte:component this="{component}" />
	<template data-island>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `
			${'<scr'}ipt type="module">
				import * as component from "${script}";

				const Component = Object.values(component)[0];

				new Component({
					target: document.getElementById("island-${islandId}"),
					props: ${devalue.uneval(props)},
					hydrate: true,
				});
			</script>
	`.trim()}
	</template>
</is-land>
