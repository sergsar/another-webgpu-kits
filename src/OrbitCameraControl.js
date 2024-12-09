import {
	Camera,
	Vector3,
	Vector2,
	Quaternion,
	UnitUtils,
	Plane,
	Ray,
	Vector2Balancer,
} from 'another-webgpu';
import {DepthHelper} from './DepthHelper.js';
import {Projector} from './Projector.js';

class OrbitCameraControl {
	constructor({
		camera = new Camera(),
		element = document.createElement(''),
		theta: initialTheta = 0, // around y axis
		phi: initialPhi = 60, // around x axis
		phiMax = 150,
		phiMin = 20,
		distance = 19,
		distanceMin = 3,
		distanceMax = 15,
	}) {
		let button = -1;
		const clientStart = new Vector2();
		const travel = new Vector2();
		let thetaStart = UnitUtils.degToRad(initialTheta);
		let theta = thetaStart;
		let phiStart = UnitUtils.degToRad(initialPhi);
		let depthSnapshot = 0;
		const maxDepth = 0.88;
		const depthLimit = 0.96;
		let phi = phiStart;
		let phiPrevious = phi;
		const phiMinRad = UnitUtils.degToRad(phiMin);
		const phiMaxRad = UnitUtils.degToRad(phiMax);
		const quaternion = new Quaternion();
		const zoomVector = new Vector3();
		const projector = new Projector(camera, element);
		const depthHelper = new DepthHelper(camera, element);
		const cameraTravel = new Vector3();
		const cameraStart = new Vector3();
		const cameraTargetStart = new Vector3();
		const intersectStart = new Vector3();
		const intersectPlane = new Plane(new Vector3(0, 1, 0));
		const cameraRay = new Ray();
		const intersect = new Vector3();

		const clientBalancer = new Vector2Balancer();
		const balancersCondition = () =>
			(camera.position.length < 20 || button === 0) &&
			phi > phiMinRad &&
			phi < phiMaxRad;
		const balancersInversion = () =>
			(button === 2 && cameraTravel.dot(camera.position) < 0) ||
			(button === 0 &&
				Math.abs(phiPrevious - phiStart) >= Math.abs(phi - phiStart));
		clientBalancer.setCondition(balancersCondition);
		clientBalancer.setInversion(balancersInversion);

		camera.useDepth = true;

		const applyTransformations = () => {
			quaternion.set(0, 0, 0, 1);
			quaternion.rotateY(theta);
			quaternion.rotateX(phi);
			zoomVector.set(0, 1, 0);
			zoomVector.applyQuaternion(quaternion);
			zoomVector.length = distance;

			camera.position.copy(cameraStart).add(cameraTravel);
			camera.target.copy(cameraTargetStart).add(cameraTravel);

			camera.position.copy(camera.target).add(zoomVector);
		};

		const onPointerDown = (e = new PointerEvent(null)) => {
			button = e.button;
			clientStart.set(e.clientX, e.clientY);

			cameraStart.copy(camera.position);
			cameraTargetStart.copy(camera.target);

			depthSnapshot = depthHelper.getDepth(e.clientX, e.clientY);
			if (depthSnapshot > depthLimit) {
				depthSnapshot = maxDepth;
			}
			projector.updateView();
			projector.applyIntersect(
				e.clientX,
				e.clientY,
				depthSnapshot,
				intersectStart,
			);
			intersectPlane.distance = intersectStart.y;

			element.addEventListener('pointermove', onPointerMove);
			element.addEventListener('pointerup', onPointerUp);
			element.addEventListener('wheel', onMouseWheel);
		};

		const onPointerMove = (e = new PointerEvent(null)) => {
			clientBalancer.setValue(e.clientX, e.clientY);
			travel.copy(clientBalancer.balanced).subtract(clientStart);

			if (button === 0) {
				theta = thetaStart - travel.x * 0.1;
				phiPrevious = phi;
				phi = phiStart - travel.y * 0.1;
			}
			if (button === 2) {
				cameraRay.origin.copy(cameraStart);
				projector.applyIntersect(
					clientBalancer.balanced.x,
					clientBalancer.balanced.y,
					0,
					intersect,
				);
				cameraRay.direction.copy(intersect).subtract(cameraStart).normalize();
				cameraRay.intersectPlane(intersectPlane, intersect);
				cameraTravel
					.copy(intersect)
					.subtract(intersectStart)
					.multiplyScalar(-1);
			}
			applyTransformations();
		};

		const onMouseWheel = (e = new WheelEvent(null)) => {
			e.preventDefault();

			distance = Math.max(
				Math.min(distance + e.deltaY * 0.1, distanceMax),
				distanceMin,
			);
			applyTransformations();
		};

		const onPointerUp = (e = new Event(null)) => {
			thetaStart = theta;
			phiStart = phi;

			cameraStart.copy(camera.position);
			cameraTargetStart.copy(camera.target);
			cameraTravel.set(0, 0, 0);

			clientBalancer.reset();

			element.removeEventListener('pointermove', onPointerMove);
			element.removeEventListener('pointerup', onPointerUp);
		};

		const onContextMenu = (e = new Event(null)) => {
			e.preventDefault();
		};

		this.dispose = () => {
			element.removeEventListener('contextmenu', onContextMenu);
			element.removeEventListener('pointerdown', onPointerDown);
			element.removeEventListener('pointerup', onPointerUp);
			element.removeEventListener('wheel', onMouseWheel);
		};

		applyTransformations();

		element.addEventListener('contextmenu', onContextMenu);
		element.addEventListener('pointerdown', onPointerDown);
		element.addEventListener('pointercancel', onPointerUp);

		Object.defineProperties(this, {
			dispose: {writable: false},
		});
	}
}

export {OrbitCameraControl};
