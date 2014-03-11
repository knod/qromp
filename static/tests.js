/* tests.js
* Created by: knod
* Date: 03/11/14
* Page for testing things randomly
* 	Right now trying to test dragable geometry stuff
* 
* Sources:
* 
* TODO:
* --- General ---
* - Make resize function
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

var runDrag = false;

$(document).ready(function() {
	// *** SETUP ***\\
	// Should updating be called right now?
	 runDrag = false
	//, 
	var mouseX = null, mouseY = null
	, $toDrag = null
	, $circle = $(".circle"), circCenter = $circle.outerWidth()/2
	, $qubit = $(".one-qubit"), qCenter = $qubit.outerWidth()/2
	, radius = 50
	;

	// When mouse moves on circle (perhaps make this
	// on any manipulatable element)
	$(".one-qubit").on("mousemove", function (eve) {
		// For some reason, while dragging mousemove works
		// even out of .one-qubit, but it
		// DIDN'T work when the same was done for .circle
		// (though it doesn't do as well outside .one-qubit)

		$this = $(this);

		// If the mouse is down on an object
		if (runDrag) {
			// Get coords of the mouse
			mouseX = eve.pageX;
			mouseY = eve.pageY;
			dragCircle($toDrag);

			// Angle between center and mouse
			// Get center pos relative to screen
			var qCenterX = $this.offset().left + qCenter;
			var qCenterY = $this.offset().top + qCenter;
			var angleToMouse = ( Math.atan2((mouseX-qCenterX), (mouseY-qCenterY))
				* (180/Math.PI) ) + 180; // or "+"" whatever
			// number will put 0 where we want it

			// Put the dot at a certain radius at that angle
			newX = qCenterX + radius * Math.sin(angleToMouse);
			newY = qCenterY + radius * Math.sin(angleToMouse);
			$toDrag.css({left: newX, top: newY});
		}
	})
	;

	// *** EVENT LISTENERS ***\\
	$(".circle")
	// Start dragging on mousedown
	.on("mousedown", function () {
		// Set an item to drag, allow it to be dragged
		$toDrag = $(this);
		runDrag = true;
	})
	;

	// On document so that if they go out of the
	// div without lifting the mouse, dragging will
	// still stop
	// Stop dragging on mouseup
	$(document).on("mouseup", function() {
		runDrag = false;
	})

	function dragCircle($toDrag) {
		/* (None) -> None

		Drag the circle in its way
		*/

		// Offset of circle to put mouse in the middle
		var centerX = mouseX - circCenter;
		var centerY = mouseY - circCenter;

		$toDrag.css({ "left": centerX + "px", "top": centerY + "px" })
	}



$('#demo7_box')
        .bind('dragstart',function( event ){
                var data = $( this ).data('dragcircle');
                if ( data ) data.$circle.show(); 
                else {
                        data = { 
                                radius: 200, $circle: $([]),
                                halfHeight: $( this ).outerHeight()/2,
                                halfWidth: $( this ).outerWidth()/2
                                };
                        data.centerX = event.offsetX + data.radius + data.halfWidth,
                        data.centerY = event.offsetY + data.halfHeight,
                        // create divs to highlight the path...
                        $.each( new Array(72), function( i, a ){
                                angle = Math.PI * ( ( i-36 ) / 36 );
                                data.$circle = data.$circle.add( 
                                        $('<div class="point" />').css({
                                                top: data.centerY + Math.cos( angle )*data.radius,
                                                left: data.centerX + Math.sin( angle )*data.radius,
                                                })
                                        );
                                });
                        $( this ).after( data.$circle ).data('dragcircle', data );
                        }
                })
        .bind('drag',function( event ){
                var data = $( this ).data('dragcircle'),
                angle = Math.atan2( event.pageX - data.centerX, event.pageY - data.centerY );
                $( this ).css({
                        top: data.centerY + Math.cos( angle )*data.radius - data.halfHeight,
                        left: data.centerX + Math.sin( angle )*data.radius - data.halfWidth
                        });
                })
        .bind('dragend',function(){
                $( this ).data('dragcircle').$circle.hide();
                });

});


/* Pseudo/Notes
-- When the circles are overlapped, which one is on top? --
Whichever one has the correspondingly higher probability

-- strass --
Find the angle between the center and your mouse. Make that the
angle between the center and the object and then use the distance
to place it


*/
