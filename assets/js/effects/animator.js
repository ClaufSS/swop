
const easeTransitions = Object.create({});


Object.defineProperties(easeTransitions, {
	easeOutQuad: {
		value: function(x) {
			return 1 - (1 - x) * (1 - x);
		},
	},

	easeInOutCubic: {
		value: function(x) {
			return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
		},
	},

	easeLinear: {
		value: function(x) {
			return x;
		},
	}
});


function Animate(duration, transition, keyframe) {
	const stepByMs = 1 / (duration);

	const props = Object.keys(keyframe.to);
	const delta_FromTo = this.getDelta_FromTo(keyframe.from, keyframe.to, props);

	this.start = function (target, callbacks) {
		const kf = keyframe.from;

		const delta = delta_FromTo || this.getDelta_FromTo(target, keyframe.to, props);
		// if keyframe.from is undefined startValues is equal to target properties values
		/* if keyframe.from different of undefined target properties values are updated to
		keyframe.from values and startValues is equal to keyframe.from */
		const startValues = kf !== undefined ?
			(!this.setValues(target, kf, props) && kf) : this.getValues(target, props);

		this._start(target, callbacks, stepByMs, props, delta, startValues, transition);
	}
}


Object.defineProperties(Animate.prototype, {
	getDelta_FromTo: {
		value: (from, to, props) => {
			if (from === undefined) return;

			const delta = { };
	
			for (let i = 0; i < props.length; i++) {
				delta[props[i]] = to[props[i]] - from[props[i]]; 
			}
	
			return delta;
		}
	},

	getValues: {
		value: (reference, props) => {
			const values = { };
	
			for (let i = 0; i < props.length; i++) {
				values[props[i]] = reference[props[i]]; 
			}
	
			return values;
		}
	},

	setValues: {
		value: (target, reference, props) => {
			for (let i = 0; i < props.length; i++) {
				target[props[i]] = reference[props[i]]; 
			}
		}
	},

	_start: {
		value: (target, callbacks, stepByMs, props, delta, startValues, transition) => {
			const start = performance.now();
			const ease = easeTransitions[transition];
	
			const {onStart: start_cb, onProgress: progress_cb, onEnd: end_cb} = callbacks || { };
	
			let timeProgress, progress, endAnimation = false;
	
			start_cb && start_cb(target);
	
			function loop(timestamp) {
				timeProgress = timestamp - start;
				progress = Math.min(timeProgress * stepByMs, 1);
				endAnimation = progress === 1;
	
				for (let i = 0; i < props.length; i++) {
					target[props[i]] = startValues[props[i]] + delta[props[i]] * ease(progress);
				}

				progress_cb && progress_cb(target, progress);
				
				if (endAnimation) end_cb && end_cb(target);
				else requestAnimationFrame(loop);
			}
	
			requestAnimationFrame(loop);
		}
	}
});
