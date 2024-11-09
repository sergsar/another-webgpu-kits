import {
	Camera,
	Vector3,
	Vector2,
	Quaternion,
	UnitUtils,
	Plane,
	Ray,
} from 'another-webgpu';
import {DepthHelper} from './DepthHelper.js';
import {Projector} from './Projector.js';

class OrbitCameraControl {
	constructor({
		camera = new Camera(),
		element = document.createElement(''),
		distance = 9,
		distanceMax = 20,
		distanceMin = 3,
		theta = 0, // around y axis
		phi = 60, // around x axis
		phiMax = 180,
		phiMin = 0,
	}) {
		Object.defineProperties(this, {
			camera: {value: camera},
			element: {value: element},
			thetaStart: {value: UnitUtils.degToRad(theta), writable: true},
			phiStart: {value: UnitUtils.degToRad(phi), writable: true},
			phiMin: {value: UnitUtils.degToRad(phiMin), writable: true},
			phiMax: {value: UnitUtils.degToRad(phiMax), writable: true},
			theta: {value: 0, writable: true},
			phi: {value: 0, writable: true},
			distance: {value: distance, writable: true},
			distanceMax: {value: distanceMax, writable: true},
			distanceMin: {value: distanceMin, writable: true},
			clientStart: {value: new Vector2()},
			client: {value: new Vector2()},
			travel: {value: new Vector2()},
			quaternion: {value: new Quaternion()},
			zoomVector: {value: new Vector3(0, 1, 0)},
			button: {value: -1, writable: true},
			cameraStart: {value: new Vector3().copy(camera.position)},
			cameraTargetStart: {value: new Vector3().copy(camera.target)},
			cameraRay: {value: new Ray()},
			cameraTravel: {value: new Vector3()},
			depthSnapshot: {value: 0, writable: true},
			intersectPlane: {value: new Plane(new Vector3(0, 1, 0))},
			intersectStart: {value: new Vector3()},
			intersect: {value: new Vector3()},
			projector: {value: new Projector(camera, element)},
			depthHelper: {value: new DepthHelper(camera, element)},
			applyTransformations: {
				value: () => {
					this.quaternion.set(0, 0, 0, 1);
					this.quaternion.rotateY(this.theta);
					this.quaternion.rotateX(this.phi);
					this.zoomVector.set(0, 1, 0);
					this.zoomVector.applyQuaternion(this.quaternion);
					this.zoomVector.length = this.distance;

					this.cameraStart.add(this.cameraTravel, this.camera.position);
					this.cameraTargetStart.add(this.cameraTravel, this.camera.target);

					this.camera.target.add(this.zoomVector, this.camera.position);
				},
			},
		});

		camera.useDepth = true;

		this.maxDepth = 0.92;

		element.addEventListener('contextmenu', this.onContextMenu);

		element.addEventListener('pointerdown', this.onPointerDown);
		element.addEventListener('pointercancel', this.onPointerUp);

		this.phi = this.phiStart;
		this.theta = this.thetaStart;
		this.applyTransformations();
	}

	onPointerDown = (e = new PointerEvent(null)) => {
		this.button = e.button;
		this.clientStart.set(e.clientX, e.clientY);

		this.element.addEventListener('pointermove', this.onPointerMove);
		this.element.addEventListener('pointerup', this.onPointerUp);
		this.element.addEventListener('wheel', this.onMouseWheel);

		this.cameraStart.copy(this.camera.position);
		this.cameraTargetStart.copy(this.camera.target);
		this.depthSnapshot = Math.min(
			this.depthHelper.getDepth(e.clientX, e.clientY),
			this.maxDepth,
		);

		this.projector.updateView();
		this.projector.applyIntersect(
			e.clientX,
			e.clientY,
			this.depthSnapshot,
			this.intersectStart,
		);
		this.intersectPlane.distance = this.intersectStart.y;
	};

	onPointerMove = (e = new PointerEvent(null)) => {
		this.client.set(e.clientX, e.clientY);
		this.client.subtract(this.clientStart, this.travel);

		if (this.button === 0) {
			this.theta = this.thetaStart - this.travel.x * 0.1;
			const phiSave = this.phi;
			this.phi = this.phiStart - this.travel.y * 0.1;
			if (this.phi <= this.phiMin || this.phi >= this.phiMax) {
				this.phiStart -= this.phi - phiSave;
				this.phi = phiSave;
			}
		}
		if (this.button === 2) {
			this.cameraRay.origin.copy(this.cameraStart);
			this.projector.applyIntersect(e.clientX, e.clientY, 0, this.intersect);
			this.intersect
				.subtract(this.cameraStart, this.cameraRay.direction)
				.normalize();
			this.cameraRay.intersectPlane(this.intersectPlane, this.intersect);

			this.intersect
				.subtract(this.intersectStart, this.cameraTravel)
				.multiplyScalar(-1);
		}
		this.applyTransformations();
	};

	onMouseWheel = (e = new WheelEvent(null)) => {
		e.preventDefault();
		this.distance = Math.max(
			Math.min(this.distance + e.deltaY * 0.1, this.distanceMax),
			this.distanceMin,
		);
		this.applyTransformations();
	};

	onPointerUp = () => {
		this.element.removeEventListener('pointermove', this.onPointerMove);
		this.element.removeEventListener('pointerup', this.onPointerUp);

		this.thetaStart = this.theta;
		this.phiStart = this.phi;

		this.cameraStart.copy(this.camera.position);
		this.cameraTargetStart.copy(this.camera.target);
		this.cameraTravel.set(0, 0, 0);
	};

	onContextMenu = (e = new Event(null)) => {
		e.preventDefault();
	};

	dispose = () => {
		this.element.removeEventListener('contextmenu', this.onContextMenu);
		this.element.removeEventListener('pointerdown', this.onPointerDown);
		this.element.removeEventListener('pointerup', this.onPointerUp);
		this.element.removeEventListener('wheel', this.onMouseWheel);
	};
}

export {OrbitCameraControl};
