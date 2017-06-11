// Initialize Firebase
var config = {
	apiKey: "AIzaSyAtVioWBqR2KGFyxmDXTu27W7AKe6xwtzI",
	authDomain: "trainschedule-1fce4.firebaseapp.com",
	databaseURL: "https://trainschedule-1fce4.firebaseio.com",
	projectId: "trainschedule-1fce4",
	storageBucket: "trainschedule-1fce4.appspot.com",
	messagingSenderId: "27202443767"
};
firebase.initializeApp(config);
var dataBase = firebase.database().ref();
var trainCount = 0;
var myTrains = [];

//get the trains from the dataBase
dataBase.once("value", function(snapshot) {
	trainCount = snapshot.numChildren();
	snapshot.forEach(function(child){
		printNewTrain(child.val());
	});
});

//train object constructor for creating new train objects
function Train(name, dest, arrival, freq){
	this.name = name;
	this.dest = dest;
	this.arrival = arrival;
	this.freq = freq;
	this.show = true;
	this.key = dataBase.push().key;
	dataBase.child(this.key).set(this);
	trainCount ++;
	printNewTrain(this);
}

//putting train on HTML and into array
function printNewTrain(myTrain){
	var trainRow = $("<div class = 'row train'>");
	var btnDiv = $("<div class = 'col-xs-1'>");
	var nameDiv = $("<div class = 'col-xs-2'>");
	var destDiv = $("<div class = 'col-xs-2'>");
	var freqDiv = $("<div class = 'col-xs-2'>");
	var arrivalDiv = $("<div class = 'col-xs-2'>");
	var timeDiv = $("<div class = 'col-xs-2'>");

	btnDiv.append("<button class = 'btnDelete' data-key = '" + myTrain.key + "'> Delete </button>");
	nameDiv.append("<p>" + myTrain.name + "</p>");
	destDiv.append("<p>" + myTrain.dest + "</p>");
	//the arrival will need to be adjusted based on current time
	arrivalDiv.append("<p>" + myTrain.arrival + "</p>");
	freqDiv.append("<p>" + myTrain.freq + "</p>");
	//time will also need to be adjusted based on current time
	timeDiv.append("<p>" + 15 + "</p>");

	trainRow.append(btnDiv).append(nameDiv).append(destDiv).append(freqDiv).append(arrivalDiv).append(timeDiv);
	$("#trainInfo").append(trainRow);
	myTrains.push(myTrain);
}


$("#btnNewTrain").on("click",function(){
	var name = $("#nameInput").val();
	var dest = $("#destInput").val();
	var arrival = $("#arrivalInput").val();
	var freq = $("#freqInput").val();
	if (name === "" || dest === "" || arrival === "" || freq === ""){
		alert("All fields are required");
		return false;
	}

	var myTrain = new Train(name,dest,arrival,freq);
});

$(".container").on("click",".btnDelete",function(){
	var myKey = $(this).attr("data-key")
	dataBase.child(myKey).remove();
})