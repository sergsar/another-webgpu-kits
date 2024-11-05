import {Camera} from 'another-webgpu';

class DepthHelper {
	constructor(camera = new Camera(), element = document.createElement('')) {
		this.getDepth = (x = 0, y = 0) => {
			const rect = element.getBoundingClientRect();
			screen.x = Math.round(x - rect.left);
			screen.y = Math.round(y - rect.top);
			return camera.depthBuffer[screenY * element.width + screenX];
		};
	}
}

export {DepthHelper};
