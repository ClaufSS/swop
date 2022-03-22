
const getMotionType = function (dx, dy) {
	const [absDx, absDy] = [Math.abs(dx), Math.abs(dy)];
	return (absDx > absDy) ? 'line' : 'column';
}


const getDirection = function (dx, dy) {
	const motionType = getMotionType(dx, dy);

	if (motionType === 'line') {
		return (dx > 0) ? 'right' : 'left';
	}

	if (motionType === 'column') {
		return (dy > 0) ? 'down' : 'up';
	}
}


// Include suport for mutiple layouts, make this a handle layouts rule
function MotionMap() {
	this.line = [];
	this.column = [];
}

MotionMap.prototype.isNewMotion = function(motionType, touchId) {
	let result = true;

	for (let motion of this[motionType]) {
		if (motion === undefined) continue;

		if (motion.touchId === touchId) {
			result = false;
		}
	}
	return true// result;
}


MotionMap.prototype.isConflitantMotion = function(motionType, motionId) {
	const context = this.getContext();

	let result = false;
	if (context !== undefined) {
		if ((motionType !== context) || (this[motionType][motionId] !== undefined)) {
			result = true;
		}
	}
	return result;
}


MotionMap.prototype.getContext = function() {
	const checkNotUndefinde = item => item !== undefined;

	if (checkNotUndefinde(this.line.find(checkNotUndefinde))) {
		return 'line';
	}

	if (checkNotUndefinde(this.column.find(checkNotUndefinde))) {
		return 'column';
	}
}