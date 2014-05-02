/* 
* visualizer.js
* Created by: sethtoles
* Date created: 3/11/14
* Uses d3 to visualize qubits.
*/

function VisualizerObject(containerID) {
	var container = d3.select("#" + containerID),
		margin = .8,
		qubitScale = .4,
		animTime = 500;
	// Must put in new version
	var chordCreated = false;

	this.render = function(qubitStates) {
			// Environment info
		var containerWidth = parseInt(container.style("width")),
			containerHeight = parseInt(container.style("height")),
			containerMin = Math.min(containerWidth, containerHeight),
			dim = margin * containerMin,
			// Qubit properties
			numQubits = qubitStates.length,
			qubitRadius = qubitScale * dim / 2,
			arrangeRadius = 0,
			yOffset = 0;
		// For labels? Doing them in here would be better if I could
		var labelRadius = arrangeRadius + qubitRadius + 125;
		// Let's take care of label color, padding, etc, in attr


		if (numQubits > 1) {
			var theta = 2 * Math.PI / numQubits,
				p = qubitScale * Math.sin(theta / 2);
			if (numQubits % 2 === 0) {
				arrangeRadius = dim / (2 * (p + 1));
				qubitRadius = dim / 2 - arrangeRadius;
			} else {
				var phi = theta * (numQubits - 1) / 2;
				arrangeRadius = dim / (2 * p + Math.sqrt(2 * (1 - Math.cos(phi))));
				qubitRadius = arrangeRadius * p;
				yOffset = arrangeRadius * (1 - Math.cos(theta / 2));
			}
		}

	// --- QUBITS --- //
		var qubits = container.selectAll(".qubit").data(qubitStates);
		
		// Add qubits if necessary
		qubits.enter().append("g")
			.attr("class", "qubit")
			.attr("transform", function(d, i) { return positionQubit(i) + "scale(0)"})
		  .append("circle")
			.attr("class", "qubit-back");

		// Update qubit arrangement
		qubits.transition()
			.duration(animTime)
			.attr("transform", function(d, i) { return positionQubit(i) + "scale(1)" });

		// Update each qubit-back
		qubits.select(".qubit-back").transition()
			.duration(animTime)
			.attr("r", qubitRadius);
		
		// Remove qubits if necessary
		qubits.exit().transition()
			.duration(animTime)
			.attr("transform", function(d, i) { return positionQubit(i, true) + "scale(0)" })
			.remove();

		// Return a string with all of the appropriate transformations
			// "remove" is a boolean used to indicate whether the transformed qubit is being removed
		function positionQubit(index, remove) {
			var realNumQubits = (remove) ? index + 1 : numQubits,
				rotateDeg = 360 / realNumQubits,
				center = "translate(" + (containerWidth / 2) + ", " + ((containerHeight / 2) + yOffset / 2) + ")",
				rotate = "rotate(" + (rotateDeg * index) + ")",
				translate = "translate(0, -" + arrangeRadius + ")"
				straighten = "rotate(-" + (rotateDeg * index) + ")";

			return center + rotate + translate + straighten;
		}

	// --- LABELS --- \\
		var qLabelArray = ["A", "B", "C", "D", "E", "F", "G",
			"H", "I", "J", "K", "L", "M", "N", "O", "P"]

		var qLabels = container.selectAll(".q-label").data(qubitStates);
		
		// Add qubit labels if necessary
		qLabels.enter().append("svg:text")
			// .attr("xlink:href", function (dat, indx) { return "#label" + indx; })  // Huh?
			// Maybe put these attributes in the css
			.attr({"class": "q-label"
				, "font-size": "2.3em", "color": "#424242"
				, "dy": ".35em", "dx": "-.35em"})
			.text(function (dat, indx) { return qLabelArray[indx]; })
			.attr("transform", function(dat, indx) { return positionLabel(indx)  + "scale(0)"})
			;

		// Update qubit label arrangement
		qLabels.transition()
			.duration(animTime)
			.attr("transform", function (dat, indx) { return positionLabel(indx) + "scale(1)" });
		
		// Remove qubit labels if necessary
		qLabels.exit().transition()
			.duration(animTime)
			.attr("transform", function (dat, indx) { return positionLabel(indx, true) + "scale(0)" })
			.remove();

		// Return a string with all of the appropriate transformations
			// "remove" is a boolean used to indicate whether the transformed label is being removed
		function positionLabel(index, remove) {
			var realNumQubits = (remove) ? index + 1 : numQubits,
				rotateDeg = 360 / realNumQubits,
				center = "translate(" + (containerWidth / 2) + ", " + ((containerHeight / 2) + yOffset / 2) + ")"
				,
				rotate = "rotate(" + (rotateDeg * index) + ")",
				// Why is this negative?
				translate = "translate(0, -" + labelRadius + ")"
				straighten = "rotate(-" + (rotateDeg * index) + ")"
				;

			return center + rotate + translate + straighten;
		}

	// --- SUBSTATE GROUPS --- //
		var substates = qubits.selectAll(".substate").data(function(d) { return [d.up, d.down] });
		
		// Add substate groups if necessary	
		substates.enter().append("g")
			.attr("class", "substate")
			.attr("transform", "rotate(180)");

		// Update substate groups
		substates.transition()
			.duration(animTime)
			.attr("transform", function(d) { return "rotate(" + (180 + d.phase) + ")" });

		// Used to set the data for prob-rings and bars
		function substateData(d, i) {
			return [{
				substate: (i % 2 === 0) ? "up" : "down",
				value: d.prob
			}]; 
		}

	// --- PROB-RINGS --- //
		var probRing = substates.selectAll(".prob-ring").data(substateData);

		// Add prob-rings if necessary
		probRing.enter().append("circle")
			.attr("class", function(d) { return "prob-ring " + d.substate; })
			.call(setRingRadius);

		// Update prob-ring size
		probRing.transition()
		  	.duration(animTime)
			.call(setRingRadius);

		// Sets the radius of each prob-ring, called on creation and update
		function setRingRadius(selection) {
			selection
				.attr("r", function(d) {
					var radius = (d.substate === "up") ? (1 - d.value) * qubitRadius + 1 : d.value * qubitRadius - 1;
					return (radius < 0) ? 0 : radius;
				});
		}


	// --- BARS --- //
		var bar = substates.selectAll(".bar").data(substateData);

		// Add bars if necessary
		bar.enter().append("rect")
			.attr("class", function(d) { return "bar " + d.substate; })
			.attr("width", 5)
			.attr("x", - 2.5)
			.attr("y", - .5)
			.call(setBars);
		
		// Update bar attributes	
		bar.transition()
		  	.duration(animTime)
			.call(setBars);

		// Sets the length and offset of each bar, called on creation and update
		function setBars(selection) {
			selection
				.attr("height", function(d) { return ((d.value < 0) ? 0 : d.value) * qubitRadius })
				.attr("transform", function(d) {
					return (d.substate === "up") ? "translate(0, " + ((1 - d.value) * qubitRadius) + ")" : "";
				});
		}

	// --- ENTANGLEMENT --- //
		// Temp for testing
		var entangMatrix = false, paddingArray = false;

		// If there's a chord diagram existing (because of delay on creation
		// this has to come first so it won't fire the first time numQubits > 1)
		if (chordCreated) {
			var center = containerWidth/2 + ", " + (containerHeight + yOffset)/2;
			// If qubits are reduced to one or less, scale it to 0 (disappears)
			if (numQubits <= 1) { entang.updateChord(center, 0, entangMatrix); }
			// Otherwise, usually, just animate the change in the diagram
			else { entang.updateChord(center, arrangeRadius-qubitRadius, entangMatrix, paddingArray); }
		}
		// Only create the entanglement dia once there's more than 1 qubit,
		// otherwise there's a stupd overlay or weird animation.
		else if (numQubits > 1) {createEntang(); chordCreated = true;}

		// Instantiate entanglement chord diagram, then animate its appearance
		function createEntang () {
			// Need to wait till the qubits are done animating, animTime
			setTimeout(function () {
				var center = containerWidth/2 + ", " + (containerHeight + yOffset)/2;
				entang.initChord(center, arrangeRadius-qubitRadius, animTime);
				entang.updateChord(center, arrangeRadius-qubitRadius, entangMatrix, paddingArray);
			}
				, animTime);
		}  // end createEntang()

	}  // end this.render()
}
