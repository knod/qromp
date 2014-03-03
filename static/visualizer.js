/* visualizer.js
* Created by: 
* Date created: 
* Uses http:////cdnjs.cloudflare.com/ajax/libs/Chart.js/0.2.0/Chart.min.js
* to render visual representation of qubits.
* 
* TODO:
* - Comment
* - Where is the event button listener...?
* - How about if the person only writes the code
* partially, then increases qubits? Their code will
* be evaluated with errors. Perhaps only last
* non-error code is run? [?UNDO THIS, THE OLD THING
* WAS ON PURPOSE? No, Omri's saying he wants it. I
* dunno! Done?] ?? Did this used to have this functionality:
* when something had already been evaluated and
* the input was increased, the new cirlces would
* already have the evaluated appearance??
* 	- If not, if we want them to, we just run
* 	evaluate when an input is changed
* 	- Or reset the circles visually so it's
* 	clear they need to be re-evaluated
* - Create an enclosure
* 
* DONE:
* - [DONE] Create jQuery vars in for loops
* - [DONE] Change var i to ii
* - [NOPE] qubitAttr - misspelled?
* 
*/

function positionQubits(newNum){
	// This first for speed
	var qubitChildren = $qubitElements.children(),
		oldNum = qubitChildren.length,
		change = newNum - oldNum;
	if (change){
		qubitAttr = {
			scale: Math.pow((14/15), newNum - 1),
			translate: 95 * Math.pow(newNum - 1, 1/4),
			rotate: 360 / newNum
		};
		if (change < 0){
			for (var ii = 0; ii > change; ii--){
				qubitChildren[ii + oldNum - 1].remove();
			}
		} else {
			for (var ii = 0; ii < change; ii++){
				$qubitElements.append("<div><canvas class='qubit' />" +
					"<canvas class='upP' /><canvas class='downP' /></div>");
			}
			// Then re-evaluate (or set all to start again so
			// it's clear it needs to be re-evaluated)
			$("#evaluate").trigger("click");
		}
	renderQubits();
	}
}

function renderQubits(){
	// For speed
	var inputNum = $qubitsInput.val(),
	qubitChildren = $qubitElements.children();

	for (var ii = 0; ii < inputNum; ii++){
		// For speed
		var $thisChild = $(qubitChildren[ii]);

		$thisChild.css({
			"-webkit-transform": "translate(-50%, -50%) rotate(" +
				qubitAttr.rotate * ii + "deg) translateY(" +
				qubitAttr.translate + "px) rotate(-" +
				qubitAttr.rotate * ii + "deg) rotate(90deg) scale("
				+ qubitAttr.scale + ")"
		});
		renderQubit(ii, $thisChild.children(".qubit"),
			$thisChild.children(".upP"), $thisChild.children(".downP")
		);
	}
}

function renderQubit(qubitID, $qubitCanvas, $upPhaseCanvas, $downPhaseCanvas){
	var qubit = qubits[qubitID] ? qubits[qubitID] : defaultQubit,
		ctxQ = $qubitCanvas[0].getContext('2d'),
		ctxUpP = $upPhaseCanvas[0].getContext('2d'),
		ctxDownP = $downPhaseCanvas[0].getContext('2d');
	new Chart(ctxQ).Pie( [{value: qubit.DOWN.prob, color: "#9a3535"},
		{value: qubit.UP.prob, color: "#3e3e97"}],
		{animation: false, segmentShowStroke: false} );
	phaseCircle(ctxUpP, "#3e3e97");
	phaseCircle(ctxDownP, "#9a3535");

	$upPhaseCanvas.css({
		"-webkit-transform": "rotate(-" + qubit.UP.phase +
			"deg) translateY(-82px) rotate(" + qubit.UP.phase + "deg)"
	});
	$downPhaseCanvas.css({
		"-webkit-transform": "rotate(-" + qubit.DOWN.phase +
			"deg) translateY(-82px) rotate(" + qubit.DOWN.phase + "deg)"
	});
}

function phaseCircle(ctx, color) {
	ctx.beginPath();
	ctx.arc(150, 75, 10, 0, 2*Math.PI);
	ctx.fillStyle = color;
	ctx.fill();
}
