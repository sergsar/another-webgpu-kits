import terser from '@rollup/plugin-terser';
import MagicString from 'magic-string';
import nodeResolve from '@rollup/plugin-node-resolve';

function header() {
	return {
		renderChunk(code) {
			code = new MagicString(code);

			code.prepend(`/**
 * @license
 * Copyright 2024 another-webgpu-kits
 * SPDX-License-Identifier: MIT
 *
 */\n`);

			return {
				code: code.toString(),
				map: code.generateMap(),
			};
		},
	};
}

const external = ['another-webgpu', 'three', 'three/examples/jsm/loaders/FBXLoader.js'];

const resolve = nodeResolve();

const builds = [
	{
		input: 'src/another-webgpu-kits.js',
		plugins: [header(), resolve],
		output: [
			{
				format: 'esm',
				file: 'build/another-webgpu-kits.module.js',
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
				file: 'build/another-webgpu-kits.module.min.js',
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
				name: 'another-webgpu-kits',
				file: 'build/another-webgpu-kits.cjs',
				indent: '\t',
			},
		],
		external,
	},
];

export default args => (args.configOnlyModule ? builds[0] : builds);
