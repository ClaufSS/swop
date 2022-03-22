const isAdjustSize = function (grid) {}


function Grid(parent, size) {
	const elem = document.createElement('div');

	parent.appendChild(elem);
	elem.classList.add('game-grid')

	this.docElement = elem;
	this.size = size;
}


Grid.prototype.addCell = function (cell) {
	const elem = cell.docElement;

	this.docElement.appendChild(elem);

	elem.style.width = elem.style.height = `${100/this.size}%`;

	cell.x = cell.column * cell.width;
	cell.y = cell.line * cell.height;
}


function Cell(value) {
	const container = document.createElement('div');
	const box = document.createElement('div');
	const vl = document.createElement('p');

	container.classList.add('game-cell-container');
	vl.classList.add('game-cell-value');
	box.classList.add('game-cell-box');

	container.appendChild(vl);
	container.appendChild(box);
	
	vl.innerText = `${value}`;

	this.docElement = container;
	this.column = undefined;
	this.line = undefined;
    this.value = value;
}


const props = {
	x: {
		get: function() {
			return this.docElement.getBoundingClientRect().left;
		},
		set: function(value) {
			this.docElement.style.left = `${value}px`;
		}
	},
	y: {
		get: function() {
			return this.docElement.getBoundingClientRect().top;
		},
		set: function(value) {
			this.docElement.style.top = `${value}px`;
		}
	},
	width: {
		get: function() {
			return this.docElement.getBoundingClientRect().width;
		}
	},
	height: {
		get: function() {
			return this.docElement.getBoundingClientRect().height;
		}
	}
}

Object.defineProperties(Cell.prototype, props);
Object.defineProperties(Grid.prototype, props);
