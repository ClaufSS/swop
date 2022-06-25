
  
function manager() {
  const gameProps = {
    gSize: 0,
    qGrids: 0,
    board: null,
    gDisposition: {},
    state: 'nulled',
    showIndicators: false,
    motionHandler: new MotionHandler()
  }


  const defaultValidator = (gridId, cellRow, cellColumn, cellValue) => {
    return ((cellRow * gridSize) + cellColumn) == cellValue;
  }


  const resize = () => {
    for (const grid of gameProps.motionHandler.grids) {
      const {clientWidth: ctnrW, clientHeight: ctnrH} = grid.container;
      const minSide = Math.min(ctnrW, ctnrH) * .9;
      
      grid.width = grid.height = minSide;
      // centering vertically
      grid.box.style.top = ((ctnrH - minSide) / 2) + 'px';
      // readjust position and size of cells
      grid.positionateCells();
    }
  }


  const setTemplate = () => {
    const screenOrientation = window.screen.orientation.type.split('-').at(0);
    const [nrows, ncolumns] = gameProps.gDisposition[screenOrientation];
    const board = gameProps.board;

    board.style.gridTemplateRows = `repeat(${nrows}, 1fr)`;
    board.style.gridTemplateColumns = `repeat(${ncolumns}, 1fr)`;
  }
  
  
  const createGrids = () => {
    const {board, gSize, qGrids, motionHandler: {grids,}} = gameProps;
    
    if (grids.length > 0) clearArray(grids, grid => grid.element.remove());
    
    for (let h = 0; h < qGrids; h++) {
      const grid = grids[h] = new Grid(board, gSize);
      
      for (let i = 0; i < gSize; i++)  {
        for (let j = 0; j < gSize; j++) {
          grid.addCell(new Cell(), i, j);    
        }
      }
  
      // add tracker for mouse
      mouseTracker(grid.box,
        { onSwipe },
        {
          stopWhenLeave: true,
          buttons: [1,]
        }
      );
  
      // add tracker for touches
      touchTracker(grid.box,
        { onSwipe },
        {
          stopWhenLeave: true,
        }
      );          
    }
    
    shuffleCells();
  }
  

  const shuffleCells = () => {
    const {gSize, qGrids, motionHandler: {grids,}} = gameProps;

    const nums = shuffle(range(gSize * gSize * qGrids));
    
    for (let h = qGrids; h--;) {
      for (let line = gSize; line--;) {
        for (let column = gSize; column--;) {
          const cell = grids[h].cells[line][column];
          
          cell.text = nums[(h * gSize + line) * gSize + column];
        }
      }
    }
  }


  const headers = {

    start() {
      if (gameProps.state === 'stoped') {
        gameProps.state = 'runing';
      }
    },
    
    
    stop() {
      if (gameProps.state === 'runing') {
        gameProps.state = 'stoped';
      }
    },


    updateGame() {
      shuffleCells();
    },


    get state() {
      return gameProps.state;
    },


    configure(board, configurations) {
      const {
        motionRules: rules,
        grids: {size: gSize, quantity: qGrids, disposition: gDisposition}
      } = configurations;

      const {read, error} = gameProps.motionHandler.loadRules(rules, gSize, qGrids);

      gameProps.gSize        = gSize;
      gameProps.qGrids       = qGrids;
      gameProps.gDisposition = gDisposition;
      gameProps.board        = board;

      if (read) {
        createGrids();
        setTemplate();
        resize();

        gameProps.state = 'stoped';

        return {state: 'done', error};
      }

      gameProps.state = 'nulled';

      return {state: 'fail', error};
    },


    checkGame(validatior = defaultValidator) {
      const {gSize, state, motionHandler} = gameProps;

      if (state === 'nulled') return false;

      return motionHandler.grids.every((grid, gridId) => {
        
        let
          validation = false,
          cellValue = null;


        for (let cellRow = 0; cellRow < gSize; cellRow++)  {
          for (let cellColumn = 0; cellColumn < gSize; cellColumn++) {

            cellValue = grid.cells[cellRow][cellColumn].text;
            validation = validatior(gridId, cellRow, cellColumn, cellValue);

            if (!validation) return false;
          }
        }

        return true;
      });
    },
    
    disableIndicators() {
      gameProps.showIndicators = false;
    },
    
    enableIndicators() {
      gameProps.showIndicators = true;
    },
  };

  
  const transformToLineType = motionType => {
    if (motionType === 'horizontal') return 'row';
    if (motionType === 'vertical') return 'column';
  }


  function onSwipe(motion, {motionType, direction}, target) {
    motion.stopTracking();

    const {state, motionHandler, motionHandler: {grids,}} = gameProps;
    const lineType = transformToLineType(motionType);

    if (state !== 'runing')
      return;
    

    for (let gridId = 0, grid; grid = grids[gridId], gridId < grids.length; gridId++) {
      //const grid = grids[gridId];
      
      if (grid.box === target) {
        let lineIndex = grid.getLineId(lineType, motion.x, motion.y);
        
        if (motionHandler.isNewMotion(gridId, lineType, lineIndex, direction)) {
          if (motionHandler.isConflitantMotion(gridId, lineType, lineIndex, direction))
            break;
        }

        motionHandler.applyMoviment(gridId, lineType, lineIndex, direction);

        break;
      }
    }
  }

  window.addEventListener('resize', resize);
  window.screen.orientation.onchange = setTemplate;

  return headers;
}