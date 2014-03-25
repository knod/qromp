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
		this.$div = $("<div id='qubit-"+ this.label +"' class='qubit'><div class='up-prob'></div><div class='down-prob'></div></div>");
		$("#qubitElements").append(this.$div);
		qubits.push(this);
		qubits.arrange();
	}
}