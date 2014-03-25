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
<<<<<<< HEAD
	, $qubit = $(".qubit"), qRadius = $qubit.outerWidth()/2
=======
	// , $qubit = $(".one-qubit"), qRadius = $qubit.outerWidth()/2
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
	// , radius = 70
	;

	// When mouse moves on circle (perhaps make this
	// on any manipulatable element)
<<<<<<< HEAD
	$("#qubitElements").on("mousemove", function (evt) {
=======
	$(".one-qubit").on("mousemove", function (evt) {
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
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
<<<<<<< HEAD
	$("#visualizer").on("mousedown", ".circle", function (evt) {
		// console.log(".circle");
=======
	$(".circle").on("mousedown", function () {
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
		// Set an item to drag, allow it to be dragged
		$toDrag = $(this);
		canDragPhase = true;
	});

<<<<<<< HEAD
	$("#qubitElements").on("mousedown", ".prob-div", function (evt) {
		// console.log(".prob-div");
=======
	$(".qubit").on("mousedown", function (evt) {
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
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

<<<<<<< HEAD
	// // Testing
	// $(document).on("mousedown", function (evt) {
	// 	console.log($(evt.target).attr("class"));
	// })

=======
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
	function dragCircle($container) {
		/* ($ object) -> None

		Drag the circle in its idiom:
		-- s-man --
		Find the angle between the center and your mouse.
		Make that the angle between the center and the
		object and then use the distance to place it
		*/

		// Angle between center and mouse
		// Get center pos relative to screen
		var qPageCenterX = $container.offset().left + qRadius;
		var qPageCenterY = $container.offset().top + qRadius;
		var angleToMouse = Math.atan2((mouseX-qPageCenterX), (mouseY-qPageCenterY));
		// For getting the text value: * (180/Math.PI) +
		// whatever number will put 0 where you want it

		// // Put the dot at a certain radius at that angle
		// // (remember to put the arc at the center of the
		// // object by subtracting its own radius)
		// var newX = qRadius + radius * Math.sin(angleToMouse) - circRadius;
		// var newY = qRadius + radius * Math.cos(angleToMouse) - circRadius;
		// $toDrag.css({left: newX, top: newY});

	// 	// Get and display the new value
	// 	phaseVal = Math.round(270 + (angleToMouse * (180/Math.PI))) % 360;
	// 	// Do it for the right one though
	// 	if ($toDrag.hasClass("phase-up")) {
	// 		$container.find(".phase-up-num").text(phaseVal);
	// 	}
	// 	else {$container.find(".phase-down-num").text(phaseVal);}

		// Change phase values
		if ($toDrag.hasClass("phase-up")) {
			this.UP.phase = angleToMouse;
		}
		else {
			this.DOWN.phase = angleToMouse;
		}

		$container.render();
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

<<<<<<< HEAD
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
	for (var i = 0, angle = 180; i < n; i++, angle += 360 / n){
		this[i].render(.8 * size).css({
			"-webkit-transform": "translate(-50%, -50%) rotate(" +
			angle + "deg) translateY(" +
			radius / rem + "rem)"
=======
qubits.arrange = function(percentMargin, percentSpacing) {
	var percentMargin = percentMargin || .9,
		percentSpacing = percentSpacing || .1,
		n = this.length,
		limitingDim = Math.min($visualizer.height(), $visualizer.width()),
		dim = percentMargin * limitingDim;
	if (n === 1) {
		var size = dim * (1 - 2 * percentSpacing);
		this[0].render(size);
	} else {
		var size = 225 / Math.pow(n, .6),
			radius = (dim - size) / 2;
		this.render(size, radius);
	}
}

qubits.render = function(size, radius, yOffset) {
	var radius = radius || 0,
		numQubits = this.length;
	$("#qubitsElements").css({"margin-top": (yOffset || 0) / rem + "rem"});
	for (var i = 0, angle = 180; i < numQubits; i++, angle += 360 / numQubits){
		this[i].render(size).css({
			"transform": "translate(-50%, -50%) rotate(" +
			angle + "deg) translateY(" +
			radius / rem + "rem) rotate(-" +
			angle + "deg)"
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
		});
	}
}

qubits.update = function(qubitStates) {
	for (var i = 0; i < qubitStates.length; i++){
		if (!this[i]) {
			new Qubit(qubitStates[i]);
		} else {
			this[i].UP = qubitStates[i].UP;
			this[i].DOWN = qubitStates[i].DOWN;
<<<<<<< HEAD
			this.render();
=======
			this.arrange();
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
		}
	}
}

qubits.pop = function() {
	if (this.length > 1){
		this[this.length - 1].$div.remove();
		Array.prototype.pop.call(this);
<<<<<<< HEAD
		this.render();
=======
		this.arrange();
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
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
<<<<<<< HEAD
		this.$div = $("<div id='qubit-"+ this.label +"' class='qubit'"
			+ " data-qubitobj=" + this + ">"
			+ "<div class='prob-div'>"
				+ "<div class='up-prob'></div><div class='down-prob'></div>"
			+ "</div>"
			// The orbiting circle divs
			+ "<div class='circle phase-up'></div><div class='circle phase-down'></div>"
			+ "</div>");
		console.log(this.$div);
		console.log(this.$div.data("qubitobj"));
		$("#qubitElements").append(this.$div);
		qubits.push(this);
		qubits.render();
=======
		this.$div = $("<div id='qubit-"+ this.label +"' class='qubit'>"
			// The orbiting circle divs
			+ "<div class='circle phase-up'></div><div class='circle phase-down'></div>"
			+ "<div class='up-prob'></div><div class='down-prob'></div>"
			+ "</div>");
		$("#qubitElements").append(this.$div);
		qubits.push(this);
		qubits.arrange();
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024
	}
}

Qubit.prototype.render = function(size) {
	var $thisDiv = this.$div;

	// Move up-prob only
	$thisDiv.css({
		"width": (size / rem) + "rem",
		"height": (size / rem) + "rem"
<<<<<<< HEAD
	}).children(".prob-div").children(".up-prob").css({"height": this.UP.prob * 100 + "%"});
=======
	}).children(".up-prob").css({"height": this.UP.prob * 100 + "%"});
>>>>>>> 5343172bdcc189fa394284f8d0ccc34eff2f7024

	// Seth math magic to move circles around
	// Ex to play with: ((u2 1 0.3 1.6 1 0))
	$thisDiv.children(".phase-up").css({"transform":
		"translate(-50%, -50%) rotate(" + this.UP.phase
		+ "deg) translateY("
		+ -(size/2 - .11 * size) / rem + "rem)"});

	$thisDiv.children(".phase-down").css({"transform":
		"translate(-50%, -50%) rotate(" + this.DOWN.phase
		+ "deg) translateY("
		+ -(size/2 - .11 * size) / rem + "rem)"});

	// // Calculate position of each circle (-180 - 180)
	// // This should be elsewhere
	// var circRadius = $(".circle").outerWidth()/2
	// , qRadius = $(".qubit").outerWidth()/2
	// , newUpX = qRadius * Math.sin(this.UP.phase)
	// , newUpY = qRadius * Math.cos(this.UP.phase)
	// , newDownX = qRadius * Math.sin(this.DOWN.phase)
	// , newDownY = qRadius * Math.cos(this.DOWN.phase)
	// ;
	// // Place circles
	// $thisDiv.children(".phase-up").css({left: newUpX + "px", top: newUpY + "px"});
	// $thisDiv.children(".phase-down").css({left: newDownX + "px", top: newDownY + "px"});
	return $thisDiv;
}

Qubit.prototype.reset = function() {
	this.UP = {prob: 1, phase: 0};
	this.DOWN = {prob: 0, phase: 0};
}
