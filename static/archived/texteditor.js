/* texteditor.js
* Created by: knod
* Date created: 02/28/14
* Manages the changing inputs of the visualizer's editor
* 
* Sources:
* 1. http://stackoverflow.com/questions/7745867/how-do-you-get-the-cursor-position-in-a-textarea
* 2. http://stackoverflow.com/questions/6683046/how-do-i-move-the-cursor-to-the-front-of-a-textbox-which-has-text-in-it
* 
* ToDo:
* - Fix pressing enter in the middle of text doesn't
* make a new row populated with that text
* - Fix deleting the beginning of text doesn't move the
* text up to the previous row
* - Figure out why .num-row height doesn't change when
* pasting text or deleting selected text. (on keyup?)
* - [Not done, somewhat better somehow] Figure out why
* height of .text-row changes slightly
* after creation so that we don't have to cycle through
* all the .text-rows to get the right height.
* - Do we want the bottom line of the editor to remain
* blank for the evaluate button?
* - Make cursor re-focus on last position in editor after
* "Evaluate" has been pressed.
* - Should text editor key functions be called on
* keypress instead in case they hold a key down?
* - Perhaps keydown or key up should
* $("#evaluate").trigger("click"); but onl if that
* wont' result in an error
* 
* DONE:
* - [DONE] Fix #1 Cannot delete linebreak for non-blank lines
* where if line 2 has text and line one is empty, you
* can't go to the beginning of line 2 and press delete
* to remove that empty row
* - [DONE] Fix deleting line also deleting last letter
* of previous line
* 
*/

// // knod's editor
// // Another global, to match the current generated js
// var editor = {
// 		getValue: function () {return(textEditor.getAllText($("#editor")));}
// 	};

// $(document).ready(function() {
// 	// *** SETUP ***\\
// 	// *** TEXT EDITOR *** \\
// 	// Create the first editor row
// 	textEditor.firstRow();

// 	// *** EVENT LISTENERS ***\\
// 	$("#text-areas")
// 	// *Has* to be .on, *has* to be delegation
// 	// Make a tutorial about that somewhere
// 	// Depending on what key is pressed in a .text-row field
// 	.on("keydown", ".text-row", function (key) {
// 		textEditor.keyFilter(key, key.keyCode, $(this));
// 	})
// 	// Helps a bit withresizing after deleting section or
// 	// pasting, esp with clicking out of the area after
// 	.on("keyup", ".text-row", function (key) {textEditor.resizeRow($(this));})
// 	// Color the focused row the active colors
// 	.on("focus", ".text-row", function () {textEditor.activateRow($(this));})
// 	// Remove the color from the unfocused rows. Look
// 	// into keeping last active row colored when none are active
// 	.on("blur", ".text-row", function () {textEditor.deactivateRow($(this));})
// 	;

// 	$(window).on("resize", function (key) {textEditor.resizeRow($(".text-row"));});
// });

// *** OPERATIONAL *** \\
// Enclosure for texteditor functions
var textEditor = {
	/* Enclosure for text editor functions */

	// The colors for an activated row
	activeNumRow: "#dcdcdc",
	activeTextRow: "#f0f0f0",

	firstRow: function () {
		/* (None) -> None

		Creates the first text editor row. Why here?
		Because we want to have the .num-row and the
		.text-row paired.
		*/

		// Create the .num-row div
		var $newNumRow = $("<div class='num-row'></div>");
		// Create the .text-row input
		var $newTextRow = $("<textarea class='text-row'></textarea>")
		// Store the .num-row as the .text-row's data value
		.data("numRow", $newNumRow);

		// Append them as the first in their divs
		$("#text-areas").append($newTextRow);
		$("#row-num-col").append($newNumRow);

		// Size textarea and it's .num-row to contents
		textEditor.resizeRow($newTextRow);

		// Do we want to focus the mouse here at the start?
		$newTextRow.focus();
		// Somehow the focus() is not triggering activateRow()
		// Colors the row the active row colors
		textEditor.activateRow($newTextRow);
		// Numbers the row
		textEditor.updateNums();
	},

	keyFilter: function (key, $textRow) {
		/* (int, jQuery collection) -> None

		Resizes current .num-row on any keypress, calls
		further function depending on value of key. Also
		resizes current row on 
		enter: 13, delete: 8, up: 38, down: 40,
		*/

		// Size textarea and it's .num-row to contents
		// for when a keypress rolls wraps to the next line down
		textEditor.resizeRow($textRow);

		// ENTER
		if (key.keyCode == 13) {
			// Add a line and updates the row numbers
			textEditor.addRow($textRow);
			// Don't make a new paragraph
			key.stopPropagation();
			key.preventDefault();
		}

		// DELETE
		else if (key.keyCode == 8) {

			// Get the cursor position. Sources (1)
			var cursorPos = $textRow.prop("selectionStart");

			// Do not remove the first row
			if ( Math.max(0, $(".text-row").index($textRow)) ) {
				// If there's no text in the row
				if (!$textRow.val()) {
					// Run a function in texteditor.js that removes a
					// line and updates the row numbers
					textEditor.removeRow($textRow);
					// Don't delete more than you should or something
					key.stopPropagation();
					// Just had to .preventDefault in this scope!
					// Now won't delete first letter of prev line
					key.preventDefault();
				}
				// Otherwise, if the cursor is at the
				// beginning of a textarea and the prev row
				// is empty (check for selectionEnd just
				// in case they have all the text selected
				// and want to just delete that)
				else if (!cursorPos && $textRow.prev().val() == "") {
					// Delete the previous row
					textEditor.removeRow($textRow.prev());
				}
			}
		}

		// UP ARROW
		else if (key.keyCode == 38) {
			// If this isn't the first row
			if ( Math.max(0, $(".text-row").index($textRow)) ) {

				// Get the cursor position. Sources (1)
				var cursorPos = $textRow.prop("selectionStart");

				// If the cursor is at the start of the textarea
				if (!cursorPos) {

					// Get the previous .text-row element
					// for some reason this doesn't work
					// Comes out as undefined
					var $prevTextRow = $textRow.prev();

					// Get the length of the prev textarea
					var textLength = $textRow.prev().val().length;

					$textRow.prev()
					// Move the cursor to the prev input field
					.focus()
					// Set cursor position to end of prev textarea.
					// Sources (2)
					.prop("setSelectionRange", textLength, textLength);

					// For when textarea has/had multiple lines
					key.stopPropagation();
					key.preventDefault();
				}
			}
		}

		// DOWN ARROW
		else if (key.keyCode == 40) {
			// If this isn't the last row
			if ( $(".text-row").index($textRow) !=
				($(".text-row").length - 1) ) {

				// Get the length of the text in the textarea
				var textLength = $textRow.val().length;
				// Get the cursor position. Sources (1)
				// Selection end in case they had something selected
				var cursorPos = $textRow.prop("selectionEnd");

				// If the cursor is at the end of the text area
				if (cursorPos == textLength) {
					$textRow.next()
					// Move the cursor to the next input field
					.focus()
					// Set cursor position to start of next textarea.
					// Sources (2)
					.prop("setSelectionRange", 0, 0);

					// For when textarea has/had multiple lines
					key.stopPropagation();
					key.preventDefault();
				}
			}
		}
	},

	addRow: function ($textRow) {
		/* (element) -> None

		Adds divs below current input, one for the
		rows, one for the text, then numbers the
		rows appropriately. Moves curosr to the new
		input field
		*/

		// Create the .num-row div
		var $newNumRow = $("<div class='num-row'></div>");
		// Create the .text-row input
		var $newTextRow = $("<textarea class='text-row'></textarea>")
		// Store the .num-row as the .text-row's data value
		.data("numRow", $newNumRow);

		// Append new text input under this text input
		$textRow.after($newTextRow);
		// Append new .num-row using the current .text-row's data
		$textRow.data("numRow").after($newNumRow);

		// Expands the input textarea size to show all text
		textEditor.resizeTextArea($newTextRow);
		// Should this also resize row number?
		// textEditor.resizeRow($newTextRow);

		// Still getting weird extra padding, so resizing is
		// needed, but it doesn't need to happen to all of them
		// anymore, just one at a time. Why?

		// Re-number the rows
		textEditor.updateNums();
		// Move the cursor to the new .text-row input
		$newTextRow.focus();
	},

	removeRow: function ($textRow) {
		/* (element) -> None

		Deletes this input and it's matching .num-row,
		then numbers the rows appropriately. Moves curosr
		to the previous input field.
		*/

		// Move the cursor to the previous input field
		$textRow.prev().focus();
		// Remove the .num-row in this .text-row's data value
		$textRow.data("numRow").remove();
		// Remove this .text-row
		$textRow.remove();
		// Update the row numbers
		textEditor.updateNums();
	},

	updateNums: function () {
		/* (None) -> None

		Cycles through all the .num-row rows and
		numbers them in order
		*/

		$(".num-row").each(
			function (thisIndex) {
				$(this).text(thisIndex + 1);
			});
	},

	activateRow: function ($textRow) {
		/* (element) -> None

		Change the colors of $textRow to the
		active colors.
		*/

		// Change $textRow's color
		$textRow.css("background", this.activeTextRow);
		// Change color of $textRow's numRow data value
		$textRow.data("numRow").css("background", this.activeNumRow);
	},

	deactivateRow: function ($textRow) {
		/* (element) -> None

		Remove the colors of $textRow.
		*/

		// Remove $textRow's color
		$textRow.css("background", "");
		// Remove color of $textRow's numRow data value
		$textRow.data("numRow").css("background", "");
	},

	resizeTextArea: function ($elemToSize) {
		// The other places that say (element) may need to say
		// (jQuery element) or collection or something

		/* (jQuery collection) -> (None)

		Resizes the jQuery element/collection elemToSize to
		fit it's contents, minimum one row high.
		*/

		// Too stupid to figure out how to pass DOM elements
		// instead of jQuery collections, so we'll do it the
		// messier jQuery way

		// For some reason it's necessary to set it to 1px first
	    // elemToSize.style.height = "1px";
	    // jQuery way:
	    $elemToSize.css("height","1px");
	    // Gets, basically, the height of the contents with some minimum
	    // Don't know if this will actually make it the size we want,
	    // but meh, it'll be close
	    // elemToSize.style.height = (elemToSize.scrollHeight)+"px";
	    // jQuery way:
		$elemToSize.css("height", ($elemToSize.prop("scrollHeight"))+"px");
	},

	resizeRow: function ($rowToSize) {
		/* ($ collection) -> None

		Resizes $rowToSize to fit contents, minimum of one
		row, then resize's that row's row number.
		*/

		textEditor.resizeTextArea($rowToSize);
		$rowToSize.data("numRow").outerHeight($rowToSize.outerHeight());
	},

	getAllText: function ($editor) {
		/* ($ collection) -> Str

		Gets the text from every textarea in $editor
		and returns. Each textarea is on a new line.

		ex: ((u-theta 0.6 0))
		*/

		// Get the .text-row's of the editor. Means
		// $editor can be any parent
		var $textAreas = $editor.find("textarea");
		// How many text areas are there?
		var numAreas = $textAreas.length;
		// What's the last index in the group?
		var highestIndex = numAreas - 1;

		// The string that will be returned
		var editorStr = "";

		// For every existing textarea
		$textAreas.each(function (ii) {
			// Make loop faster
			var $this = $(this);

			// Append the value of this textarea to the string
			editorStr += $this.val();
			// Append a new line character
			editorStr += "\n";
		})

		// When that's all done, take away the last excess /n
		editorStr = editorStr.substring(0, editorStr.length - 1);
		// and return that string
		return(editorStr);
	},
}
