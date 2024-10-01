# sveltekit-islands

Vite plugin and Svelte preprocessor designed to seamlessly integrate the Islands architecture into
SvelteKit applications.

## What are Islands?

The islands architecture is a rendering pattern, which encourages small, focused chunks of
interactivity within server-rendered web pages. The output of islands is progressively enhanced
HTML, with more specificity around how the enhancement occurs. Rather than a single application
being in control of full-page rendering, there are multiple entry points. The script for these
"islands" of interactivity can be delivered and hydrated independently, allowing the rest of the
page to be just static HTML.

For more information, check out the detailed explanation on
[patterns.dev](https://www.patterns.dev/vanilla/islands-architecture).

## Installation

```bash
npm i sveltekit-islands
```

## Usage

First, for the plugin to work correctly (and for its usage to make sense in the first place), you
must enable `prerender` and disable `csr` globally. To do this, add these two lines to your global
layout:

```ts
// src/routes/+layout.server.(js|ts)

export const prerender = true;
export const csr = false;
```

Second, you must add the Vite plugin to your Vite config and the Svelte preprocessor to your Svelte
config. Additionally, you must pass `{ script: true }` to `vitePreprocess`:

```ts
// vite.config.(js|ts)
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { islandsPlugin } from 'sveltekit-islands/plugin';

export default defineConfig({
	plugins: [sveltekit(), islandsPlugin()]
});
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { islandsPreprocessor } from 'sveltekit-islands/preprocessor';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess({ script: true }), islandsPreprocessor()],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: true
		})
	}
};
```

> [!WARNING]  
> Currently, only the static adapter is officially supported and known to be working. Feel free to
> open an issue if your adapter of choice doesn't work.

You're now ready to go!

To create an island, use the `Island` component:

```svelte
<Island
	component="{YourComponent}"
	props="{{ someProp: "value" }}"
	<!-- any other props -->
/>
```

Under the hood, the `Island` component makes use of
[`@11ty/is-land`](https://github.com/11ty/is-land) and forwards all props to the `is-land` element.
For more information on what props you can pass, check out their README.

## When to Use

This project makes sense for websites that are content-heavy, but are mostly static and require
little interactivity sprinkled in, like landing pages, blogs, etc.

I initially hacked this together for use in [my blog](https://invak.id), where each blog post is
parsed from Markdown, turned into tokens and rendered to HTML via a bunch of Svelte components. I
didn't want to have client-side rendering enabled, as there is no reason for it. The content is
fully static, and having client-side rendering would just affect the performance negatively, but I
still wanted to add some small elements that would require client-side JS, like the copy button on
the code blocks, or [Turbo](https://turbo.hotwired.dev) for improving the browsing experience for
people who browse it with JavaScript enabled.

Instead of inlining script tags in the HTML for interactivity and writing plain old vanilla
JavaScript, this project allows you to use Svelte components for that, mounted specifically where
and when they're needed, which in my opinion is a much better experience.

## Acknowledgements

As mentioned earlier, this project makes use of [`@11ty/is-land`](https://github.com/11ty/is-land)
for the actual islands.

This project is also heavily inspired by
[Geoff Rich's blog post](https://geoffrich.net/posts/sveltekit-is-land/) on the topic, in which he
demonstrates the basic idea. I took it a notch further by making it completely seamless.
