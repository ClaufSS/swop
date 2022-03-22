
const TIME_ANIMATTION = 250;


function manager(gridContainer, gridSize) {
	let cells = [];
	let inActivity = true;

	const grid = new Grid(gridContainer, gridSize);

	const handler = {
		get inActivity() {
			return props.inActivity;
		},


		createCells() {
			const cellsNums = [];

			for (let i = grid.size * grid.size; i; cellsNums[--i] = i);
			
			shuffle(cellsNums);

			for (let i = 0; i < grid.size; i++)  {
				for (let j = 0; j < grid.size; j++) {

					const cellNum = cellsNums[i * grid.size + j];
					const cell = new Cell(cellNum);

					cell.line = i;
					cell.column = j;
					cells.push(cell);
					grid.addCell(cell);
				}
			}
		},


		getLineId(x, y) {
			return Math.floor((y - grid.y) / (grid.height / grid.size));
		},


		getLinePieces(id) {
			const line = [];

			for (let i = 0; i < cells.length; i++) {
				if (cells[i].line === id) {
					line.push(cells[i]);
				}
			}
			return line;
		},
        
        
		getColumnId(x, y) {
			return Math.floor((x - grid.x) / (grid.width / grid.size));
		},


		getColumnPieces(id) {
			const column = [];

			for (let i = 0; i < cells.length; i++) {
				if (cells[i].column === id) {
					column.push(cells[i]);
				}
			}
			return column;

		},


        checkGrid(gridID) {
            const cellsDisposition = Array(grid.size);
            let value = undefined;
            let result = true;
            
            // Get cells in order 
            for (let i = 0; i < cells.length;
                cellsDispositon[cells[i].line] = cells[i], i++);
            
            // Verify sequence
            for (let i = 0; i < cellsDispositon.length - 1; i++) {
                value = cellsDispositon[i].value;
                
                if (!(cellsDispositon[i+1].value === value + 1)) {
                    result = false;
                    break;
                }
            }
            return result;
        },

		// Concept
		// When the player move a line or column comes a 'space-blank' in the opposite direction of moviment
		// 
		// Idea
		// Fill the space-blank with one temporary cell with value of cell being pushed out of grid, on moviment end, this need to be deleted
		extensionCell(motionID, motionType, direction) { },


		relocate(cells, motionType, direction) {
			let increment, indexOfPushed, newIndexOfPushed, selectorType;

			if (motionType === 'line') selectorType = 'column';
			if (motionType === 'column') selectorType = 'line';

			if (direction === 'right' || direction === 'down') {
				[increment, indexOfPushed, newIndexOfPushed] = [1, grid.size - 1, 0];
			}

			if (direction === 'left' || direction === 'up') {
				[increment, indexOfPushed, newIndexOfPushed] = [-1, 0, grid.size - 1];
			}

			for (const cell of cells) {
				if (cell[selectorType] === indexOfPushed) {
					cell[selectorType] = newIndexOfPushed;

				} else {
					cell[selectorType] += increment;
				}
				cell.x = (cell.column * cell.width);
				cell.y = (cell.line * cell.height);
			}
		},


		endMoviment(motionID) { },


		move(cells, motionID, motionType, direction) {
            
			let origin, target, _move;

			if (motionType === 'line') {
				_move = (cell, value) => cell.x = cell.column * cell.width + value;

				if (direction === 'right') [origin, target] = [0, grid.width / grid.size];
				if (direction === 'left') [origin, target] = [0, - grid.width / grid.size];
			}

			if (motionType === 'column') {
				_move = (cell, value) => cell.y = cell.line * cell.height + value;

				if (direction === 'down') [origin, target] = [0, grid.height / grid.size];
				if (direction === 'up') [origin, target] = [0, - grid.height / grid.size];
			}

			const an = new Animate(TIME_ANIMATTION, 'easeOutQuad', { to: {value: target} });

			// start mediator
			an.start({value: origin}, {
				onProgress: (mediator) => {
					for (const cell of cells) {
						_move(cell, mediator.value);
					}
				},
				onEnd: () => {
					this.relocate(cells, motionType, direction);
				}
			});
		},


		applyMovement(motion, motionType, direction) {
            let cellsToMove, motionID;
			
			if (motionType === 'line') {
				motionID = this.getLineId(motion.x, motion.y);
				cellsToMove = this.getLinePieces(motionID);
			}

			if (motionType === 'column') {
				motionID = this.getColumnId(motion.x, motion.y);
				cellsToMove = this.getColumnPieces(motionID);
			}

			this.move(cellsToMove, motionID, motionType, direction);
		}
	};


	function onMove(motionList) {
		for (const motion of motionList) {
			const details = motion.swipeDetails;

			if (details !== undefined) {
				handler.applyMovement(motion, details.motionType, details.direction);
				motion.stopTracking();
			}
		}
	}

	function onEndMove(dPosList) {	}

	mouseTracker(grid.docElement,
		{ onMove },
		{
			swipe: true,
			watchLeave: true,
			buttons: [1,]
		});

    touchTracker(grid.docElement,
    	{ onMove },
    	{
    		swipe: true,
    		watchLeave: true,
    	});

    keyboardTracker()
    
	return handler;
}

