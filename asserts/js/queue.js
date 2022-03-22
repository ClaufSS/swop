
function Node(value) {
	this.value 	= value;
	this.next 	= null
}

function Queue(max) {
	this.max = max;
	this.rear = null;
	this.front = null;
	this.length = 0;
}


(function() {
	Object.defineProperties(Node.prototype, {
		//
	});

	Object.defineProperties(Queue.prototype, {
		getList: {
			value: function() {
				const list = [];
				let pointer = this.front;

				while (pointer) {
					list.push(value);
					pointer = pointer.next;
				}

				return list;
			}
		},
		enqueue: {
			value: function(value) {
				const node = Node(value);

				if (this.rear === null) {
					this.front = node;
				} else {
					this.rear.next = node;
				}

				if (this.max && this.length === this.max) {
					this.front = this.front.next;
				} else {
					this.length++;
				}

				this.rear = node;
			}
		},
		dequeue: {
			value: function() {
				const dequeued = this.front.value;

				if (this.length === 1) {
					this.front = this.rear = null;
				} else {
					this.front = this.front.next;
				}

				this.length--;

				return dequeued;
			}
		},
		clear: {
			value: function() {
				this.front = this.rear = null;
				this.length = 0;
			}
		}
	});

})();
