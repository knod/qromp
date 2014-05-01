/*
* visualizer.js
* Created by: knod
* Date created: 04/20/14
* Uses d3 to visualize entanglement.
* 
* Sources:
* (1) http://bl.ocks.org/mbostock/4062006
* (2) http://fleetinbeing.net/d3e/chord.html
* (3) http://stackoverflow.com/questions/21813723/change-and-transition-dataset-in-chord-diagram-with-d3
* 
* Notes:
* - Creates a chord diagram that animates when changed and shows the
* difference between potential entanglement and full entanglement (I think)
* (or at least it has potential to once values are plugged in dynamically)
* - I think because of the order this puts the connections in,
* there are straight lines going across the middle sometimes.
* I'm not sure how, but I believe adjusting the indexes somehow
* will fix it (it can't just be shifted one spot over)
* - Maybe how to give chord data custom properties:
* jsl6906		before line 29 you can do: var chordData =
* newPartLayout.chords().forEach(function(d) { //assign d.something; }));
* (I think: d.something = otherthing)
*/

var entang = {

	firstOuterRadius: null
	, animTime: null
	// , arcForGroups: null
	// , pathForChords: null
	, fullEntangElem: null
	, partEntangElem: null
	, oldFullLayout: null
	, oldPartLayout: null
	// For labels
	, innerRadius: null

	/* (str, num, int) -> None

	Creates a placeholder for the chord diagram centered at center
	("num, num") with an outer radius of firstOuterRadius, and assigns
	the animation time animTime passed to it. (After this, the script
	calling this will call the update function passing it the matrix)

	It gives values to a some of the entang properties.
	*/
	, initChord: function (center, firstOuterRadius, animTime) {
		// --- SETUP --- \\
		// *** All this stuff will only be calculated once
		// * Establishing object variables
		// This will be used to get the scale in future when there
		// are new outer radii
		entang.firstOuterRadius = firstOuterRadius;
		entang.animTime = animTime;
		// * This is used to establish the next object variable
		entang.innerRadius = firstOuterRadius/1.1;
		// It's a pain that this doesn't look like a function now, but later
		// does - I think the function just changes values?
		// Sources (3): create the arc path data generator for the groups
		// What are the groups? There are lots of groups! Are these groups
		// of bridges? Or sections around the circle? What?
		entang.arcForGroups = d3.svg.arc()
			.innerRadius(entang.innerRadius)
			.outerRadius(entang.firstOuterRadius);

		// Sources (3): create the chord path data generator for the chords
		// What are we calling chords? Seen chord used for different things
		entang.pathForChords = d3.svg.chord().radius(entang.innerRadius);

		// Element that will show partial entanglement and the "bridges"/chords
		entang.partEntangElem = entang.attachChord("entang part-entang", center, 0);
		// Element that will show full entanglement. On top for debugging visibility.
		entang.fullEntangElem = entang.attachChord("entang full-entang", center, 0);
	}  // end initChord()

	/* (str, num, Array of Arrays of ints, Array of ints) -> None

	Handles animating the creation of and changes to the chord
	diagram. Uses newCenter ("num, num") to animate the move to the new
	centerpoint (I hope), newRadius (and entang.firstOuterRadius)
	to get the new scale of the object, and newEntangMatrix to move
	the various paths to correct locations, and newPadArray to show
	entanglement potential.

	newEntangMatrix.length must == newPadArray.length
*/
	, updateChord: function (newCenter, newRadius, newEntangMatrix, newPadArray) {
		// *** SETUP *** \\
		// Temp for testing
		var newEntangMatrix = newEntangMatrix || 
			[[100, 20, 30],
			  [20, 130, 0],
			  [30, 0, 120]];
		center = newCenter; radius = newRadius;
		// end testing

		// Bring some things (that will be used repeatedly) into scope
		var animTime = entang.animTime
			, fullEntangElem = entang.fullEntangElem
			, partEntangElem = entang.partEntangElem
		;

		// Needed for label spacing unless we can do this in qubits instead...

		var newNumQubits = newEntangMatrix.length
			// Padding between the full entanglement arcs (using newNumQubits and mapping)
			// Mapping: low2 + (high2 - low2) * (value - low1) / (high1 - low1)
			, fullPadding = 1 + (0.3 - 1) * (newNumQubits - 3) / (10 - 3)
			// Turn that into an array so setupChords() can process it
			, fullPadArray = entang.setupPad(newNumQubits, fullPadding)
			// Radians of the outlined part of the full entang arcs
			// (to get a percentage from for the partial entang arcs)
			, fullArcRad = (2 * Math.PI)/newNumQubits - fullPadding
			// To help calculate rotation, which is given in degrees
			, fullPaddingDeg = fullPadding * (180/Math.PI);

		// To rotate the diagram to line it up with the qubits
		var rotation = -(360/newNumQubits - fullPaddingDeg)/2
			// Size of diagram so it's relative to qubits
			, scale = newRadius/entang.firstOuterRadius
		;

		// Color for potential and full entanglement arcs(/groups?)
		var partArcColor = "#9986b3", fullArcFill = "none", fullArcStroke = "gray";
		// An array of colors for bridges/chords
		var bridgeColors = ["#9986b3", "red", "green", "blue", "purple", "pink"];

	// *** BUSINESS *** \\
		updateFull();  // Full Entanglement
		updatePart();  // Partial Entanglement

	// --- Final Size and Pos Change Animation --- \\
		// Don't know where else to put it so it won't get overridden
		d3.selectAll(".entang")
			.transition()
			.duration(animTime)
			.attr("transform", "translate(" + newCenter
				+ ") rotate(" + rotation
				+ ") scale(" + scale + ")")
			;

	// *** EVENT HANDLERS *** \\
		//add the mouseover/fade out behaviour to the groups
		//this is reset on every update, so it will use the latest
		//chordPaths selection
		// The previous example's version of fade, this person's was too complex
		// partEntangElem.selectAll(".part-entang .group") takes a while to
		// have the correct values
		partEntangElem.selectAll(".part-entang .group")
			.on("mouseover", entang.fade(.1))
			.on("mouseout", entang.fade(1))
		;

	// *** FUNCTIONS *** \\
	// --- Partial Entanglement --- \\
		/* (None) -> None

		Animates the updating of the partial entanglement arcs and bridges/chords,
		including creation, removal, and addition of arcs (creation is just
		addition of arcs and bridges from 0). The arcs will only take up some of
		the space displayed by the full entanglement arcs and will correspond to
		the individual qubit's probability.

		They need the variables declared inside updateChord().
		*/
		function updatePart () {
			// This is a test amount - it is meant to be a percentage
			// Percent entanglement potential that is unavailable to the qubit
			var percentCantEntang = 0.1;
			var cantEntangRad = (percentCantEntang * fullArcRad) + fullPadding;
			var cantEntangArray = entang.setupPad(newNumQubits, cantEntangRad);
			cantEntangArray[1] += 0.1;
			cantEntangArray = newPadArray || cantEntangArray;

			// Make and store a new layout.chord() with the new matrix that
			// we'll transition to (from oldPartLayout)
			var newPartLayout = entang.setupChords(newEntangMatrix, cantEntangArray);

		// *** GROUPS(?), creation *** \\
			// Container's new elements: create data. Also get all elements?
			var groupG = partEntangElem.selectAll(".part-entang .group")
				//use a key function in case the groups are
				// sorted differently between updates
				.data(newPartLayout.groups(), function (d) {return d.index;});

			// Animate removal of paths
			entang.removeElems(groupG);

			// Add new top-level items with class
			var newGroups = groupG.enter().append("g").attr("class", "group");

			// Add next-level items and their colors
			newGroups.append("path")
				.style("fill", partArcColor)
				.style("stroke", partArcColor);

			// Animate addition of paths
			groupG.select("path").transition()  // groupOfArcs.transition() works too
					.duration(animTime)
				.attrTween("d", entang.arcTween( entang.oldPartLayout ))
			;

		// *** CHORD PATHS, creation, entrance, exit, animation *** \\
			// Container's new elements: create data. Also get all elements?
			var chordPaths = partEntangElem.selectAll("path.chord")
				// I don't understand what this does
				.data(newPartLayout.chords(), entang.chordKey );

			// Animate removal of paths
			entang.removeElems(chordPaths);

			// Add new top-level items with class and colors based on array and element indexes
			var newChords = chordPaths.enter().append("path")
				.attr("class", "chord")
				.style("fill", function(dat) {return bridgeColors[(dat.target.index
					* 10 + dat.target.subindex) % 6]; })
				.style("stroke", function(dat) {return bridgeColors[(dat.target.index
					* 10 + dat.target.subindex) % 6]; })
				// Hide the paths that don't go anywhere (blank space
				// to indicate un-entangled area)
				.filter(function (dat) {return dat.target.index == dat.target.subindex;})
					.style("opacity", 0)
			;

			// Animate addition/shape change of paths
			chordPaths.transition()
				.duration(animTime)
				.attrTween("d", entang.chordTween( entang.oldPartLayout ))
			;

			entang.oldPartLayout = newPartLayout; //save for next update
		}  // end updatePart()

	// --- Full Entanglement --- \\
		/* (None) -> None

		Animates the updating of the full entanglement arcs, including creation,
		removal, and addition of arcs (creation is just addition of arcs from 0).
		These arcs will be superimposed on top of the partial arcs. They will
		mark the size of the maximum entanglement potential as a comparison point.

		They need the variables declared inside updateChord(). Basically the
		same as the top part of updatePart(). Has no chords/bridges.
		*/
		function updateFull () {

		// *** SAME AS updatePart() (different variables) *** \\
			var newFullMatrix = entang.newFullEntangMatrix(newNumQubits);
			// (need this var later)
			var newFullLayout = entang.setupChords(newFullMatrix, fullPadArray);

			// Container's new elements: create data. Also get all elements?
			var groupG = fullEntangElem.selectAll(".full-entang .group")
				//use a key function in case the groups are
				// sorted differently between updates
				.data(newFullLayout.groups(), function (d) {return d.index;});

			// Animate removal of paths
			entang.removeElems(groupG);

			// Add new top-level items with class
			var newGroups = groupG.enter().append("g").attr("class", "group");
			// Add next-level items and their colors
			newGroups.append("path")
				.style("fill", fullArcFill)
				.style("stroke", fullArcStroke);

			// Animate addition of paths
			groupG.select("path").transition()  // groupOfArcs.transition() works too
					.duration(animTime)
				.attrTween("d", entang.arcTween( entang.oldFullLayout ))
			;

		// // *** JUST IN updateFull() *** \\
		// 	// Arrays don't take much memory, make it here for clarity
		// 	var qArcLabels = ["A", "B", "C", "D", "E", "F", "G",
		// 			"H", "I", "J", "K", "L", "M", "N", "O", "P"]

		// 	//create the group labels
		// 	newGroups.append("svg:text")
		// 		.attr("xlink:href", function (d) {
		// 		    return "#group" + d.index;
		// 		})
		// 		// Maybe put these attributes in the css
		// 		.attr("class", "q-label")
		// 		.attr({"font-size": "2.3em"})
		// 		// Offset to put label in center of arc? Why .35em?
		// 		.attr("dy", ".35em")
		// 		.attr("color", "#424242")
		// 		.text(function (d) {
		// 			return qArcLabels[d.index];
		// 		});

		// 	//position group labels to match layout
		// 	groupG.select("text")
		// 		.transition()
		// 			.duration(entang.animTime)
		// 			.attr("transform", function(d) {
		// 				d.angle = (d.startAngle + d.endAngle) / 2;
		// 				//store the midpoint angle in the data object

		// 				return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
		// 					" translate(" + (entang.innerRadius + 26) + ")" + 
		// 					(d.angle > Math.PI ? " rotate(180)" : " rotate(0)")
		// 					; 
		// 				//include the rotate zero so that transforms can be interpolated
		// 			})
		// 			// .attr("transform", function(d) { return "rotate(" + ( -(d.angle * 180 / Math.PI - 90)) + ")"})
		// 			.attr("text-anchor", function (d) {
		// 				return d.angle > Math.PI ? "end" : "begin";
		// 			});

		// *** SAME AS updatePart() (different variables) *** \\
			entang.oldFullLayout = newFullLayout; //save for next update
		}  // end updateFull()

	}  // end updateChord()

	/* (int) -> Array of Arrays of ints

	Creates a matrix with numQubits arrays filled with numQubit values,
	all equal to each other.
	*/
	, newFullEntangMatrix: function (numQubits) {
		var newMatrix = [], newRow = [];
		// Every row is the same, filled with the right number of 1's
		for (var indx = 0; indx < numQubits; indx++) {newRow.push(1);}
		// Fill the matrix with the right number of those rows
		for (var indx = 0; indx < numQubits; indx++) {newMatrix.push(newRow);}
		return newMatrix;
	}

	/* (int) -> Array of ints

	Creates an array of length numQubits all filled with the number
	denoted by padding (to keep info format consistent for setupChords()).
	*/
	, setupPad: function (numQubits, padding) {
		var paddingArray = []
		for (var indx = 0; indx < numQubits; indx++) {paddingArray.push(padding);}
		return paddingArray;
	}

	/* (str, num, num) -> d3 element?

	Adds an element to the svg element with the given classNames, center, and rotation
	*/
	, attachChord: function (classNames, center, rotation) {
		return d3.select("#qubit-svg")
			.append("g")
				// Unique class for scaling the size of the whole thing
				.attr("class", classNames)
				.attr("transform", "translate(" + center
					+ ") rotate(" + rotation + ")"
				)
		;
	}

	/* (Array of Arrays of ints, Array of ints) -> None

	Creates a new chord layout with matrix as it's matrix and
	arcPadding as an array (whose length is equal to matrix's length)
	of numbers, the padding for each arc around the circle.

	(ONLY GIVE THIS AN ARRAY. We can actually give a number or no input
	as well, but please don't take advantange and confuse the issue.)
	*/
	, setupChords: function (matrix, arcPadArray) {
		var arcPadArray = arcPadArray || 0.1;

		// If an array is given for padding, but it's length is not the
		// same as the matrix, give a warning.
		if (arcPadArray.length
			&& (arcPadArray.length != matrix.length)) {
			console.log("Your padding array is too short or too long, weird things may happen!");
		}

		return d3.layout.chord()
			// padding between sections
			.padding(arcPadArray)
			.sortSubgroups(d3.descending)
			.sortChords(d3.ascending)
			.matrix(matrix)
		;
	}

	/* (d3 collection?) -> None

	Update and animate removal of elements.
	*/
	, removeElems: function (groupOfElems) {
		groupOfElems.exit()
			.transition()
				.duration(entang.animTime)
				.attr("opacity", 0)
				.remove(); //remove after transitions are complete
	}

	// Sources (3)
	, arcTween: function (oldLayout) {
	    //this function will be called once per update cycle
	    
	    //Create a key:value version of the old layout's groups array
	    //so we can easily find the matching group 
	    //even if the group index values don't match the array index
	    //(because of sorting)
	    var oldGroups = {};
	    if (oldLayout) {
	        oldLayout.groups().forEach( function(groupData) {
	            oldGroups[ groupData.index ] = groupData;
	        });
	    }
	    
	    return function (d, i) {
	        var tween;
	        var old = oldGroups[d.index];
	        if (old) { //there's a matching old group
	            tween = d3.interpolate(old, d);
	        }
	        else {
	            //create a zero-width arc object
	            var emptyArc = {startAngle:d.startAngle,
	                            endAngle:d.startAngle};
	            tween = d3.interpolate(emptyArc, d);
	        }
	        
	        return function (t) {
	            return entang.arcForGroups( tween(t) );
	        };
	    };
	}  // end arcTween()

	, chordKey: function (data) {
	    //create a key that will represent the relationship
	    //between these two groups *regardless*
	    //of which group is called 'source' and which 'target'
	    return (data.source.index < data.target.index) ?
	        data.source.index  + "-" + data.target.index:
	        data.target.index  + "-" + data.source.index;
	}

	, chordTween: function (oldLayout) {
	    //this function will be called once per update cycle
	    
	    //Create a key:value version of the old layout's chords array
	    //so we can easily find the matching chord 
	    //(which may not have a matching index)
	    
	    var oldChords = {};
	    
	    if (oldLayout) {
	        oldLayout.chords().forEach( function(chordData) {
	            oldChords[ entang.chordKey(chordData) ] = chordData;
	        });
	    }
	    
	    return function (d, i) {
	        //this function will be called for each active chord
	        
	        var tween;
	        var old = oldChords[ entang.chordKey(d) ];
	        if (old) {
	            //old is not undefined, i.e.
	            //there is a matching old chord value
	            
	            //check whether source and target have been switched:
	            if (d.source.index != old.source.index ){
	                //swap source and target to match the new data
	                old = {
	                    source: old.target,
	                    target: old.source
	                };
	            }
	            
	            tween = d3.interpolate(old, d);
	        }
	        else {
	            //create a zero-width chord object
	            var emptyChord = {
	                source: { startAngle: d.source.startAngle,
	                         endAngle: d.source.startAngle},
	                target: { startAngle: d.target.startAngle,
	                         endAngle: d.target.startAngle}
	            };
	            tween = d3.interpolate( emptyChord, d );
	        }

	        return function (t) {
	            //this function calculates the intermediary shapes
	            return entang.pathForChords(tween(t));
	        };
	    };
	}  // end chordTween()

	/* (num) -> No idea (d3 collection of ".chord"?)

	Uses a number between 0 and 1 (opacity) to animate the fading
	out (or in) the filtered paths. I don't know what kind of thing
	it returns. Sources (1) (I think says "Returns an event handler
	for fading a given chord group.")
	*/
	, fade: function (opacity) {
	  return function(g, indx) {
	    d3.selectAll(".chord")
	        .filter(function(dat) {
	        	return dat.source.index != indx && dat.target.index != indx
	        	// Added by knod to keep own chords hidden (for qromp)
	        	&& dat.target.index != dat.target.subindex; 
	        })
	      .transition()
	        .style("opacity", opacity);
	  };
	}
}

/* For testing (Not really robust enough to be considered a testing suite)
To put in inspector console once chord diagram is visible:
Test 1:
matrix = [[100, 50, 10, 30],
	[50, 100, 30, 10],
  	[10, 30, 150, 0],
  	[0, 10, 30, 150]]
entang.updateChord(center, radius, matrix)

Test 2:
matrix = [[100, 10, 30],
	[10, 130, 0],
	[30, 0, 110]]
entang.updateChord(center, radius, matrix)

Test 3:
matrix = [[65, 2, 61, 54, 66, 51, 45, 59, 22, 95],
[51, 52, 74, 98, 20, 41, 29, 28, 99, 28],
[64, 15, 11, 45, 76, 108, 14, 73, 59, 55],
[45, 40, 48, 70, 43, 79, 38, 37, 52, 68],
[31, 34, 72, 73, 28, 49, 15, 31, 86, 71],
[87, 35, 40, 81, 103, 22, 52, 25, 62, 13],
[51, 55, 88, 6, 92, 17, 5, 68, 60, 78],
[64, 3, 89, 44, 68, 73, 46, 37, 83, 13],
[80, 21, 45, 9, 65, 89, 70, 53, 45, 43],
[18, 78, 83, 43, 56, 32, 50, 45, 68, 47]]
entang.updateChord(center, radius, matrix)

Test 4:
matrix = [[1, 4], [4, 1]]
entang.updateChord(center, radius, matrix)
*/
//
