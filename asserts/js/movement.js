
const configs = {
	SWIPE_TIME: 1000,
	SWIPE_DISTANCE: 80,
	DOUBLE_TAP_TIME: 200,
	DOUBLE_TAP_DISTANCE: 20,
	TREPLE_TAP_TIME: 300,
	TREPLE_TAP_DISTANCE: 20,
	LONG_PRESS_TIME: 1500,
}


// FUNCTIONS FEATURES

const onTarget = function (target, x, y) {
	const {top, left, right, bottom} = target.getBoundingClientRect();
	return (left < x) & (x < right) & (top < y) & (y < bottom)
}


const getOrientation = function(dx, dy) {
	const absDx = Math.abs(dx); 
	const absDy = Math.abs(dy);

	const orientation = { motionType: null, direction: null };

	if (absDx > absDy) {
		orientation.motionType = 'line';
		orientation.direction = (dx > 0) ? 'right' : 'left';
	} else {
		orientation.motionType = 'column';
		orientation.direction = (dy > 0) ? 'down' : 'up';
	}

	return orientation;
}


const detectSwipe = function (tracked) {
	const {tdx, tdy} = tracked;
	const timeNow = Date.now();

	if (timeNow - tracked.timeStart > configs.SWIPE_TIME) return res;

	if (Math.abs(tdx) > configs.SWIPE_DISTANCE || Math.abs(tdy) > configs.SWIPE_DISTANCE) {
		return getOrientation(tdx, tdy);
	}
}


const detectDoubleTap = function (tracked_1, tracked_0) {
	const deltaTime = tracked_0.timeStart - tracked_1.timeEnd;
	let res = false;

	if (
		Math.abs(tracked_0.x - tracked_1.x) < configs.DOUBLE_TAP_DISTANCE &&
		Math.abs(tracked_0.y - tracked_1.y) < configs.DOUBLE_TAP_DISTANCE &&
		deltaTime < configs.DOUBLE_TAP_TIME
	) {
		res = true;
	}

	return res;
}


const detectTrepleTap = function (tracked_2, tracked_1, tracked_0) {
	const deltaTime = tracked_0.timeStart - tracked_2.timeEnd;
	let res = false;

	if (
		Math.abs(tracked_0.x - tracked_1.x) < configs.TREPLE_TAP_DISTANCE &&
		Math.abs(tracked_1.x - tracked_2.x) < configs.TREPLE_TAP_DISTANCE &&
		Math.abs(tracked_0.y - tracked_1.y) < configs.TREPLE_TAP_DISTANCE &&
		Math.abs(tracked_1.y - tracked_2.y) < configs.TREPLE_TAP_DISTANCE &&
		deltaTime < configs.TREPLE_TAP_TIME
	) {
		res = true;
	}

	return res;
}


// OBJECTS

	// Casing for details of moviments tracked (mouse and touch)
function TrackedMoviment(untrack) {
	this.x = null;
	this.y = null;
	this.swipeDetails = null;
	//this.isDoubleTap = false; // Not implemented
	//this.isTrepleTap = false; // Not implemented
	//this.isLongPress = false; // Not implemented
	this.timeStart = null;
	this.timestamp = null;
	this.timeEnd = null;
	this.tdx = 0;
	this.tdy = 0;
	this.dx = 0;
	this.dy = 0;

	this.stopTracking = function () {
		untrack(this);
	}
}


	// TOUCH INTERATION

function touchTracker(target, callbacks, options) {
	const tchTrackeds = [];

	const untrack = (tracked) => {
		for (let i = 0; i < tchTrackeds.length; i++) {
			if (tracked === tchTrackeds[i]) {
				delete(tchTrackeds[i]);
			}
		}
	}

	const tracker = {
		addTouches(touches) {
			const timeStart = Date.now();
			const added = [];

			for (let i = 0; i < touches.length; i++) {
				const tch = touches[i];
				const id = tch.identifier;
				const tm = new TrackedMoviment(untrack);

				tm.timeStart = timeStart;
				tm.x = tch.pageX;
				tm.y = tch.pageY;

				tchTrackeds[id] = tm;
				added.push(tm)
			}

			if (added.length > 0) callbacks.onStart && callbacks.onStart(added);
		},

		readTouches(touches) {
			const readeds = [];
			const toRemove = [];

			for (let i = 0; i < touches.length; i++) {
				const tch = touches[i];
				const id = tch.identifier;

				if (tchTrackeds[id] === undefined) continue;

				if ((options.watchLeave === true) && !onTarget(target, tch.pageX, tch.pageY)) {
					toRemove.push(tch);
				} else {
					tchTrackeds[id].updatePosition(tch.pageX, tch.pageY);
					readeds.push(tchTrackeds[id]);
				}

				if (options.swipe === true) {
					tchTrackeds[i].swipeDetails = detectSwipe(tchTrackeds[id]);
				}
			}

			if (toRemove.length > 0) this.removeTouches(toRemove);
			if (readeds.length > 0) callbacks.onMove && callbacks.onMove(readeds);
		},

		removeTouches(touches) {
			const timeEnd = Date.now();
			const removeds = [];

			for (let i = 0; i < touches.length; i++) {
				const tch = touches[i];
				const id = tch.identifier;

				if (tchTrackeds[id] === undefined) continue;

				const tempTouchRef = tchTrackeds[id];

				tchTrackeds[id] = undefined;
				tempTouchRef.timeEnd = timeEnd;
				tempTouchRef.updatePosition(tch.pageX, tch.pageY);

				removeds.push(tchTrackeds[id]);
			}

			if (removeds.length > 0) callbacks.onEndMove && callbacks.onEndMove(removeds);
		}
	};

	// Headers to touch interaction
	const
		headerTouchStart = e => {
			const touches = e.changedTouches;
			tracker.addTouches(touches);
		},
		headerTouchMove = e => {
			const touches = e.changedTouches;
			tracker.readTouches(touches);
		},
		headerTouchEnd = e => {
			const touches = e.changedTouches;
			tracker.removeTouches(touches);
		};


	target.addEventListener('touchstart', headerTouchStart, false);
	target.addEventListener('touchmove', headerTouchMove, false);
	target.addEventListener('touchend', headerTouchEnd, false);
}


	// MOUSE INTERACTION

function mouseTracker(target, callbacks, options) {
	// Callbacks return are maintainede as array for compatility of touchTracker callbacks returns

	const trackingHistory = [];
	let mouseTracked;

	const untrack = (tracked) => {
		if (mouseTracked === tracked) {
			mouseTracked = undefined;
		}
	}


	const
		headerMouseStart = mouse => {
			const timeStart = Date.now();

			if (mouse.buttons !== 1) return;

			const tm = new TrackedMoviment(untrack);

			tm.x = mouse.pageX;
			tm.y = mouse.pageY;
			tm.timeStart = tm.timestamp = timeStart;

			mouseTracked = tm;

			callbacks.onStart && callbacks.onStart([mouseTracked,]);
		},

		headerMouseMove = mouse => {
			const timeCurrent = Date.now();

			if (mouseTracked === undefined || mouse.buttons !== 1) return;

			mouseTracked.updatePosition(mouse.pageX, mouse.pageY);
			mouseTracked.timestamp = timeCurrent;

			if (options.swipe === true) {
				mouseTracked.swipeDetails = detectSwipe(mouseTracked);
			}
			if (options.longPress === true) {}

			callbacks.onMove && callbacks.onMove([mouseTracked,]);
		},

		headerMouseEnd = mouse => {
			if (mouseTracked === undefined) return;

			const timeEnd = Date.now();
			const tempMouseRef = mouseTracked;

			mouseTracked = undefined;
			tempMouseRef.timeEnd = timeEnd;
			tempMouseRef.updatePosition(mouse.pageX, mouse.pageY);

			if ((options.doubleTap === true) || (options.trepleTap === true)) {
				trackingHistory.shift(tempMouseRef);

				if (options.doubleTap === true) {
					if (trackingHistory.length < 1) {
						tempMouseRef.isDoubleTap = detectDoubleTap(trackingHistory[1], trackingHistory[0]);

						if (!options.trepleTap && trackingHistory.length === 2) trackingHistory = [];
					}
				}
				if (options.trepleTap === true) {
					if (trackingHistory.length === 3) {
						tempMouseRef.isTrepleTap = detectDoubleTap(...trackingHistory);
						trackingHistory = [];
					}
				}
			}

			callbacks.onEndMove && callbacks.onEndMove([tempMouseRef,]);
		};


	target.addEventListener('mousedown', headerMouseStart, false);
	target.addEventListener('mousemove', headerMouseMove, false);
	target.addEventListener('mouseup', headerMouseEnd, false);

	if (options.watchLeave === true) {
		target.addEventListener('mouseleave', headerMouseEnd, false);
	}
}

// KEYBOARD
function keyboardTracker() {
	// Headers to keyboard interaction
}



(function() {
	const getVariationUntil = function (x, y) {
		// calculate difference between nowPos and oldPos
		return [x - this.x, y - this.y];
	}

	const updatePosition = function (x, y) {
		const [dx, dy] = this.getVariationUntil(x, y);

		// acumulate dpos variations since motion start
		this.tdx += dx; this.tdy += dy;
		// update dpos between the last pos and your before value
		this.dx = dx; this.dy = dy;
		// update pos, next oldPos
		this.x = x; this.y = y;
	}


	Object.defineProperties(TrackedMoviment.prototype, {
		getVariationUntil: {
			value: getVariationUntil
		},
		updatePosition: {
			value: updatePosition
		}
	});

})();