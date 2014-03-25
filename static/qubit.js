/* qubit.js
* Created by: 
* Date: 03/24/14
* Trying to override the visualizer to implement new
* qubit display
* 
* Sources:
* 
* TODO:
*
* DONE:
* 
*/

var qubits = [];

qubits.arrange = function(percentMargin, percentSpacing) {
	var percentMargin = percentMargin || .9,
		percentSpacing = percentSpacing || .1,
		n = this.length,
		limitingDim = Math.min($visualizer.height(), $visualizer.width()),
		dim = percentMargin * limitingDim;
	if (n === 1) {
		var size = dim * (1 - 2 * percentSpacing);
		this[0].render(size);
	} else {
		var size = 225 / Math.pow(n, .6),
			radius = (dim - size) / 2;
		this.render(size, radius);
	}
}

qubits.render = function(size, radius, yOffset) {
	var radius = radius || 0,
		numQubits = this.length;
	$("#qubitsElements").css({"margin-top": (yOffset || 0) / rem + "rem"});
	for (var i = 0, angle = 180; i < numQubits; i++, angle += 360 / numQubits){
		this[i].render(size).css({
			"-webkit-transform": "translate(-50%, -50%) rotate(" +
			angle + "deg) translateY(" +
			radius / rem + "rem) rotate(-" +
			angle + "deg)"
		});
	}
}

qubits.update = function(qubitStates) {
	for (var i = 0; i < qubitStates.length; i++){
		if (!this[i]) {
			new Qubit(qubitStates[i]);
		} else {
			this[i].UP = qubitStates[i].UP;
			this[i].DOWN = qubitStates[i].DOWN;
			this.arrange();
		}
	}
}

qubits.pop = function() {
	if (this.length > 1){
		this[this.length - 1].$div.remove();
		Array.prototype.pop.call(this);
		this.arrange();
	}
}

qubits.reset = function() {
	for (var i = 0; i < this.length; i++){
		this[i].reset();
	}
}

function Qubit(qubitState) {
	if (qubits.length < 10) {
		if(qubitState){
			this.UP = qubitState.UP;
			this.DOWN = qubitState.DOWN;
		} else {
			this.UP = {prob: 1, phase: 0};
			this.DOWN = {prob: 0, phase: 0};
		}
		this.label = qubits.length;
		// One qubit div
		this.$div = $("<div id='qubit-"+ this.label +"' class='qubit'>"
			// The orbiting circle divs
			+ "<div class='circle phase-up'></div><div class='circle phase-down'></div>"
			// This will center the probability area
			+ "<div class='prob-spacer'></div>"
			// Create the probability area
			+ "<div class='prob-div'>"
			+ "<div class='up-prob'></div><div class='down-prob'></div>"
			+ "</div></div>");
		$("#qubitElements").append(this.$div);
		qubits.push(this);
		qubits.arrange();
	}
}

Qubit.prototype.render = function(size) {
	this.$div.css({
		"width": (size / rem) + "rem",
		"height": (size / rem) + "rem",
		"-webkit-transform": "translate(-50%, -50%)"
	}).children(".prob-div").children(".up-prob").css({"height": this.UP.prob * 100 + "%"});
	console.log(this.UP.prob * 100);
	return this.$div;
}

Qubit.prototype.reset = function() {
	this.UP = {prob: 1, phase: 0};
	this.DOWN = {prob: 0, phase: 0};
}
