import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			alias: {
				$lib: 'src/lib',
				'$lib/*': 'src/lib/*'
			},
			paths: {
				base: '/gobudibase'
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: true,
				strict: false
			})
		})
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:8085',
				changeOrigin: true
			}
		}
	}
});
