/* tests.js
* Created by: knod
* Date: 03/11/14
* Page for testing things randomly
* 	Right now trying to test dragable geometry stuff
* 
* Sources:
* 
* TODO:
* --- Phases ---
* - Make circles draggable
* - Make circles draggable around a centerpoint
* - Make circles show their degree value in relation
* to the right side horizon
* --- Probability ---
* - Make rectangle center draggable
* - Display percentage of area covered by each rectangle
* 
* 
* DONE:
* 
*/

$(document).ready(function() {
	// *** SETUP ***\\
	// Should updating be called right now?
	runUpdate = false;


	// *** EVENT LISTENERS ***\\
	$(".circle")
	// Start dragging on mousedown
	.on("mousedown", function () {
		console.log("mousedown");
		runUpdate = true;
		// From what I can tell, this runs an update function
		requestAnimationFrame(update);
	})
	// Stop dragging on mouseup
	.on("mouseup", function() {

		console.log("mouseup");
		runUpdate = false;
		console.log("****************")
	})
	;

	function update() {
		/* (None) -> None

		Update all the elements that need updating
		*/

		console.log("-");

		// Keeps running update if appropriate
		if (runUpdate) {requestAnimationFrame(update);}

	}

});