import {Camera, Vector2, Vector4, Matrix4, Vector3} from 'another-webgpu';

// https://stackoverflow.com/questions/7692988/opengl-math-projecting-screen-space-to-world-space-coords

class Projector {
	constructor(camera = new Camera(), element = document.createElement('')) {
		Object.defineProperties(this, {
			camera: {value: camera},
			element: {value: element},
			screen: {value: new Vector2()},
			clipSpaceToWorld: {value: new Vector4()},
			viewProjectionInverseSnapshot: {value: new Matrix4()},
		});
	}
	applyIntersect(clientX = 0, clientY = 0, depth = 0, dst = new Vector3()) {
		const rect = this.element.getBoundingClientRect();
		// the code below could be simplified
		// need to find the correct inverse-matrix to use to skip all the excessive math
		// maybe just use projectionMatrix only
		this.clipSpaceToWorld.x = 2 * ((clientX - rect.left) / rect.width - 0.5);
		this.clipSpaceToWorld.y = -2 * ((clientY - rect.top) / rect.height - 0.5);
		this.clipSpaceToWorld.z = depth;
		this.clipSpaceToWorld.w = 1;

		// no const, the matrix should be initialized once in the constructor
		this.clipSpaceToWorld.applyMatrix4(this.viewProjectionInverseSnapshot);
		this.clipSpaceToWorld.w = 1 / this.clipSpaceToWorld.w; // should be simplified to /=w
		dst.x = this.clipSpaceToWorld.x * this.clipSpaceToWorld.w;
		dst.y = this.clipSpaceToWorld.y * this.clipSpaceToWorld.w;
		dst.z = this.clipSpaceToWorld.z * this.clipSpaceToWorld.w;
	}

	updateView() {
		this.viewProjectionInverseSnapshot
			.copy(this.camera.viewProjectionMatrix)
			.inverse();
	}
}

export {Projector};
