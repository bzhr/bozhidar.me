import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
	site: 'https://bozhidar.me',
	integrations: [mdx()],
	markdown: {
		shikiConfig: {
			theme: 'github-light',
			wrap: true
		}
	}
});