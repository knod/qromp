/* setup.js
* Created by: 
* Date:
* Event listeners and main functions to run simulator
* 
* Sources:
* 
* TODO:
* - Add comments on functionality
* - Store last successful editor value
*   - in qromp, treat blank editor as okay
*
* DONE:
* 
*/

$(document).ready(function() {
	// *** VARIABLE DECLARATION ***\\
	var // Keep track of qubit states and count
		userNum = 1,
		numQubits = 1,
		computedStates = [],
		defaultQubit = {up: {prob: 1, phase: 0}, down: {prob: 0, phase: 0}},
		// Instantiate editor and visualizer
		editor = ace.edit("code-area"),
		visualizer = new VisualizerObject("qubit-svg"),
		// Store often-used elements
		$guideMenu = $("#guide-menu"),
		$guideDetail = $("#guide-detail");

	// *** INITIALIZATION *** \\
	editor.getSession().setUseWrapMode(true);
	buildQubitArray();

	// *** EVENT LISTENERS ***\\

	$("#hidden-file-input").on('change.file',readSingleFile);

	$("#import").click(function(){
		$("#hidden-file-input").click();
	});

	$("#export").on("click", exportProgram);

	// --- Open guide content --- \\
	$(".guide-link").click(function() {
		var $this = $(this);
		// This means the text won't disappear when guide item is closed
		// (won't need a delay before removing) and yet will have the
		// correct text
		$(".guide-item").removeClass("current");
		$guideMenu.addClass("hidden");
		$guideDetail.removeClass("hidden");
		$(".guide-item-title").text($this.text());
		$($this.data("target")).addClass("current");
	});
	
	// --- Close guide content --- \\
	$("#guide-back").click(function() {
		$guideMenu.removeClass("hidden");
		var $current = $guideDetail.addClass("hidden").children(".current");
		// setTimeout(function() {$current.removeClass("current");}, 450)
	});

	// --- Toggle visibility of reference drawer --- \\
	$("#reference-handle").click(function() {
		var $this = $(this);
		if (!$this.hasClass("flip-h")){
			$this.addClass("flip-h").parent().addClass("open").siblings().addClass("narrow");
		} else {
			$this.removeClass("flip-h").parent().removeClass("open").siblings().removeClass("narrow");
		}
		var animate = setInterval(function() {editor.resize();}, 20);
		setTimeout(function() {clearInterval(animate); editor.resize();}, 450);
	});

	// --- Handle dragging of reference item --- \\
	$(".reference-item").mousedown(function(){
		var $this = $(this),
			$document = $(document),
			offset = $this.offset(),
			diffX = event.pageX - offset.left,
			diffY = event.pageY - offset.top,
			$dragged = $this.clone()
				.attr("id", "dragged")
				.css({"top": event.pageY - diffY, "left": event.pageX - diffX})
				.appendTo("#scroller")
				// when released
				.mouseup(function(){
					$document.off("mousemove.track");
					$dragged.remove();
				});
			// while dragging
			$document.on("mousemove.track", function(){
				$dragged.css({"top": event.pageY - diffY, "left": event.pageX - diffX});
			})
	});
	
	// --- Open guide documentation content with ref "?" button --- \\
	$(".reference-button").on("click", function () {
		// We already have something to handle this. Use it.
		$(".guide-item, " + $(this).data("target")).trigger("click");
	})

	// --- Set editor to example text --- \\
	$(document).on("click", ".example", function (evt) {
		editor.getSession().setValue($(this).text());
	});

	// --- Add empty qubit to visualizer --- \\
	$("#add-qubit").click(function() {
		if (numQubits < 10) {
			userNum = ++numQubits;
			buildQubitArray();
		}
	});

	// --- Remove an empty qubit from visualizer --- \\
	$("#remove-qubit").click(function() {
		if (numQubits > 0 && numQubits > computedStates.length) {
			userNum = --numQubits;
			buildQubitArray();
		}
	});

	// --- Evaluate the editor contents on change --- \\
	editor.getSession().on('change', safeEvaluate);

	// *** FUNCTIONS ***\\

	function safeEvaluate() {
		try {
	    	evaluate(editor.getValue(), function(qubitStates) {
		    	buildQubitArray(qubitStates);
		    });
	    } catch (e) {
	    	//maybe put a little warning icon in the editor
	    } 
	}

	function buildQubitArray(newStates) {
		if (newStates) {
			computedStates = newStates;
			numQubits = (computedStates.length < userNum) ? userNum : computedStates.length;
		}
		for (var fullStates = computedStates.slice(0), i = computedStates.length; i < numQubits; i++) {
			fullStates.push(defaultQubit);
		}
		numQubits = i;
		visualizer.render(fullStates);
	}

	function readSingleFile(evt) {
		if (window.File && window.FileReader && window.FileList) {
			var file = evt.target.files[0];
			if (file) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var contents = e.target.result;
					editor.getSession().setValue(contents);
					$("#hidden-file-input").off('change.file').val("");
					$("#hidden-file-input").on('change.file',readSingleFile);
				}
				reader.readAsText(file);
			}
		} else {
			alert('The File APIs are not fully supported in this browser.');
		}
	}

	function exportProgram() {
		var textToWrite = editor.getValue(),
			textFileAsBlob = new Blob([textToWrite], {type:'text/plain'}),
			fileNameToSaveAs = "qromp_program",
			downloadLink = document.createElement("a");

		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		if (window.webkitURL != null) {
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		} else {
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = function(event) {
				document.body.removeChild(event.target);
			};
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}
		downloadLink.click();
	}

	// *** GUIDE HTML *** \\
	$(".guide-item.l-start").html("Welcome to qromp, a quantum programming environment designed to help you learn all about stuff..."
		+ "\n<div class='example-list'>"
		+ "\nClick on an example (feature incomplete):"
		+ "\n<ul>"
			+ "\n<li class='example'>u2 0 1 0.3 1.6 1</li>"
				+ "\n<li class='example'>hadamard 0</li>"
				+ "\n<li class='example'>utheta 0 0.6</li>"
				+ "\n<li class='example'>hadamard 2<br>"
+ "\nhadamard 1<br>"
+ "\nutheta 0 0.785398<br>"
+ "\nnand 0 2 1<br>"
+ "\nhadamard 2<br>"
+ "\ncnot 2 1<br>"
+ "\nhadamard 2<br>"
+ "\nutheta 1 1.570796<br>"
+ "\nutheta 2 1.570796</li>"
			+ "\n</ul>"
		+ "\n</div>"
	);  // end #l-start.html

	$(".guide-item.l-quantcomp").html("Stuff about quantum computers");  // end .l-quantcomp.html
	$(".guide-item.l-qubits").html("Stuff about qubits"); // end .l-qubits.html
	$(".guide-item.l-gates").html("Stuff about gates"); // end .l-gates.html
	$(".guide-item.l-oracles").html("Stuff about oracles"); // end .l-oracles.html
	$(".guide-item.l-grovers").html("Stuff about grovers"); // end .l-grovers.html
	$(".guide-item.e-deutschjozsa").html("Stuff about deutsch-jozsa"); // end .e-deutschjozsa.html
	$(".guide-item.e-grovers").html("Stuff about grovers"); // end .e-grovers.html
	$(".guide-item.e-shors").html("Stuff about shors"); // end .e-shors.html
	$(".guide-item.d-qnot").html("Stuff about qnot"); // end .d-qnot.html
	$(".guide-item.d-cnot").html("Stuff about cnot"); // end .d-cnot.html
	$(".guide-item.d-srn").html("Stuff about srn"); // end .d-srn.html
	$(".guide-item.d-nand").html("Stuff about nand"); // end .d-nand.html
	$(".guide-item.d-hadamard").html("Stuff about hadamard"); // end .d-hadamard.html
	$(".guide-item.d-utheta").html("Stuff about utheta"); // end .d-utheta.html
	$(".guide-item.d-cphase").html("Stuff about cphase"); // end .d-cphase.html
	$(".guide-item.d-u2").html("Stuff about u2"); // end .d-u2.html
	$(".guide-item.d-swap").html("Stuff about swap"); // end .d-swap.html
	$(".guide-item.d-measure").html("Stuff about measure"); // end .d-measure.html
	$(".guide-item.d-end").html("Stuff about end"); // end .d-end.html
	$(".guide-item.d-oracle").html("Stuff about oracle"); // end .d-oracle.html
});
