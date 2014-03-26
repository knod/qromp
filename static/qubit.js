/* qubit.js
* Created by: 
* Date: 03/24/14
* Trying to override the visualizer to implement new
* qubit display
* 
* Notes:
* examples:
* ((u2 1 0.3 1.6 1 0))
* ((hadamard 0))
* ((u-theta 0.6 0))
* 
* Sources:
* 
* TODO:
*
* DONE:
* 
*/

$(document).ready(function() {
	// *** SETUP ***\\
	var mouseX = null, mouseY = null
	, canDragPhase = false, canDragProb = false
	, $toDrag = null, $probDiv = null
	// , $circle = $(".circle"), circRadius = $circle.outerWidth()/2
	// , $qubit = $(".qubit"), qRadius = $qubit.outerWidth()/2
	// , radius = 70
	;

	// When mouse moves on circle (perhaps make this
	// on any manipulatable element)
	$("#qubitElements").on("mousemove", function (evt) {
		// For some reason, while dragging mousemove works
		// even out of .one-qubit, but it
		// DIDN'T work when the same was done for .circle
		// (though it doesn't do as well outside .one-qubit)
		var $this = $(this);

		// If the mouse is down on an object
		if (canDragPhase) {
			// Get coords of the mouse
			mouseX = evt.pageX; mouseY = evt.pageY;
			dragCircle($this);
		}
		if (canDragProb) {
			// Get coords of the mouse
			mouseX = evt.pageX; mouseY = evt.pageY;
			dragProb($probDiv);
		}
	})
	;

	// *** EVENT LISTENERS ***\\
	// Start dragging on mousedown
	$("#visualizer").on("mousedown", ".circle", function (evt) {
		// console.log(".circle");
		// Set an item to drag, allow it to be dragged
		$toDrag = $(this);
		canDragPhase = true;
	});

	$("#qubitElements").on("mousedown", ".prob-div", function (evt) {
		// console.log(".prob-div");
		// Drag the prob where they take it
		var $this = $(this);
		$probDiv = $(evt.target).parent();
		canDragProb = true;
		// Change midpoint on click as well
		mouseX = evt.pageX; mouseY = evt.pageY;
		dragProb($probDiv);
	})
	;

	// On document so that if they go out of the
	// div without lifting the mouse, dragging will
	// still stop
	// Stop dragging on mouseup
	$(document).on("mouseup", function() {
		canDragPhase = false;
		canDragProb = false;
	})

	// // Testing
	// $(document).on("mousedown", function (evt) {
	// 	console.log($(evt.target).attr("class"));
	// })

	function dragCircle($container) {
		/* ($ object) -> None

		Drag the circle in its idiom:
		-- s-man --
		Find the angle between the center and your mouse.
		Make that the angle between the center and the
		object and then use the distance to place it
		*/

		var qAngle = $toDrag.parent().data("angle");

		var clientRect = $toDrag.parent()[0].getBoundingClientRect();
		var qCenterX = clientRect.left + clientRect.width/2;
		var qCenterY = clientRect.top + clientRect.height/2;
		var angleToMouse = Math.atan2((mouseX - qCenterX), (mouseY - qCenterY));
		var newAngle = angleToMouse * (180/Math.PI);
		// Get it to mesh with o's numbers :P
		// Get 0 to be at the "top" of the qubit
		if (newAngle <=0) {newAngle += 180;}
		else {newAngle -= 180;}
		// (not quite right) Account for the qubit's existing angle
		newAngle += qAngle;
		// Get it to travel in the right direction
		newAngle = -newAngle;

		var qubitObj = $toDrag.parent().data("qubitobj");

		// Change phase values
		if ($toDrag.hasClass("up-phase")) {
			qubitObj.UP.phase = newAngle;
		}
		else {
			qubitObj.DOWN.phase = newAngle;
		}

		// Rerender everything
		qubits.render();
	}

	function dragProb($probDiv) {
		/* ($ object) -> None

		Drag the rectangles in their idiom - their
		meeting point is wherever the mouse goes.
		Max of 100, min of 0
		*/

		// // http://stackoverflow.com/questions/14651306/get-mouse-position-within-div
		// // New meeting point for the prob divs
		// var newMidpoint = mouseY - $probDiv.offset().top;
		// // Limit it to max 100, min 0
		// newMidpoint = Math.min($probDiv.innerHeight(), Math.max(0, newMidpoint));
		// // Change the heights of the probability divs
		// $probDiv.find(".prob-up").css({height: newMidpoint + "px"});
		// var downHeight = $probDiv.innerHeight() - newMidpoint;
		// $probDiv.find(".prob-down").css({height: downHeight + "px"});
	}
});


var qubits = [];

qubits.render = function() {
	var n = this.length,
		theta = 2 * Math.PI / n,
		T = Math.tan(theta / 2),
		radius = 0,
		visSpace = Math.min($visualizer.height(), $visualizer.width()),
		size = visSpace;
	if (n > 1) {
		if (n === 2) {
			size = visSpace / 2;
			radius = (visSpace - size) / 2;
		} else if (n % 2 === 0) {
			size = visSpace * T / (1 + 2 * T);
			radius = (visSpace - size) / 2;
		} else {
			var phi = theta * (n - 1) / 2,
				psi = phi / 2 - Math.PI / 4; 
			size = 2 * visSpace / (Math.SQRT2 * ((1 + 1 / T) * Math.sqrt(1 - Math.cos(phi)) + 2 * Math.cos(psi)));
			radius = size / 2 + (size / 2) / T;
			var yOffset = (radius + size * (1 / 2 - 1 / (2 * Math.sin(theta / 2)) - Math.cos(theta / 2))) / 2;
		}
	}
	$("#qubitElements").css({"margin-top": (yOffset || 0) / rem + "rem"});
	for (var i = 0, angle = 0; i < n; i++, angle += 360 / n){
		this[i].render(.8 * size).css({
			"transform": "translate(-50%, -50%) rotate(" +
			angle + "deg) translateY(" +
			-radius / rem + "rem)"
		})
		.data("angle", angle)
		;
	}
}

qubits.update = function(qubitStates) {
	for (var i = 0; i < qubitStates.length; i++){
		if (!this[i]) {
			new Qubit(qubitStates[i]);
		} else {
			this[i].UP = qubitStates[i].UP;
			this[i].DOWN = qubitStates[i].DOWN;
			this.render();
		}
	}
}

qubits.pop = function() {
	if (this.length > 1){
		this[this.length - 1].$div.remove();
		Array.prototype.pop.call(this);
		this.render();
	}
}

qubits.reset = function() {
	for (var i = 0; i < this.length; i++){
		this[i].reset();
	}
}

function Qubit(qubitState) {
	if (qubits.length < 10) {
		if(qubitState){
			this.UP = qubitState.UP;
			this.DOWN = qubitState.DOWN;
		} else {
			this.UP = {prob: 1, phase: 0};
			this.DOWN = {prob: 0, phase: 0};
		}
		this.label = qubits.length;
		// One qubit div
		this.$div = $("<div id='qubit-"+ this.label +"' class='qubit'>"
			+ "<div class='prob-div'>"
				+ "<div class='up-prob'></div><div class='down-prob'></div>"
			+ "</div>"
			// The orbiting circle divs
			+ "<div class='circle down-phase'></div><div class='circle up-phase'></div>"
			+ "</div>");
		this.$div.data("qubitobj", this);
		$("#qubitElements").append(this.$div);
		qubits.push(this);
		qubits.render();
	}
}

Qubit.prototype.render = function(size) {
	var $thisDiv = this.$div;

	$thisDiv.css({
		"width": (size / rem) + "rem",
		"height": (size / rem) + "rem"
	}).find(".up-prob").css({"height": this.UP.prob * 100 + "%"});
	$thisDiv.find(".up-phase").css({"transform":
		"translate(-50%, -50%) rotate(" + this.UP.phase
		+ "deg) translateY("
		+ -(size/2 - .1 * size) / rem + "rem)"});
	$thisDiv.find(".down-phase").css({"transform":
		"translate(-50%, -50%) rotate(" + this.DOWN.phase
		+ "deg) translateY("
		+ -(size/2 - .1 * size) / rem + "rem)"});
	return $thisDiv;
}

Qubit.prototype.reset = function() {
	this.UP = {prob: 1, phase: 0};
	this.DOWN = {prob: 0, phase: 0};
}
