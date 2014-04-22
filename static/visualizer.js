/* 
* visualizer.js
* Created by: sethtoles
* Date created: 3/11/14
* Uses d3 to visualize qubits.
*/

function VisualizerObject(containerID) {
	var container = d3.select("#" + containerID),
		margin = .9,
		qubitScale = .4,
		animTime = 500;
	// for entang, add after update
	var entangMatrix = [
			  [100, 20, 30, 0],
			  [20, 100, 0, 0],
			  [30, 0, 100, 0],
			  [0, 0, 0, 0],
			],
		containerWidth = parseInt(container.style("width")),
		containerHeight = parseInt(container.style("height")),
		arrangeRadius = 100,
		qubitRadius = 10,
		yOffset = 0;
	createEntang();

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
			var center = containerWidth/2 + ", " + (containerHeight + (yOffset || 0))/2;
			entang.updateChord(entangMatrix, arrangeRadius-qubitRadius, center);
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
	// Need to wait till here so have correct values for now

		// var entangMatrix = [];

		// // Let's try with d3 again
		// d3.selectAll(".qubit").each(function (dat, indx) {
		// 	// Assign an array to the qubit object without destroying
		// 	// the previous data object (entang.js)
		// 	d3.select(this).data()[0].entang = entang.createRow(indx, numQubits);
		// 	// Put that array into the entanglement matrix array
		// 	entangMatrix.push(d3.select(this).data()[0].entang);

		// 	// d3.select(this).data([0123]); // console.log gets [83]
		// });

		function createEntang () {
		// Need to wait till the qubits are done animating, animTime.
			// Ideally, if the diagram already exists, just transition it...
			// but for now, destroy the old one and make a new one
			$(".entang").remove();

			setTimeout(function () {
				$(".entang").remove();
				var center = containerWidth/2 + ", " + (containerHeight + (yOffset || 0))/2;
				entang.createChord(entangMatrix, arrangeRadius-qubitRadius, center);
			}
				, animTime);
		}

		// if (numQubits > 1) {
		// 	createEntang();
		// }
		// else {$(".entang").remove();}

	}  // end this.render()
	function createEntang () {
		// Need to wait till the qubits are done animating, animTime.
			// Ideally, if the diagram already exists, just transition it...
			// but for now, destroy the old one and make a new one
			// $(".entang").remove();

			// setTimeout(function () {
				// $(".entang").remove();
				var center = containerWidth/2 + ", " + (containerHeight + (yOffset || 0))/2;
				entang.createChord(entangMatrix, arrangeRadius-qubitRadius, center);
			// }
				// , animTime);
		}
}
