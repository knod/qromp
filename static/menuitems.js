/* menuitems.js
* Created by: 
* Date: 03/07/14
* Menu item functionality
* 
* TODO:
* - Make a version of examples that's on the same page
* - Take out the dropdown menu
* - Try adding a top bar above the app
* - (Possibly) separate the toggle function into 3
* parts: toggle, open, close
* - Make a version that pushes what's on top to the
* right as well as brings things out from the left
* (basically has multiple layers and top layers are
* removed first when appropriate)
* 
* DONE:
* - [DONE] If we really do completely separate "panes" for
* each menu item, make a data value for each thing's
* "pane" so they can all be called the same way.
* 
*/

// Just so I don't have to keep copying and pasting examples goddamnit
$(document).ready(function() {
	// *** SETUP ***\\
	// A way to toggle till I figure out how that works
	var count = 0;
	// Associate top menu options with panes
	$("#lessons-menu").data("pane", $("#lessons-pane"));
	$("#examples-menu").data("pane", $("#examples-pane"));


	// *** EVENT LISTENERS ***\\
	// -- All -- \\
	// Get rid of border?
	// Show panes on click
	$(".top-menu").not($(".menu-items"))
		.on("click", function (thisEv) {mItems.togglePane($(this), $(thisEv.target));})

	// This will go away
	// Highlight dropdown menu items on hover
	$("body").on("mouseenter", "li", function () {
			$(this).css({"background-color": props.activeText});
		})
	.on("mouseleave", "li", function () {
			$(this).css("background-color", "inherit");
		}
	);

	// --- Examples --- \\
	// Make dropdown appear and disappear on click
	$(".top-menu").on("click", function (thisEv) {
		// If "alt" is pressed
		if ($(this).children().attr("id") == "alt-menu") {
			// Do the alternate examples stuff
			ex.exAlt();
		}
	});

	// Examples page version
	$("body").on("click", ".examples li", function() {ex.pasteEx($(this));});

	// --- Lessons --- \\
	// // Show and hide references?
	// $("#reference").click(function () {})
	// // Make it bold when hovered over
	// .hover(function () {//$(this).toggleClass("bold");
	// });
});

var mItems = {
	// Is the simulator showing?
	isSim: true
	// Has one toggle animation completed?
// [Something to do with "width",["toggle","swing"]] Why isn't this working?
	, canToggle: true
	// // Animation times
	// , fadeTime: 200
	, slideTime: 600
	// // Remember the width of the visualizer
	// , visWidth: null
	// // Remember #reference's padding
	// , refPad: null

	, togglePane: function ($clickedItem, $thisTarget) {
		/* ($, $) -> None

		If previous pane toggles are finished, puts a
		border around $clickedItem, slides the pane
		associated with $thisTarget into or out of view,
		moves the other panes off screen if needed.
		*/

		if (mItems.canToggle) {
			// console.log("1 in mItems.canToggle");
			// Disallow toggling
			mItems.canToggle = false;
			// Get menu item's child (with the id)
			var $topMenuItem = $($clickedItem.children()[0]);
			// Get menu item's panel
			var $itemPane = $topMenuItem.data("pane");
			// Somehow indicate item is inactive
			// // Take the border off of every other item
			// $(".top-menu").not($clickedItem).css("border", props.inactiveBorder);

			// Temporary till dropdown is gone make sure it's not a list item
			if ($thisTarget.prop("tagName") != "LI") {
				// console.log("  2 in prop name LI");
				// If it has a "pane" data value
				// If I combine these two if's, any non-pane
				// button will get rid of the other panes
				if ($itemPane) {
					// console.log("    3 in $itemPane");
					// If the pane is off screen
					if ($itemPane.css("left") != "0px") {
						// console.log("      4 in 'left' not 0");
						// Indicate the item is active
						// $clickedItem.css("border", props.activeBorder);
						// Put relevant pane on top and slide it left
						$(".not-sim").not($itemPane).css("z-index","50");
						$itemPane.css("z-index","100");
						$itemPane.animate({"left": "0"}, mItems.slideTime, "swing"
							, function () {
								// Slide the other panes right
								$(".not-sim").not($itemPane).css({"left": "100%"});
							});
						// Re-allow toggling now
						mItems.canToggle = true;
					}  // end of if $itemPane

					// If the pane is on screen
					else {
						// console.log("      4 in else");
						// Remove indication of active item
						// $clickedItem.css("border", props.inactiveBorder);
						// Hide the pane
						$(".not-sim").animate({"left": "100%"}, mItems.slideTime, "swing");
						// Re-allow toggling now
						mItems.canToggle = true;
					}
					// console.log("      4 out of 'left' not 0");
				}  // end of if $itemPane
				// Don't know if I need these else's
				else {mItems.canToggle = true;}
				// console.log("    3 out of $itemPane");
			}  // End of temporary target check
			else {mItems.canToggle = true;}
			// console.log("  2 out of if prop name LI");
		}  // end of canToggle
		// console.log("1 out of canToggle");
	},  // End togglePane()

	// Reveal a lower pane by removing all the panes above it:
	// If the top layer is removed
		// remove all layers
		// set layers var to 0 (1?)
	// If a bottom layer is requested
		// remove all layers above it
		// set their layer to null
	// If a layer is added, give it the next number

	closeLess: function ($topMenuItem) {
		/* (None) -> None
		
		
		*/

		// if (mItems.canToggle) {
		// 	// Disallow toggling
		// 	mItems.canToggle = false;
		// 	// For things that may want to get the simulator back
		// 	// and to prevent #reference from becoming bold
		// 	// though that doesn't work if it's right at the beginning
		// 	mItems.isSim = true;
		// 	// Get menu item's panel
		// 	var $itemPane = $topMenuItem.data("pane");

		// 	// Slide this element to the right again
		// 	$itemPane.animate({"left": "100%"}, 400);
		// 	// Restore menu item to unselected
		// 	$topMenuItem.css("border", props.inactiveBorder);
		// 	// Re-allow toggling now
		// 	mItems.canToggle = true;

		// }  // end of canToggle
	},  // End closeLess()
};  // End mItems

var ex = {
	exAlt: function () {
		/* (None) -> None

		A demo of an alternative to the examples pane.
		Instantiate or remove an examples div on the
		same page as the simulator
		*/
// http://stackoverflow.com/questions/3086068/how-do-i-check-whether-a-jquery-element-is-in-the-dom

		if ( $("#examples-box")[0] ) {
			$("#examples-box").remove();
		}
		else {
			var $examplesBox = $("<div id='examples-box'>"
				+ "Some words of explaination about stuff:"
		    	+ "<br><ul class='examples'>"
				+ "<li>((u-theta 0.6 0))</li>"
				+ "<li>((u-theta 0.8 0))</li>"
				+ "<li>((u-theta 1.6 0))</li>"
				+ "<li>((u-theta 2.3 0))</li></ul></div>");

			$("#editor").append($examplesBox);

			$("#examples-box").css({position:"absolute"
				, left:"0", top:"0", "z-index":"250"
				,"background-color":"white", width: "100%"
				, height: "100%", "font-size":"17px"
				, padding:"10px"
				, "-webkit-box-sizing": "border-box"
				, "-moz-box-sizing": "border-box"
				, "box-sizing": "border-box"});
			$("#examples-box .examples").css({padding:"10px"
				, margin: "10px 0"});
			$("#examples-box .examples li").css({
				margin: "5px", padding: "5px", border: props.activeBorder
			});
		}
	}

	, pasteEx: function ($thisElem) {
		/* ($ collection) -> None

		Copy the text in the $ collection, paste
		it into the editor, and evaluate. If needed,
		reveal the simulator first.
		*/

		var simShowing = true;

		// if any non-sim is showing
		$(".not-sim").each(function () {
			if ($(this).css("left") == "0px") {
				simShowing = false;
			}
		});

		// If there's a pane covering the sim
		if (!simShowing) {
			// Slide away all the panes
			$(".not-sim")
			.animate({"left": "100%"}, mItems.slideTime, "swing"
				, function () {
					// After that and a 75 ms delay
					setTimeout(function () {
						// Replace any text with new text, evaluate
						editor.getSession().setValue($thisElem.text());
						$("#evaluate").trigger("click");
						// Remove indication of active item
						$(".top-menu").css("border", props.inactiveBorder);
						}, 75);  // end setTimeout
			});  // end .animate
		}  // end if !simShowing

		//Otherwise don't wait to do the stuff
		else {
			// Replace any text with new text, evaluate
			editor.getSession().setValue($thisElem.text());
			$("#evaluate").trigger("click");
			// Remove indication of active item
			$(".top-menu").css("border", props.inactiveBorder);
		}
	}  // End pasteEx()
};