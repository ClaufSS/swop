

function MotionHandler() {
  this.motionCyclesMap = null;
  this.motionRegister = null;
  this.grids = [];
}


(function() {
  const an = new Animate(250, 'easeOutQuad', { to: {value: 0} });

  const tags = ['row', 'column', 'left', 'right', 'up', 'down'];


  const readMotionInst = loopInst => {
    if (typeof loopInst === 'string' && loopInst.length === 4) {
      let [gi, mt, mi, d] = loopInst;

      gi = parseInt(gi, 10);
      mi = parseInt(mi, 10);
      mt = tags[mt === 'r' ? 0 : mt === 'c' ? 1 : -1];
      d = tags[d === 'l' ? 2 : d === 'r' ? 3 : d === 'u' ? 4 : d === 'd' ? 5 : -1];

      if (!isNaN(gi) || !isNaN(mi) || mt !== -1 || d !== -1) {
        return [gi, mt, mi, d];
      }
    }
  }


  const isDirection = direction => {
    switch (direction) {
      case 'right': return true;
      case 'left': return true;
      case 'down': return true;
      case 'up': return true;
      default: return false;
    }
  }


  const getExpelled = (() => {
    const getters = { }
    
    getters.right = getters.down = line => line.at(-1);
    getters.left = getters.up = line => line.at(0);

    return (line, direction) => getters[direction](line);
  })();

  
  const permuteExpelleds = (linesList, motionCycle) => {
    const permutationAgent = getExpelled(linesList.at(0), motionCycle.at(0).at(-1));

    for (let i = 1; i < motionCycle.length; i++) {
      const direction = motionCycle.at(i).at(-1);

      const expelled = getExpelled(linesList.at(i), direction);

      [permutationAgent.text, expelled.text] = [expelled.text, permutationAgent.text];
    }
  }
  

  const align = (() => {
    const headers = {
      row: (grid, lineIndex) => {
        const row = grid.getRow(lineIndex);
        const cellWidth = grid.cellWidth;

        for (let i = row.length; i--;) {
          row[i].x = cellWidth * i;
        }
      },

      column: (grid, lineIndex) => {
        const column = grid.getColumn(lineIndex);
        const cellHeight = grid.cellHeight;
        
        for (let i = column.length; i--;) {
          column[i].y = cellHeight * i;
        }
      },
    }
    
    return (grid, lineType, lineIndex) => headers[lineType](grid, lineIndex);
  })();


  const relocateLine = (() => {
    // permute(matrix, row_obj1, column_obj1, row_obj2, column_obj2)
    const permute = (matrix, r1, c1, r2, c2) => {
      [matrix[r1][c1], matrix[r2][c2]] = [matrix[r2][c2], matrix[r1][c1]];
    }

    const headers = {
      right: (gcells, gsize, li) => {
        for (let k = 1; k < gsize; permute(gcells, li, 0, li, k++));
      },
      left: (gcells, gsize, li) => {
        for (let k = gsize; k > 1; permute(gcells, li, 0, li, --k));
      },
      down: (gcells, gsize, li) => {
        for (let k = 1; k < gsize; permute(gcells, 0, li, k++, li));
      },
      up: (gcells, gsize, li) => {
        for (let k = gsize; k > 1; permute(gcells, 0, li, --k, li));
      },
    }

    return (grid, lineIndex, direction) => headers[direction](grid.cells, grid.size, lineIndex);
  })();


  const relocateCells = (grids, motionCycle) => {
    for (let i = motionCycle.length; i--;) {
      const [gridId, lineType, lineIndex, direction] = motionCycle.at(i);

      const grid = grids[gridId];

      relocateLine(grid, lineIndex, direction);
      align(grid, lineType, lineIndex);
    }
  }


  const clearRegister = (motionRegister, motionCycle) => {
    for (let i = motionCycle.length; i--;) {
      const [gridId, lineType, lineIndex, direction] = motionCycle.at(i);

      motionRegister[gridId][lineType][lineIndex] = undefined;
      motionRegister[gridId].context = null;
    }
  }
  
  
  const getHeaderMoveTo = (() => {
    const headers = {
      right: (cell, value) => cell.x += value,
      left: (cell, value) => cell.x -= value,
      down: (cell, value) => cell.y += value,
      up: (cell, value) => cell.y -= value,
    }

    return (direction) => headers[direction];
  })();
  
  
  const move = (cells, direction, distance) => {
    if (!isDirection(direction)) {
      return Promise.reject(cells);
    }

    const headerMove = getHeaderMoveTo(direction);
    let last_value = distance;

    
    return new Promise((resolve, reject) => {
      an.start({ value: distance }, {
        
        onProgress: ({ value }) => {
          const variation = last_value - value;

          for (let i = 0; i < cells.length; i++) {
            headerMove(cells[i], variation);
          }

          last_value = value;
        },

        onEnd: () => resolve(cells)

      });
    });
  }


  const getCyclesMapConfigurator = function (_cyclesMap) {

    const haveCrosses = (cycle) => {
      const qInst = cycle.length;

      for (let i = 0; i < qInst; i++) {
        const toCheck = cycle[i];

        for (let f = i + 1; f < qInst; f++) {
          const toConfront = cycle[f];

          if ((toCheck[0] === toConfront[0]) && ((toCheck[1] !== toConfront[1]) || (toCheck[2] === toConfront[2]))) {
            return {found: true, conflict: [toCheck, toConfront]};
          }
        }
      }
      return {found: false, conflict: []};
    }


    const configure = (fires, cycle) => {
      for (const fire of fires) {
        const mapPointer = _cyclesMap[fire[0]][fire[1]][fire[2]];

        // test if have a cycle resgistered
        if (!(mapPointer[fire[3]] === null)) {
          return {state: 'fail', old: mapPointer[fire[3]], new: cycle};
        }

        mapPointer[fire[3]] = cycle;
      }
      return {state: 'done', old: null, new: cycle};
    }


    return {
      haveCrosses, configure,

      get cyclesMap() {
        return _cyclesMap;
      }
    }
  }


  const createMapAndRegisterStructure = (gSize, qGrids) => {
    const motionCyclesMap = [];
    const motionRegister = [];

    for (let i = 0; i < qGrids; i++) {
      const lineOfMotionCycles = [];
      const columnOfMotionCycles = [];
    
      for (let j = 0; j < gSize; j++) {
        lineOfMotionCycles[j] = {left: null, right: null};
        columnOfMotionCycles[j] = {up: null, down: null};
      }
    
      motionCyclesMap[i] = {row: lineOfMotionCycles, column: columnOfMotionCycles};
      motionRegister[i] = {row: new Array(4), column: new Array(4), context: null};
    }
    
    return [motionCyclesMap, motionRegister];
  }



  Object.defineProperties(MotionHandler.prototype, {
    isNewMotion: {
      value: function(gridId, lineType, lineIndex, direction) {
        return this.motionRegister[gridId][lineType][lineIndex]?.direction !== direction;
      }
    },


    isConflitantMotion: {
      value: function(gridId, lineType, lineIndex, direction) {
        const motionCycle = this.motionCyclesMap[gridId][lineType][lineIndex][direction];
        const motionRegister = this.motionRegister;

        for (let i = motionCycle?.length; i--;) {
          const [gridId, lineType, lineIndex, direction] = motionCycle[i];
          const contextMotion = motionRegister[gridId].context ?? lineType;

          // test if have a moviment in course by lineType of every motion on motionCycle
          if (motionRegister[gridId][lineType][lineIndex]) return true;

          // test if have a crosses motion by lineType of every motion on motionCycle
          if (contextMotion !== lineType) return true;
        }
        return false;
      }
    },


    loadRules: {
      value: function (rules, gSize, qGrids) {
        const {cycles, triggers, read: rulesHasBeenRead, error} = readRules(rules, gSize, qGrids);


        if (!rulesHasBeenRead) {
          return {read: false, error};
        }

        const [motionCyclesMap, motionRegister] = createMapAndRegisterStructure(gSize, qGrids);
        const {haveCrosses, configure} = getCyclesMapConfigurator(motionCyclesMap);

        for (const [marker, cycle] of Object.entries(cycles)) {
          const crossFind = haveCrosses(cycle);

          if (crossFind.found) {
            const [cycle1, cycle2] = crossFind.conflict;

            return {
              read: false,
              error: `found a conflitant motion-cycle (${cycle1} cross ${cycle2})`
            };
          }
        }

        for (const [marker, fires] of Object.entries(triggers)) {
          const configuration = configure(fires, cycles[marker])

          if (configuration.state === 'fail') {

            return {
              read: false,
              error: `tried to overwrite trigger reference (${configuration.old} to ${configuration.new})`
            };
          }
        }

        this.motionCyclesMap = motionCyclesMap;
        this.motionRegister = motionRegister;

        return {read: true, error};
      }
    },


    getRulesConfigurator: {
      value: function (qGrids, gSize) {
        const [motionCyclesMap, motionRegister] = createMapAndRegisterStructure(gSize, qGrids);
        
        const handler = this;

        let configurated = false;

        return {
          configurator: getCyclesMapConfigurator(motionCyclesMap),

          apply() {
            if (!configurated) {
              handler.motionCyclesMap = motionCyclesMap;
              handler.motionRegister = motionRegister;

              configurated = true;
            }
          }
        }
      }
    },


    applyMoviment: {
      value: function (gridId, lineType, lineIndex, direction) {

        const motionCycle = this.motionCyclesMap[gridId][lineType][lineIndex][direction];
        const motionRegister = this.motionRegister; 
        const grids = this.grids;
        const motionList = [];


        for (let i = 0, cells = distance = null; i < motionCycle.length; i++) {
          const [gridId, lineType, lineIndex, direction] = motionCycle[i];

          grid = grids[gridId];
          distance = lineType === 'row'? grid.cellWidth : grid.cellHeight;
          cells = grid.getLine(lineType, lineIndex);

          motionList.push(move(cells, direction, distance));

          motionRegister[gridId][lineType][lineIndex] = {direction, cells}
          motionRegister[gridId].context = lineType;
        }

        Promise.all(motionList)
          .then((linesList) => {
            permuteExpelleds(linesList, motionCycle);
            relocateCells(grids, motionCycle);
            clearRegister(motionRegister, motionCycle)
          })
          .catch(() => {
            relocateCells(grids, motionCycle);
            clearRegister(motionRegister, motionCycle)
          });
      }
    },

  });
})();
