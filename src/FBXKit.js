import {FileLoader} from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';

class FBXKit {
	/** @returns {unknown} **/
	static async loadFbxTree(url = '') {
		const fileLoader = new FileLoader();
		fileLoader.setResponseType('arraybuffer');
		const buffer = await fileLoader.loadAsync(url);
		const fbxLoader = new FBXLoader();
		fbxLoader.parse(buffer, '');
		return fbxLoader.fbxTree;
	}
}

export {FBXKit};
