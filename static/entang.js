/* 
* visualizer.js
* Created by: knod
* Date created: 04/20/14
* Uses d3 to visualize entanglement.
* 
* Currently just creates a chord diagram with arbitrary
* values with one alteration - the chords that go back
* to the parent are hidden (opacity 0). It doesn't even
* show up yet.
*/

var entang = {
	prevLayout: null,
	arc: null,
	path: null,

	/* (int, int) -> array of ints

	Create one row of the matrix for the qubit
	*/
	createRow: function (indx, numQubits) {

		// Make one array for reach qubit with the right number of 0's
		var newRow = [];
		for (var indx2 = 0; indx2 < numQubits; indx2++) {
			newRow.push(0);
		}
		// Give it some starting value for itself
		newRow[indx] = 100;

		return newRow;
	},


	getDefaultLayout: function () {
		return chord = d3.layout.chord()
		// padding between sections
	    .padding(.05)
	    .sortSubgroups(d3.descending)
	    .sortChords(d3.ascending) // needed?
	},

	/* 

	Create the initial matrix for the qubits
	*/

	/* (Array of arrays of ints, num, str) -> None

	In future matrix should be passed in.

	Creates a chord diagram with the number of sections and
	chords provided in matrix. Chords that refer to their own
	section are given an opacity of 0.
	*/
	createChord: function (matrix, outerRadius, center) {
		// From http://bl.ocks.org/mbostock/4062006
		// From http://mkweb.bcgsc.ca/circos/guide/tables/

// !! Take these two first ones out later !!
		// var matrix = [
		//   [100, 20, 30, 0],
		//   [20, 100, 0, 0],
		//   [30, 0, 100, 0],
		//   [0, 0, 0, 0],
		// ];

		// var chord = d3.layout.chord()
		// 	// padding between sections
		//     .padding(.05)
		//     .sortSubgroups(d3.descending)
		//     .sortChords(d3.ascending) // needed?
		//     .matrix(matrix);

// !!! Transition stuff starts here !!!
		// function getDefaultLayout() {
		// 	return chord = d3.layout.chord()
		// 	// padding between sections
		//     .padding(.05)
		//     .sortSubgroups(d3.descending)
		//     .sortChords(d3.ascending) // needed?
		// }

		// // var that needs to be available to updateChord
		// var prevLayout;
		// // In place of "neighborhoods". I don't understand what's going on
		// // Is this the matrix? Don't think it's needed here.
		// var entanglement = matrix;
		var innerRadius = outerRadius/1.1;
		var rotation = -(360/matrix.length)/2;

		//create the arc path data generator for the groups
		entang.arc = d3.svg.arc()
		    .innerRadius(innerRadius)
		    .outerRadius(outerRadius);

		//create the chord path data generator for the chords
		entang.path = d3.svg.chord()
		    .radius(innerRadius);

		// svg = d3.select("#qubit-svg")
		qubitsvg = d3.select("#qubit-svg")
		  .append("g")
		  	.attr("class", "entang")
		    .attr("transform", "translate(" + center + ") rotate(" + rotation + ")");

		entang.updateChord(qubitsvg, matrix);

		// var fill = d3.scale.ordinal()
		//     .domain(d3.range(4))
		//     // .range(["#000000", "#FFDD89", "#957244", "#F26223"]);
		//     .range(["#9986b3", "red", "green", "blue"]);

		// qubitsvg.append("g").selectAll("path")
		//     .data(chord.groups)
		//   .enter().append("path")
		//     .style("fill", function(d) { return fill(d.index); })
		//     .style("stroke", function(d) { return fill(d.index); })
		//     .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
		//     .on("mouseover", entang.fade(.1))
		//     .on("mouseout", entang.fade(1));

		// qubitsvg.append("g")
		//     .attr("class", "chord")
		//   .selectAll("path")
		//     .data(chord.chords)
		//   .enter().append("path")
		//     .attr("d", d3.svg.chord().radius(innerRadius))
		//     .style("fill", function(dat) { return fill(dat.target.index); })
		//     .style("opacity", 1);

		// // When everything else is done hide non-paired paths
		// entang.hideOwn();

	},  // end of createChord()

	/* (?) -> None

	Shoud handle the animation from one chord state to
	another, not sure how yet. Also runs to animate the start

	Why does it start out as black?
	*/
	updateChord: function (qubitsvg, matrix) {

		var matrix = // matrix || 
		[
			  [100, 20, 30, 0],
			  [20, 100, 0, 0],
			  [30, 0, 100, 0],
			  [0, 0, 0, 0],
			];

// Reshaped from http://stackoverflow.com/questions/21813723/change-and-transition-dataset-in-chord-diagram-with-d3
		 /* Compute chord layout. */
	    var layout = entang.getDefaultLayout(); //create a new layout object
	    layout.matrix(matrix);

	    /* Create/update "group" elements */
	    var groupG = qubitsvg.selectAll("g.chord-sec")
	        .data(layout.groups(), function (d) {
	            return d.index; 
	            //use a key function in case the 
	            //groups are sorted differently between updates
	        });

	    groupG.exit()
	        .transition()
	            .duration(1500)
	            .attr("opacity", 0)
	            .remove(); //remove after transitions are complete

	    // Colors
// !!! Why are the paths starting out as colors? !!!
		var fill = d3.scale.ordinal()
		    .domain(d3.range(4))
		    // .range(["#000000", "#FFDD89", "#957244", "#F26223"]);
		    .range(["#9986b3", "red", "green", "blue"]);

        var newGroups = groupG.enter().append("g")
	        .attr("class", "chord-sec");

		//create the arc paths and set the constant attributes
	    //(those based on the group index, not on the value)
		newGroups.append("path")
		    .attr("id", function (d) {
	            return "chord-sec" + d.index;
	            //using d.index and not i to maintain consistency
	            //even if groups are sorted
	        })
		    .style("fill", function(d) { return fill(d.index); })
			.style("stroke", function(d) { return fill(d.index); })
		    ;

		// Hide self-referential/non-paired paths for qromp
		entang.hideOwn();

		//update the paths to match the layout
	    groupG.select("path") 
	        .transition()
	            .duration(1500)
	            // .attr("opacity", 0.5) //optional, just to observe the transition
	        .attrTween("d", entang.arcTween( entang.prevLayout ))
	            // .transition().duration(100).attr("opacity", 1) //reset opacity
	        ;

	     /* Create/update the chord paths */
	    var chordPaths = qubitsvg.selectAll("path.chord")
	        .data(layout.chords(), entang.chordKey );
	        	// ~~~ What this mean, yo?
	            //specify a key function to match chords
	            //between updates

	    //create the new chord paths
	    var newChords = chordPaths.enter()
	        .append("path")
	        .attr("class", "chord");

	    //handle exiting paths:
	    chordPaths.exit().transition()
	        .duration(1500)
	        .attr("opacity", 0)
	        .remove();

	    //update the path shape
	    chordPaths.transition()
	        .duration(1500)
	        // .attr("opacity", 0.5) //optional, just to observe the transition
	        .style("fill", function(d) { return fill(d.source.index); })
		    .style("stroke", function(d) { return fill(d.source.index); })
	        .attrTween("d", entang.chordTween(entang.prevLayout))
	        // .transition().duration(100).attr("opacity", 1) //reset opacity
	    ;

// !!! Make this not in a function in future !!!
		//add the mouseover/fade out behaviour to the groups
	    //this is reset on every update, so it will use the latest
	    //chordPaths selection
	    groupG.on("mouseover", entang.fade(.1))
		    .on("mouseout", entang.fade(1));

		entang.prevLayout = layout; //save for next update

	}, // end of updateChord()

// Still from http://stackoverflow.com/questions/21813723/change-and-transition-dataset-in-chord-diagram-with-d3
	arcTween: function (oldLayout) {
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
	            return entang.arc( tween(t) );
	        };
	    };
	},  // end arcTween()

	chordKey: function (data) {
	    return (data.source.index < data.target.index) ?
	        data.source.index  + "-" + data.target.index:
	        data.target.index  + "-" + data.source.index;
	    
	    //create a key that will represent the relationship
	    //between these two groups *regardless*
	    //of which group is called 'source' and which 'target'
	},

	chordTween: function (oldLayout) {
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
	            return entang.path(tween(t));
	        };
	    };
	},  // end chordTween()

	// *** From first chord diagram example *** //
	// Returns an event handler for fading a given chord group.
	fade: function (opacity) {
	  return function(g, indx) {
	    d3.selectAll(".chord")
	        .filter(function(dat) {
	        	return dat.source.index != indx
	        	&& dat.target.index != indx
	        	// Added by knod to keep own chords hidden (for qromp)
	        	&& dat.target.index != dat.target.subindex; 
	        })
	      .transition()
	        .style("opacity", opacity);
	  };
	},

	// *** Custom for qromp *** //
	hideOwn: function () {
		// Unless the path crosses to somewhere, it's opacity will be 0
		d3.selectAll(".chord")
			// Get the paths whose index and subindex match
			// (the path is refering to its own section)
			.filter(function (dat) {
				return dat.target.index == dat.target.subindex;
			})
			.style("opacity", 0);
	},

}
