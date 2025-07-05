import terser from '@rollup/plugin-terser';
import MagicString from 'magic-string';
import nodeResolve from '@rollup/plugin-node-resolve';
import {existsSync, rmSync} from 'fs';

const outputDir = 'build';

if (existsSync(outputDir)) {
	rmSync(outputDir, {recursive: true, force: true});
}

const year = new Date().getFullYear();

function header() {
	return {
		renderChunk(code, {isEntry}) {
			if (!isEntry) {
				return null;
			}
			code = new MagicString(code);

			code.prepend(`/**
 * @license
 * Copyright ${year} another-webgpu-kits
 * SPDX-License-Identifier: MIT
 *
 *
 * Partly inherits Three.js code - Copyright 2010-${year} Three.js Authors
 *
 */\n`);

			return {
				code: code.toString(),
				map: code.generateMap(),
			};
		},
	};
}

const external = ['another-webgpu', 'three'];

function manualChunks(id) {
	if (id.includes('node_modules')) {
		const segments = id.split('node_modules/')[1].split('/');
		return segments[0].startsWith('@')
			? `${segments[0]}-${segments[1]}`
			: segments[0];
	}
}

const resolve = nodeResolve();

const builds = [
	{
		input: 'src/another-webgpu-kits.js',
		plugins: [header(), resolve],
		output: [
			{
				format: 'esm',
				entryFileNames: '[name].module.js',
				chunkFileNames: 'chunks/vendor-[name].module.js',
				dir: outputDir,
				manualChunks,
			},
		],
		external,
	},
	{
		input: 'src/another-webgpu-kits.js',
		plugins: [header(), terser(), resolve],
		output: [
			{
				format: 'esm',
				entryFileNames: '[name].module.min.js',
				chunkFileNames: 'chunks/vendor-[name].module.min.js',
				dir: outputDir,
				manualChunks,
			},
		],
		external,
	},
	{
		input: 'src/another-webgpu-kits.js',
		plugins: [header(), resolve],
		output: [
			{
				format: 'cjs',
				entryFileNames: '[name].cjs',
				chunkFileNames: 'chunks/vendor-[name].cjs',
				dir: outputDir,
				indent: '\t',
				manualChunks,
			},
		],
		external,
	},
];

export default args => (args.configOnlyModule ? builds[0] : builds);
