

//const isAdjustSize = function (grid) {}


function Grid(board, size) {
  this.container  = document.createElement('div');
  this.indicators = document.createElement('div');
  this.box        = document.createElement('div');
  
  this.container.classList.add('grid-container');
  this.indicators.classList.add('grid');
  this.box.classList.add('grid-box');

  this.container.appendChild(this.box);
  board.appendChild(this.container);
  
  this.size = size;

  const cells = this.cells = [];

  for (var i = 0; i < size; i++) {
    cells[i] = new Array(size);
  }
}


function Cell() {
  this.container = document.createElement('div');
  this.box       = document.createElement('div');
  this.cellText  = document.createElement('p');

  this.container.classList.add('cell-container');
  this.cellText.classList.add('cell-value');
  this.box.classList.add('cell-box');

  this.box.appendChild(this.cellText);
  this.container.appendChild(this.box);
}


function Indicators() {
  //
}


Object.defineProperties(Cell.prototype, {
  x: {
    get: function() {
      const container = this.container;
      const cellLeft = container.getBoundingClientRect().left;
      const gridLeft = container.parentElement.getBoundingClientRect().left;

      return cellLeft - gridLeft;
    },
    
    set: function(value) {
      this.container.style.left = metricValidation(value);
    }
  },
  
  y: {
    get: function() {
      const container = this.container;
      const cellTop = container.getBoundingClientRect().top;
      const gridTop = container.parentElement.getBoundingClientRect().top;

      return cellTop - gridTop;
    },
    
    set: function(value) {
      this.container.style.top = metricValidation(value);
    }
  },
  
  width: {
    get: function() {
      return this.container.getBoundingClientRect().width;
    },
    set: function(value) {
      this.container.style.width = metricValidation(value);
    }
  },
  
  height: {
    get: function() {
      return this.container.getBoundingClientRect().height;
    },
    set: function(value) {
      this.container.style.height = metricValidation(value);
    }
  },
  
  text: {
    get: function() {
      return this.cellText.innerText;
    },
    set: function(value) {
      this.cellText.innerText = value;
    }
  },
});


Object.defineProperties(Grid.prototype, {
  x: {
    get: function() {
      return this.box.getBoundingClientRect().left;
    },
    
    set: function(value) {
      this.box.style.left = metricValidation(value);
    }
  },

  y: {
    get: function() {
      return this.box.getBoundingClientRect().top;
    },
    
    set: function(value) {
      this.box.style.top = metricValidation(value);
    }
  },

  width: {
    get: function() {
      return this.box.getBoundingClientRect().width;
    },
    set: function(value) {
      this.box.style.width = metricValidation(value);
    }
  },

  height: {
    get: function() {
      return this.box.getBoundingClientRect().height;
    },
    set: function(value) {
      this.box.style.height = metricValidation(value);
    }
  },

  addCell: {
    value: function (cell, row, column) {
      this.displayCell(cell, row, column);
      this.cells[row][column] = cell;
    }
  },
  
  displayCell: {
    value: function (cell, row, column) {
      this.box.appendChild(cell.container);
      this.positionateCell(cell, row, column);
    }
  },

  positionateCell: {
    value: function (cell, row, column, cellWidth, cellHeight) {
      cell.x = column * (cell.width = cellWidth || this.cellWidth);
      cell.y = row * (cell.height = cellHeight || this.cellHeight);
    }
  },

  positionateCells: {
    value: function () {
      const {cellWidth, cellHeight, size, cells} = this;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          this.positionateCell(cells[i][j], i, j, cellWidth, cellHeight);
        }
      }
    }
  },

  cellWidth: {
    get: function() {
      return this.width / this.size;
    }
  },

  cellHeight: {
    get: function() {
      return this.height / this.size;
    }
  },

  getRowId: {
    value: function(x, y) {
      return Math.floor((y - this.y) / (this.height / this.size));
    }
  },

  getRow: {
    value: function(id) {
      return [...this.cells[id]];
    }
  },
    
  getColumnId: {
    value: function(x, y) {
      return Math.floor((x - this.x) / (this.width / this.size));
    }
  },

  getColumn: {
    value: function(id) {
      const column = [];

      for (let i = 0; i < this.size; i++) {
        column.push(this.cells[i][id]);
      }

      return column;
    }
  },

  getLineId: {
    value: function(type, x, y) {
      if (type === 'row') return this.getRowId(x, y);
      if (type === 'column') return this.getColumnId(x, y);
    }
  },

  getLine: {
    value: function(type, xORid, y) {
      const bypos = arguments.length === 3 && xORid !== undefined && y !== undefined;

      if (type === 'row') {
        if (bypos)
          return this.getRow(this.getRowId(xORid, y));
        else
          return this.getRow(xORid);
      }
      if (type === 'column') {
        if (bypos)
          return this.getColumn(this.getColumnId(xORid, y));
        else
          return this.getColumn(xORid);
      }
      
      //throw new Error(`lineType must be 'row' or 'column' not ${type}`);
    }
  },
  
  preview: {
    value: function() {
      return;
    }
  },
});
