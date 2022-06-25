
const configs = {
  SWIPE_TIME: 1000,
  SWIPE_DISTANCE: 80,
  DOUBLE_TAP_TIME: 250,
  DOUBLE_TAP_DISTANCE: 20,
  TREPLE_TAP_TIME: 400,
  TREPLE_TAP_DISTANCE: 20,
  LONG_PRESS_TIME: 1500,
}


// FUNCTIONS FEATURES

const onTarget = function (target, x, y) {
  const {top, left, right, bottom} = target.getBoundingClientRect();
  return (left < x) & (x < right) & (top < y) & (y < bottom)
}


const getTraceOrientation = function(dx, dy) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  const orientation = { motionType: null, direction: null };
  
  if (absDx > absDy) {
    orientation.motionType  = 'horizontal';
    orientation.direction   = (dx > 0) ? 'right' : 'left';
  } else {
    orientation.motionType  = 'vertical';
    orientation.direction   = (dy > 0) ? 'down' : 'up';
  }
  
  return orientation;
}


const detectSwipe = function (tracked) {
  const tdx     = tracked.tdx;
  const tdy     = tracked.tdy;
  const timeNow = Date.now();
  
  if (timeNow - tracked.timeStart > configs.SWIPE_TIME) return;
  
  if (Math.abs(tdx) > configs.SWIPE_DISTANCE || Math.abs(tdy) > configs.SWIPE_DISTANCE) {
    return getTraceOrientation(tdx, tdy);
  }
}


const detectDoubleTap = function (tracked_1, tracked_0) {
  const deltaTime = tracked_1.timeEnd - tracked_0.timeStart;
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
  const deltaTime = tracked_2.timeEnd - tracked_0.timeStart;
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

// Handler model to tracker touches
function TouchTrackerHandler(target, callbacks, options) {
  this.trackeds     = [];
  this.toExecOnAdd  = [];
  this.toExecOnRead = [];
  this.toExeconEnd  = [];
  this.target       = target;  
  
  this.stopWhenLeave = (options.stopWhenLeave === true) ? true : false;
  this.maxTouches = isNum(options.maxTouches) && options.maxTouches <= 5 ? options.maxTouches : 5;


  const _callbacks = {}

  Object.keys(callbacks).forEach(callback => {
    const cb = callbacks[callback];

    if (isFun(cb)) _callbacks[callback] = cb;
  });
  
  
  // start configuration of execution queues
  if (_callbacks.onLongPress) {
    const cb = this.onLongPress;
    const timeOutIDReg = [];
    
    this.toExecOnAdd.push((tracked, touchID) => {
      const timeOutID = setTimeOut(() => {
        timeOutIDReg[touchID] = undefined;
        cb(tracked, target, touchID);
      });
      
      timeOutIDReg[touchID] = timeOutID;
    });
    
    const disable_lp = (tracked, touchID) => {
      const timeOutID = timeOutIDReg[touchID];
      
      if (timeOutID) {
        clearTimeOut(timeOutID);
        timeOutIDReg[touchID] = undefined;
      }
    }

    this.toExecOnRead.push(disable_lp);
    this.toExeconEnd.push(disable_lp);
  }
  
  if (_callbacks.onSwipe) {
    const cb = _callbacks.onSwipe;
    const swipedsRegister = [];
    
    this.toExecOnRead.push((tracked, touchID) => {
      if (swipedsRegister[touchID] === tracked) return;
      
      const details = detectSwipe(tracked);
      
      if (details) {
        swipedsRegister[touchID] = tracked;
        cb(tracked, details, target, touchID);
      }
    });
  }
  
  if (_callbacks.onDoubleTap) {
    const cb = _callbacks.onDoubleTap;
    const doubleTapHistorics = [];

    for (let i = 0; i < this.maxTouches; i++) {
      doubleTapHistorics[i] = [];
    }
  
    this.toExeconEnd.push((tracked, touchID) => {
      let historic = doubleTapHistorics[touchID];
      
      if (historic.length > 0) {
        const lastTracked = historic.at(-1);
  
        if (tracked.timeEnd - lastTracked.timeStart > 1000) {
          historic = doubleTapHistorics[touchID] = []; // new clear array
          historic.push(tracked);
          return
        }
      }
  
      historic.push(tracked);
  
      if (historic.length === 2) {        
        if (detectTrepleTap(historic[1], historic[0]))
          cb(tracked, target, touchID);
          
        historic = doubleTapHistorics[touchID] = []; // new clear array
      }
    });
  }
  
  if (_callbacks.onTrepleTap) {
    const cb = _callbacks.onTrepleTap;
    const trepleTapHistoric = [];
    
    for (let i = 0; i < this.maxTouches; i++) {
      trepleTapHistoric[i] = [];
    }

    this.toExeconEnd.push((tracked, touchID) => {
      let historic = trepleTapHistoric[touchID];
      
      if (historic.length > 0) {
        const lastTracked = historic.at(-1);
  
        if (tracked.timeEnd - lastTracked.timeStart > 1000) {
          historic = doubleTapHistorics[touchID] = []; // new clear array
          historic.push(tracked);
          return
        }
      }
  
      historic.push(tracked);
  
      if (historic.length === 3) {        
        if (detectTrepleTap(historic[2], historic[1], historic[0]))
          cb(tracked, target, touchID);
  
        historic = doubleTapHistorics[touchID] = []; // new clear array
      }
    });
  }

  if (_callbacks.onDown) {
    this.toExecOnAdd.push(_callbacks.onDown);
  }
  
  if (_callbacks.onRead) {
    this.toExecOnRead.push(_callbacks.onRead);
  }
  
  if (_callbacks.onUp) {
    this.toExecOnEnd.push(_callbacks.onUp);
  }
  // ending configuration execution queues
  
  this.options = options;
}

// Handler model to tracker mouse
function MouseTrackerHandler(target, callbacks, options) {
  this.tracked      = undefined;
  this.toExecOnAdd  = [];
  this.toExecOnRead = [];
  this.toExecOnEnd  = [];
  this.target       = target;
  
  const _callbacks = {};

  Object.keys(callbacks).forEach(callback => {
    const cb = callbacks[callback];
    
    if (isFun(cb)) _callbacks[callback] = cb;
  });
  
  
  // start configurations of executions queues

  if (_callbacks.onLongPress) {
    const cb = _callbacks.onLongPress;
    let timeOutIDReg = null;
    
    this.toExecOnAdd.push((tracked, button) => {
      timeOutIDReg = setTimeout(() => {
        timeOutIDReg = null;
        cb(tracked, target, button);
      }, configs.LONG_PRESS_TIME);
    });
    
    const disable_lp = (tracked, button) => { // 
      if (timeOutIDReg) {
        clearTimeout(timeOutIDReg);
        timeOutIDReg = null;
      }
    }

    this.toExecOnRead.push(disable_lp);
    this.toExecOnEnd.push(disable_lp);
  }


  if (_callbacks.onSwipe) {
    const cb = _callbacks.onSwipe;
    let swipedRegister = null;

    this.toExecOnRead.push((tracked, button) => {
      if (swipedRegister === tracked) return;
      
      const details = detectSwipe(tracked);
      
      if (details) {
        swipedRegister = tracked;
        cb(tracked, details, target, button);
      }
    });
  }
  
  if (_callbacks.onDoubleTap) {
    const cb = _callbacks.onDoubleTap;
    let doubleTapHistoric = [];
    
    this.toExecOnEnd.push((tracked, button) => {
      let historic = doubleTapHistoric;

      if (historic.length > 0) {
        const lastTracked = historic.at(-1);
  
        if (tracked.timeEnd - lastTracked.timeStart > 1000) {
          historic = doubleTapHistoric = [];
          historic.push(tracked);
          return
        }
      }
  
      historic.push(tracked);
  
      if (historic.length === 2) {
        if (detectDoubleTap(historic[1], historic[0]))
          cb(tracked, target, button);
          
        historic = doubleTapHistoric = [];
      }
    });
  }
  
  if (_callbacks.onTrepleTap) {
    const cb = _callbacks.onTrepleTap;
    let trepleTapHistoric = [];
  
    this.toExecOnEnd.push((tracked, button) => {
      let historic = trepleTapHistoric;

      if (historic.length > 0) {
        const lastTracked = historic.at(-1);
  
        if (tracked.timeEnd - lastTracked.timeStart > 1000) {
          historic = trepleTapHistoric = []; // new cleared array
          historic.push(tracked);
          return
        }
      }
  
      historic.push(tracked);
  
      if (historic.length === 3) {        
        if (detectTrepleTap(historic[2], historic[1], historic[0]))
          cb(tracked, target, button);
  
        historic = trepleTapHistoric = []; // new cleared array
      }
    });
  }

  if (_callbacks.onDown) {
    this.toExecOnAdd.push(_callbacks.onDown);
  }
  
  if (_callbacks.onMove) {
    this.toExecOnRead.push(_callbacks.onMove);
  }
  
  if (_callbacks.onUp) {
    this.toExecOnEnd.push(_callbacks.onUp);
  }
}

// Casing for details of moviments tracked (mouse and touch)
function TrackedMoviment(headerStop) {
  this.event       = null;
  this.x           = null;
  this.y           = null;
  this.timeStart   = null;
  this.timeStamp   = null;
  this.timeEnd     = null;
  this.tdx         = 0;
  this.tdy         = 0;
  this.dx          = 0;
  this.dy          = 0;

  this.stopTracking = function () {
    headerStop(this);
  }
}


// TOUCH INTERATION

function touchTracker(target, callbacks, options) {  
  
  const handler = new TouchTrackerHandler(target, callbacks, options);
  
  // Headers to touch interaction
  const
    headerTouchStart = event => {
      const touches = event.changedTouches;
      handler.addTouches(touches);
    },
    headerTouchMove = event => {
      const touches = event.changedTouches;
      handler.readTouches(touches);
    },
    headerTouchEnd = event => {
      const touches = event.changedTouches;
      handler.removeTouches(touches);
    };
  
  
  target.addEventListener('touchstart', headerTouchStart, false);
  target.addEventListener('touchmove', headerTouchMove, false);
  target.addEventListener('touchend', headerTouchEnd, false);
}


// MOUSE INTERACTION

function mouseTracker(target, callbacks, options) {

  const handler = new MouseTrackerHandler(target, callbacks, options);
  
  const
    headerMouseStart = mouse => {
      handler.addMouse(mouse);
    },
    headerMouseMove = mouse => {
      handler.readMouse(mouse);
    },
    headerMouseEnd = mouse => {
      handler.removeMouse(mouse);
    };
  
  
  target.addEventListener('mousedown', headerMouseStart, false);
  target.addEventListener('mousemove', headerMouseMove, false);
  target.addEventListener('mouseup', headerMouseEnd, false);
  
  if (options.watchLeave === true) {
    target.addEventListener('mouseleave', headerMouseEnd, false);
  }
}


// PROPERTIES STATEMENT

Object.defineProperties(TrackedMoviment.prototype, {
  updatePosition: {
    value: function(x, y) {
      const dx = x - this.x;
      const dy = y - this.y;
      
      // acumulate dpos variations since motion start
      this.tdx += dx; this.tdy += dy;
      // update dpos between the last pos and your before value
      this.dx = dx; this.dy = dy;
      // update pos, next oldPos
      this.x = x; this.y = y;
    }
  },
});


Object.defineProperties(TouchTrackerHandler.prototype, {
  addTouches: {
    value: function(touches) {
      const timeStart  = Date.now();
      const trackeds   = this.trackeds;
      const maxTouches = this.maxTouches;
      const execQueue  = this.toExecOnAdd;
      
      for (let i = 0; i < touches.length; i++) {
        
        const tch = touches[i];
        const id  = tch.identifier;

        if (id >= maxTouches) continue;

        const tracked = new TrackedMoviment(tracked => this.untrack(tracked));
        
        tracked.x     = tch.clientX;
        tracked.y     = tch.clientY;
        tracked.event = tch;
        trackeds[id]  = tracked;

        tracked.timeStart = tracked.timeStamp = timeStart;
        
        for (let j = execQueue.length; j--; execQueue[j](tracked, id));
      }
    }
  },
  
  readTouches: {
    value: function(touches) {
      const timeCurrent  = Date.now();
      const toRemove     = [];
      const trackeds     = this.trackeds;
      const toCheckLeave = this.stopWhenLeave;
      const target       = this.target;
      const execQueue    = this.toExecOnRead;
      
      for (let i = 0; i < touches.length; i++) {
        const tch     = touches[i];
        const id      = tch.identifier;
        const tracked = trackeds[id];
        const tchx    = tch.clientX;
        const tchy    = tch.clientY;
        
        if (tracked === undefined) continue;
        
        tracked.event = tch;
        tracked.updatePosition(tchx, tchy);
        tracked.timeStamp = timeCurrent;
        
        if (toCheckLeave && !onTarget(target, tchx, tchy)) {
          toRemove.push(tch);
          continue;
        }
        
        for (let j = execQueue.length; j--; execQueue[j](tracked, id));
      }
      
      if (toRemove.length > 0) this.removeTouches(toRemove);
    }
  },
  
  removeTouches: {
    value: function(touches) {
      const timeEnd   = Date.now();
      const trackeds  = this.trackeds;
      const execQueue = this.toExecOnEnd;
      
      for (let i = 0; i < touches.length; i++) {
        
        const tch     = touches[i];
        const id      = tch.identifier;
        const tracked = trackeds[id];
        
        if (tracked === undefined) continue;
        
        trackeds[id]    = undefined;
        tracked.event   = tch;
        tracked.timeEnd = tracked.timeStamp = timeEnd;
        
        for (let j = execQueue.length; j--; execQueue[j](tracked, id));
      }
    }
  },
  
  untrack: {
    value: function(tracked) {
      const trackeds  = this.trackeds;
      
      for (let i = 0; i < trackeds.length; i++) {
        if (trackeds[i] === tracked) {
          trackeds[i] = undefined;
        }
      }
    }
  },
});


Object.defineProperties(MouseTrackerHandler.prototype, {
  addMouse: {
    value: function(mouse) {
      const timeStart = Date.now();
      const execQueue = this.toExecOnAdd;

      //if (mouse.buttons in this.options.buttons) return;
      
      const tracked = new TrackedMoviment(tracked => this.untrack(tracked));
      
      tracked.x = mouse.clientX;
      tracked.y = mouse.clientY;
      tracked.timeStart = tracked.timeStamp = timeStart;
      tracked.event = mouse;
      
      this.tracked = tracked;

      for (let j = execQueue.length; j--; execQueue[j](tracked));
    }
  },
  
  readMouse: {
    value: function(mouse) {
      const timeCurrent = Date.now();
      const tracked     = this.tracked;
      const execQueue   = this.toExecOnRead;
      
      if (tracked === undefined || mouse.buttons !== 1) return;
      
      tracked.updatePosition(mouse.clientX, mouse.clientY);
      tracked.timeStamp = timeCurrent;
      tracked.event = mouse;

      for (let j = execQueue.length; j--; execQueue[j](tracked));
    }
  },
  
  removeMouse: {
    value: function(mouse) {
      const timeEnd   = Date.now();
      const tracked   = this.tracked;
      const execQueue = this.toExecOnEnd;

      if (tracked === undefined) return;

      this.tracked = undefined;
      tracked.timeEnd = tracked.timeStamp = timeEnd;
      tracked.updatePosition(mouse.clientX, mouse.clientY);
      tracked.event = mouse;

      for (let j = execQueue.length; j--; execQueue[j](tracked));
    }
  },
  
  untrack: {
    value: function(tracked) {
      if (this.tracked === tracked) {
        this.tracked = undefined;
      }
    }
  },
});
