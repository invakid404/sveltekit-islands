import { writable } from 'svelte/store';

// Store an index per island id in order to deal with multiple uses of the
// same island in a single page.
export const islandStore = writable<{ [id: string]: number }>({});
