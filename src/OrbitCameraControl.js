import {
	Camera,
	Plane,
	Quaternion,
	Ray,
	UnitUtils,
	Vector2,
	Vector3,
	RangeLimiter,
} from 'another-webgpu';
import {DepthHelper} from './DepthHelper.js';
import {Projector} from './Projector.js';

class OrbitCameraControl {
	/**
	 * @param {Object} params
	 * @param {Camera} params.camera
	 * @param {HTMLElement} params.element
	 * @param {Vector3} [params.origin]
	 * @param {'origin'|'center'} [params.strategy]
	 * @param {number} phiMin
	 * @param {number} phiMax
	 */
	constructor({
		camera = new Camera(),
		element = document.createElement(''),
		origin = new Vector3(0, 0, 0),
		strategy = 'origin',
		phiMin = 20,
		phiMax = 80,
	}) {
		const eventContext = {button: -1};

		let thetaDelta = 0; // around y axis
		let phiDelta = 0; // around x axis
		let phiStart = 0;
		let depthSnapshot = 0;
		let zoomDelta = 0;
		const depthLimit = 0.96;
		const phiMinRad = UnitUtils.degToRad(phiMin);
		const phiMaxRad = UnitUtils.degToRad(phiMax);

		let rect = element.getBoundingClientRect();

		const clientStart = new Vector2();
		const clientShift = new Vector2();
		const client = new Vector2();
		const travel = new Vector2();
		const zoomPosition = new Vector2();
		const zoomPositionUpdate = new Vector2();
		const quaternion = new Quaternion();
		const directionQuaternion = new Quaternion();
		const directionQuaternionConjugated = new Quaternion();
		const up = new Vector3(0, 1, 0);
		const forward = new Vector3(0, 0, -1);
		const cameraYaw = new Vector3();
		const cameraDirection = new Vector3();
		const cameraRotateVector = new Vector3();
		const cameraRotateVectorStart = new Vector3();
		const targetRotateVector = new Vector3();
		const targetRotateVectorStart = new Vector3();
		const intersectStart = new Vector3();
		const intersect = new Vector3();
		const cameraTravel = new Vector3();
		const zoomVector = new Vector3();
		const cameraRay = new Ray();
		const intersectPlane = new Plane(up);

		const phiLimiter = new RangeLimiter();
		const depthHelper = new DepthHelper(camera, element);
		const projector = new Projector(camera, element);

		camera.useDepth = true;

		const applyTransformations = () => {
			cameraRotateVector.copy(cameraRotateVectorStart);
			targetRotateVector.copy(targetRotateVectorStart);

			quaternion.copy(directionQuaternion);
			quaternion.rotateY(thetaDelta);
			quaternion.rotateX(phiDelta);
			quaternion.multiply(directionQuaternionConjugated);
			cameraRotateVector.applyQuaternion(quaternion);
			targetRotateVector.applyQuaternion(quaternion);

			camera.position
				.copy(intersectStart)
				.add(cameraTravel)
				.add(cameraRotateVector);
			camera.target
				.copy(intersectStart)
				.add(cameraTravel)
				.add(targetRotateVector);
		};

		const applyIntersect = (clientX = 0, clientY = 0) => {
			thetaDelta = 0;
			phiDelta = 0;
			phiLimiter.reset();

			clientShift.set(0, 0);

			clientStart.set(clientX, clientY);

			cameraRay.origin.copy(camera.position); // combine camera ray for rotation?

			cameraRay.direction
				.copy(camera.target)
				.subtract(camera.position)
				.normalize();
			intersectPlane.distance = origin.y;

			depthSnapshot = depthHelper.getDepth(clientX, clientY);

			projector.updateView();

			projector.unProjectFromSnapshot(
				clientX,
				clientY,
				depthSnapshot,
				intersectStart,
			);
			intersectPlane.distance = intersectStart.y;

			if (depthSnapshot > depthLimit) {
				// if depth is > depth limit,
				// the movement and rotation should be from the center
				intersectPlane.distance = origin.y;
				if (strategy === 'origin') {
					projector.project(origin, element, clientShift);
					clientShift.subtract(clientStart);
					intersectStart.copy(origin);
				} else {
					rect = element.getBoundingClientRect();
					clientShift
						.set(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5)
						.subtract(clientStart);
					cameraRay.direction
						.copy(camera.target)
						.subtract(camera.position)
						.normalize();
					cameraRay.intersectPlane(intersectPlane, intersectStart);
				}

				clientStart.add(clientShift);
			}

			cameraRay.direction
				.copy(intersectStart)
				.subtract(camera.position)
				.normalize();

			cameraRotateVectorStart.copy(camera.position).subtract(intersectStart);
			targetRotateVectorStart.copy(camera.target).subtract(intersectStart);

			cameraDirection.copy(camera.target).subtract(camera.position).normalize();
			phiStart = Math.asin(cameraDirection.y);
			phiLimiter.setRange(-phiStart - phiMaxRad, -phiStart - phiMinRad);
			cameraYaw.copy(cameraDirection).setY(0).normalize();

			directionQuaternion.setFromUnitVectors(forward, cameraYaw);
			directionQuaternionConjugated.copy(directionQuaternion).conjugate();
		};

		const reset = () => {
			thetaDelta = 0;
			phiDelta = 0;
			phiStart = 0;
			phiLimiter.reset();

			cameraTravel.set(0, 0, 0);
		};

		const onPointerMove = (e = new PointerEvent(null)) => {
			client.set(e.clientX, e.clientY).add(clientShift);
			travel.copy(client).subtract(clientStart);
			if (eventContext.button === 0) {
				thetaDelta = -travel.x * 0.1;
				phiDelta = phiLimiter.apply(-travel.y * 0.1);
			}
			if (eventContext.button === 2) {
				projector.unProjectFromSnapshot(client.x, client.y, 0, intersect);
				cameraRay.direction
					.copy(intersect)
					.subtract(cameraRay.origin)
					.normalize();
				cameraRay.intersectPlane(intersectPlane, intersect);
				cameraTravel
					.copy(intersect)
					.subtract(intersectStart)
					.multiplyScalar(-1);
			}
			applyTransformations();
		};

		const onPointerUp = (e = new PointerEvent(null)) => {
			reset();

			element.removeEventListener('pointermove', onPointerMove);
			element.removeEventListener('pointerup', onPointerUp);
			element.removeEventListener('pointerleave', onPointerLeave);
		};

		const onMouseWheel = (e = new WheelEvent(null)) => {
			e.preventDefault();
			if (
				(camera.position.y > 20 && e.deltaY > 0) ||
				(camera.position.y < 5 && e.deltaY < 0)
			) {
				return;
			}
			zoomPositionUpdate.set(e.clientX, e.clientY).subtract(zoomPosition);
			if (zoomPositionUpdate.length > 0.01) {
				zoomPosition.set(e.clientX, e.clientY);
				applyIntersect(e.clientX, e.clientY);
			}
			zoomVector.copy(cameraRay.direction).multiplyScalar(-e.deltaY * 0.1);
			camera.position.add(zoomVector);
			camera.target.add(zoomVector);
		};

		const onPointerDown = (e = new PointerEvent(null)) => {
			eventContext.button = e.button;
			applyIntersect(e.clientX, e.clientY);

			element.addEventListener('pointermove', onPointerMove);
			element.addEventListener('pointerup', onPointerUp);
			element.addEventListener('wheel', onMouseWheel);
			element.addEventListener('pointerleave', onPointerLeave);
		};

		const onPointerLeave = (e = new PointerEvent(null)) => {
			reset();
			element.removeEventListener('pointermove', onPointerMove);
		};

		const onContextMenu = (e = new Event(null)) => {
			e.preventDefault();
		};

		this.dispose = () => {
			element.removeEventListener('pointermove', onPointerMove);
			element.removeEventListener('pointerup', onPointerUp);
			element.removeEventListener('pointerleave', onPointerLeave);

			element.removeEventListener('contextmenu', onContextMenu);
			element.removeEventListener('pointerdown', onPointerDown);
			element.removeEventListener('wheel', onMouseWheel);
			element.removeEventListener('pointercancel', onPointerUp);
		};

		// applyTransformations();

		element.addEventListener('contextmenu', onContextMenu);
		element.addEventListener('pointerdown', onPointerDown);
		element.addEventListener('wheel', onMouseWheel);
		element.addEventListener('pointercancel', onPointerUp);

		Object.defineProperties(this, {
			dispose: {writable: false},
		});
	}
}

export {OrbitCameraControl};
