/* tests.js
* Created by: knod
* Date: 03/11/14
* Page for testing things randomly
* 	Right now trying to test dragable geometry stuff
* 
* Sources:
* 1. Possibly useful in future
* http://stackoverflow.com/questions/10149057/how-to-grab-and-drag-an-element-around-a-circle
* 
* TODO:
* --- General ---
* - Make resize function
* --- Phases ---
* - Make circles show their degree value in relation
* to the right side horizon
* --- Probability ---
* - Make rectangle center draggable
* - Display percentage of area covered by each rectangle
* 
* 
* DONE:
* - [DONE] Make circles draggable
* - [DONE] Make circles draggable around a centerpoint
* - [DONE, it worked by setting the origin not in the element
* itself] Look into this: http://jsfiddle.net/sandeeprajoria/x5APH/11/
* from this:
* http://stackoverflow.com/questions/10149057/how-to-grab-and-drag-an-element-around-a-circle
* 
*/

var canDragPhase = false, canDragProb = false;

$(document).ready(function() {
	// *** SETUP ***\\
	var mouseX = null, mouseY = null
	, $toDrag = null, $probDiv = null
	, $circle = $(".circle"), circRadius = $circle.outerWidth()/2
	, $qubit = $(".one-qubit"), qRadius = $qubit.outerWidth()/2
	, radius = 70
	;

	// When mouse moves on circle (perhaps make this
	// on any manipulatable element)
	$(".one-qubit").on("mousemove", function (evt) {
		// For some reason, while dragging mousemove works
		// even out of .one-qubit, but it
		// DIDN'T work when the same was done for .circle
		// (though it doesn't do as well outside .one-qubit)

		var $this = $(this);

		// If the mouse is down on an object
		if (canDragPhase) {
			// Get coords of the mouse
			mouseX = evt.pageX;
			mouseY = evt.pageY;
			dragCircle($this);
		}

		if (canDragProb) {
			// Get coords of the mouse
			mouseX = evt.pageX;
			mouseY = evt.pageY;
			dragProb($probDiv);
		}
	})
	;

	// *** EVENT LISTENERS ***\\
	$(".circle")
	// Start dragging on mousedown
	.on("mousedown", function () {
		// Set an item to drag, allow it to be dragged
		$toDrag = $(this);
		canDragPhase = true;
	});
	$(".prob-div").on("mousedown", function (evt) {
		// Drag the prob where they take it
		var $this = $(this);
		$probDiv = $(evt.target).parent();
		canDragProb = true;
		// Change midpoint on click as well
		mouseX = evt.pageX;
		mouseY = evt.pageY;
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

		// Put the dot at a certain radius at that angle
		// (remember to put the arc at the center of the
		// object by subtracting its own radius)
		var newX = qRadius + radius * Math.sin(angleToMouse) - circRadius;
		var newY = qRadius + radius * Math.cos(angleToMouse) - circRadius;
		$toDrag.css({left: newX, top: newY});

		// Get and display the new value
		phaseVal = Math.round(270 + (angleToMouse * (180/Math.PI))) % 360;
		// Do it for the right one though
		if ($toDrag.hasClass("phase-up")) {
			$container.find(".phase-up-num").text(phaseVal);
		}
		else {$container.find(".phase-down-num").text(phaseVal);}
	}

	function dragProb($probDiv) {
		/* ($ object) -> None

		Drag the rectangles in their idiom - their
		meeting point is wherever the mouse goes.
		Max of 100, min of 0
		*/

		// http://stackoverflow.com/questions/14651306/get-mouse-position-within-div
		// New meeting point for the prob divs
		var newMidpoint = mouseY - $probDiv.offset().top;
		// Limit it to max 100, min 0
		newMidpoint = Math.min($probDiv.innerHeight(), Math.max(0, newMidpoint));
		// Change the heights of the probability divs
		$probDiv.find(".prob-up").css({height: newMidpoint + "px"});
		var downHeight = $probDiv.innerHeight() - newMidpoint;
		$probDiv.find(".prob-down").css({height: downHeight + "px"});
	}

});


/* Pseudo/Notes
-- When the circles are overlapped, which one is on top? --
Whichever one has the correspondingly higher probability


*/
