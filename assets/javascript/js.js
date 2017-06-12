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

//authentication
var provider = new firebase.auth.GithubAuthProvider();

firebase.auth().signInWithPopup(provider).then(function(result) {
  // This gives you a GitHub Access Token. You can use it to access the GitHub API.
  var token = result.credential.accessToken;
  // The signed-in user info.
  var user = result.user;
  // ...
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
});

//train object constructor for creating new train objects
function Train(name, dest, arrival, freq){
	this.name = name;
	this.dest = dest;
	this.arrival = arrival;
	this.freq = freq;
	this.show = true;
	//put the new train into the database
	this.key = TrainEndPoint.push().key;
	TrainEndPoint.child(this.key).set(this);
	trainCount ++;
	printNewTrain(this);
};

//object constructor for city
function City(name,position){
	this.holder = $("<div>");
	this.holder.addClass("city");
	this.holder.attr("data-name",name);
	this.name = name;
	this.position = position
	var newStar = $("<img>");
	newStar.attr("src","assets/images/star.png");
	newStar.addClass("star");
	var txt = $("<p>").text(name);
	this.holder.append(newStar);
	this.holder.append(txt);
	this.holder.css(position);
	//put on map
	$("#mapHolder").append(this.holder);
	//add to array
	myCities.push(name);
	//save the map in the dataBase
	mapHolderString = JSON.stringify($("#mapHolder").html());
	dataBase.child("mapHolder").set(mapHolderString);
}


var dataBase = firebase.database().ref();
var trainCount = 0;
var myTrains = [];
var myCities = [];
var myTime;
var TrainEndPoint = dataBase.child("Trains");
var mapHolderString;
var mapHolderObject;



//get the trains from the dataBase
TrainEndPoint.once("value", function(snapshot) {
	trainCount = snapshot.numChildren();
	snapshot.forEach(function(child){
		printNewTrain(child.val());
	});
});
dataBase.child("mapHolder").once("value",function(snapshot){
	//retrieve the map object
	mapHolderObject = JSON.parse(snapshot.val());
	$("#mapHolder").append(mapHolderObject);
	//something to count the number of cities
	$(".city").each(function(){
		myCities.push($(this).attr("data-name"));
	})
})


//putting train on HTML and into array
function printNewTrain(myTrain){
	var trainRow = $("<div class = 'row trainRow'>");
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
	$("#nameInput").val("");
	$("#destInput").val("");
	$("#arrivalInput").val("");
	$("#freqInput").val("");
	var myTrain = new Train(name,dest,arrival,freq);
});

$(".container").on("click",".btnDelete",function(){
	var myKey = $(this).attr("data-key")
	TrainEndPoint.child(myKey).remove();
	var index = $(".btnDelete").index(this);
	$(".trainRow").eq(index).remove();
})

$("#btnAddCity").on("click",function(){
	$("#myMap").one("click",function(event){

		var cityName = prompt("What is the name of the city you are adding?");

		if(myCities.indexOf(cityName) > -1){
			alert("A city with that name already exists");
			return false;
		}


		var mapX = $(this).offset().left - $(this).position().left;
		var mapY = $(this).offset().top - $(this).position().top;
		var starX = event.pageX - mapX;
		var starY = event.pageY - mapY;
		var starPosition = {
			left: starX,
			top: starY
		};

		new City(cityName,starPosition);
	});
});

function getTime(){
	myTime = new Date();
	console.log(myTime.getYear());
	console.log(myTime.getMonth());
	console.log(myTime.getDate());
	console.log(myTime.getDay());
	console.log(myTime.getHours());
	console.log(myTime.getMinutes());
	//neat-o
}

