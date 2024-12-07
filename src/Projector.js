import {Camera, Vector2, Vector4, Matrix4, Vector3} from 'another-webgpu';

// https://stackoverflow.com/questions/7692988/opengl-math-projecting-screen-space-to-world-space-coords

class Projector {
	constructor(camera = new Camera(), element = document.createElement('')) {
		const clipSpaceToWorld = new Vector4();

		this.viewProjectionInverseSnapshot = new Matrix4();

		this.applyIntersect = (
			clientX = 0,
			clientY = 0,
			depth = 0,
			dst = new Vector3(),
		) => {
			const rect = element.getBoundingClientRect();
			// the code below could be simplified
			// need to find the correct inverse-matrix to use to skip all the excessive math
			// maybe just use projectionMatrix only
			clipSpaceToWorld.x = 2 * ((clientX - rect.left) / rect.width - 0.5);
			clipSpaceToWorld.y = -2 * ((clientY - rect.top) / rect.height - 0.5);
			clipSpaceToWorld.z = depth;
			clipSpaceToWorld.w = 1;

			// no const, the matrix should be initialized once in the constructor
			clipSpaceToWorld.applyMatrix4(this.viewProjectionInverseSnapshot);
			clipSpaceToWorld.w = 1 / clipSpaceToWorld.w; // should be simplified to /=w
			dst.x = clipSpaceToWorld.x * clipSpaceToWorld.w;
			dst.y = clipSpaceToWorld.y * clipSpaceToWorld.w;
			dst.z = clipSpaceToWorld.z * clipSpaceToWorld.w;
		};

		this.updateView = () => {
			this.viewProjectionInverseSnapshot
				.copy(camera.viewProjectionMatrix)
				.inverse();
		};

		Object.defineProperties(this, {
			applyIntersect: {writable: false},
			updateView: {writable: false},
			viewProjectionInverseSnapshot: {writable: false},
		});
	}
}

export {Projector};
