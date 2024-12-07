import {Camera, Vector2} from 'another-webgpu';

class DepthHelper {
	constructor(camera = new Camera(), element = document.createElement('')) {
		const screen = new Vector2();

		this.getDepth = (x = 0, y = 0) => {
			const rect = element.getBoundingClientRect();
			screen.x = Math.round(x - rect.left);
			screen.y = Math.round(y - rect.top);
			if (!camera.depthBuffer) {
				return 1;
			}
			return camera.depthBuffer[screen.y * element.width + screen.x] || 1;
		};
	}
}

export {DepthHelper};
