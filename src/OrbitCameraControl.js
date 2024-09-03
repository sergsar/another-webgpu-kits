import {Camera, Vector3, Vector2, Quaternion, UnitUtils} from 'another-webgpu';

class OrbitCameraControl {
	constructor({
		camera = new Camera(),
		element = document.createElement(''),
		distance = 7,
		theta = 0, // around y axis
		phi = 45, // around x axis
	}) {
		Object.defineProperties(this, {
			camera: {value: camera},
			element: {value: element},
			thetaStart: {value: UnitUtils.degToRad(theta), writable: true},
			phiStart: {value: UnitUtils.degToRad(phi), writable: true},
			theta: {value: 0, writable: true},
			phi: {value: 0, writable: true},
			distance: {value: distance, writable: true},
			clientStart: {value: new Vector2()},
			client: {value: new Vector2()},
			travel: {value: new Vector2()},
			quaternion: {value: new Quaternion()},
			zoomVector: {value: new Vector3(0, 1, 0)},
			button: {value: -1, writable: true},
			applyTransformations: {
				value: () => {
					this.quaternion.set(0, 0, 0, 1);
					this.quaternion.rotateY(this.theta);
					this.quaternion.rotateX(this.phi);
					this.zoomVector.set(0, 1, 0);
					this.zoomVector.applyQuaternion(this.quaternion);
					this.zoomVector.length = this.distance;
					this.camera.target.add(this.zoomVector, this.camera.position);
				},
			},
		});

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
	};

	onPointerMove = (e = new PointerEvent(null)) => {
		this.client.set(e.clientX, e.clientY);
		this.client.subtract(this.clientStart, this.travel);
		if (this.button === 0) {
			this.theta = this.thetaStart - this.travel.x * 0.1;
			this.phi = this.phiStart - this.travel.y * 0.1;
		}
		this.applyTransformations();
	};

	onMouseWheel = (e = new WheelEvent(null)) => {
		e.preventDefault();
		this.distance += e.deltaY * 0.1;
		this.applyTransformations();
	};

	onPointerUp = () => {
		this.element.removeEventListener('pointermove', this.onPointerMove);
		this.element.removeEventListener('pointerup', this.onPointerUp);

		this.thetaStart = this.theta;
		this.phiStart = this.phi;
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
