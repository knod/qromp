/* setup.js
* Created by: 
* Date:
* Event listeners and main functions to run simulator
* Perhaps other "pages" too in future
* 
* TODO:
* ---	General		---
* - Why isn't everything in $(document).ready()?
* - Add comments on functionality
* - Evaluate then refocus
* - Take away error message on empty editor? (not
* crucial, doesn't stop functionality)
* - Experiment with moving script calls around till we find
* the culprit
* - Retry enclosing the generated code
* - Everything happens on one page (no need for link to
* "home page", instead can press 'x' or 'back')
* 
* ---	Visualizer	---
* 
* ---	Editor		---
* - Should text editor key functions be called on
* keypress instead in case they hold a key down?
* - Perhaps keydown or key up should
* $("#evaluate").trigger("click"); but onl if that
* wont' result in an error
* 
* DONE:
* - [NOPE] qubitAttr - misspelled?
* - [DONE] Decouple ace
* 
*/

// ORIGINAL, ACE (fourth line down) :
// *** ? *** \\
// GLOBAL VARS
// And another five bite the dust
var evaluate = document.getElementById("evaluate"),
	$qubitsInput = $("#qubitsInput"),
	$qubitElements = $("#qubitElements"),
	// editor = ace.edit("ace"),
	qubits = [],
	defaultQubit = {DOWN: {phase: 0, prob: 0}, UP: {phase: 0, prob: 1}},
	qubitAttr;

// Another global, to match the current generated js
var editor = {
		getValue: function () {return(textEditor.getAllText($("#editor")));}
	};

// Elements requested before document ready may not
// always be found, but I see that you wanted global
// vars. There's another way to do that, and I'll
// implement it, but it can be better to keep vars
// out of global scope for human readability

// Also because var names like "evaluate"
// could very easily be accidentally overriden.
// I can do it another way with an initializing
// function or something if they're not used in
// other scripts

$(document).ready(function() {

	// ORIGINAL, ACE, ETC:
	// *** VISULIZER *** \\
	positionQubits($qubitsInput.val());
	// editor.getSession().setUseWrapMode(true);

	// *** ? *** \\
	// Didn't bite the dust in here!!
	$qubitsInput.change(function() {
		positionQubits($qubitsInput.val());
	});

	// KNOD:
	// *** TEXT EDITOR *** \\

	// Create the first editor row
	textEditor.firstRow();

	$("#text-areas")
	// *Has* to be .on, *has* to be delegation
	// Make a tutorial about that somewhere
	// Depending on what key is pressed in a .text-row field
	.on("keydown", ".text-row", function (key) {
		textEditor.keyFilter(key, key.keyCode, $(this));
	})
	// Helps a bit withresizing after deleting section or
	// pasting, esp with clicking out of the area after
	.on("keyup", ".text-row", function (key) {textEditor.resizeRow($(this));})
	// Color the focused row the active colors
	.on("focus", ".text-row", function () {textEditor.activateRow($(this));})
	// Remove the color from the unfocused rows. Look
	// into keeping last active row colored when none are active
	.on("blur", ".text-row", function () {textEditor.deactivateRow($(this));})
	;
});
