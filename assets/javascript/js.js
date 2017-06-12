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

// firebase.auth().signInWithRedirect(provider)

// firebase.auth().getRedirectResult().then(function(result) {
//   if (result.credential) {
//     // This gives you a GitHub Access Token. You can use it to access the GitHub API.
//     var token = result.credential.accessToken;
//     // ...
//   }
//   // The signed-in user info.
//   var user = result.user;
// }).catch(function(error) {
//   // Handle Errors here.
//   var errorCode = error.code;
//   var errorMessage = error.message;
//   // The email of the user's account used.
//   var email = error.email;
//   // The firebase.auth.AuthCredential type that was used.
//   var credential = error.credential;
//   // ...
// });

// firebase.auth().signInWithPopup(provider).then(function(result) {
//   // This gives you a GitHub Access Token. You can use it to access the GitHub API.
//   var token = result.credential.accessToken;
//   // The signed-in user info.
//   var user = result.user;
//   // ...
// }).catch(function(error) {
//   // Handle Errors here.
//   var errorCode = error.code;
//   var errorMessage = error.message;
//   // The email of the user's account used.
//   var email = error.email;
//   // The firebase.auth.AuthCredential type that was used.
//   var credential = error.credential;
//   // ...
// });

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
var closingTime = "23:00";  //trains close at 11pm
var myTime = new Date().toTimeString().substring(0,5); //simple time in form hh:mm
var TrainEndPoint = dataBase.child("Trains");
var mapHolderString;
var mapHolderObject;

var currentSeconds = new Date().getSeconds();
setTimeout(function(){
	updateTimes();
	setInterval(updateTimes,60000);
},(60-currentSeconds)*1000);



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
	var arrString = getNextTrain(myTrain);
	arrivalDiv.append("<p>" + arrString + "</p>");
	freqDiv.append("<p>" + myTrain.freq + "</p>");
	//time will also need to be adjusted based on current time
	if (arrString === "Closed"){
		timeDiv.append("<p>" + "Tomorrow at " + myTrain.arrival + "</p>")
	}else{
		timeDiv.append("<p>" + minutesBetween(myTime,arrString) + "</p>");
	}
	

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
	//ensure that frequency is within certain parameters
	if( parseInt(freq,10) <= 0){
		alert("Frequency must be a positive number");
		return false;
	} else if( parseInt(freq,10) >  1440){
		alert("frequency must be less than 24 hours.  Use a value of 1440 minutes for a train that only arrives once per day.")
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


//this is able to add a certain number of minutes to an arrival time.
//the strings created here can be compared lexigraphically due to the leading zeroes.
function addMinutes(time= "00:00" , minutes= 10){
	var hourNum = parseInt(time.substring(0,2),10);
	var minNum = parseInt(time.substring(3,5),10);

	minNum += minutes;
	//correct for going over 60
	while(minNum>=60){
		if (minNum >=60){
			hourNum ++;
			minNum -= 60;
		}
	}
	//correct for going over 24(doesn't change the day or anything, just reset)
	while(hourNum>=24){	
		if (hourNum >= 24){
			hourNum -= 24;
		}
	}
	//rebuild string
	var hourString;
	if (hourNum < 10){
		hourString = "0"+hourNum;
	}else{
		hourString = "" + hourNum;
	}
	var minString;
	if (minNum < 10){
		minString = "0"+minNum;
	}else{
		minString = "" + minNum;
	}
	return  hourString + ":" + minString;
}

//this will check to see how many minutes are remaining between two times
//if the second parameter is left blank, it will default to closing time.
function minutesBetween(currentTime, laterTime = closingTime){
	var hourNum = parseInt(currentTime.substring(0,2),10);
	var minNum = parseInt(currentTime.substring(3,5),10);

	var currentMinutes = hourNum*60 + minNum;

	var closeHour = parseInt(laterTime.substring(0,2),10);
	var closeMin = parseInt(laterTime.substring(3,5),10);

	var closingMinutes = closeHour*60 + closeMin;

	var minutesRemaining = closingMinutes - currentMinutes;

	if(minutesRemaining < 0){
		//the train depot is closed
		return "Closed"
	} else if(minutesRemaining === 0){
		//train is waiting
		return "Waiting at station"
	}else {
		return minutesRemaining;
	}
	

}

//get the next arrival time for a certain train Object
function getNextTrain(myTrain){ 
	var trainTime = myTrain.arrival;
	var currentTime = myTime;
	var foundTime = false;
	while(foundTime === false){
		if(trainTime > currentTime){
			//the train has not arrived yet
			return trainTime;
		} else if (trainTime === currentTime){
			//the train is arriving right now
			return trainTime;
		} else {
			//the train is still on its route
			trainTime = addMinutes(trainTime,parseInt(myTrain.freq,10));
		}
		if(parseInt(myTrain.freq,10) > minutesBetween(currentTime)){
			//this train has a frequency larger than the time left in the day.  It will not arrive agian until tommorow
			return "Closed"
		}
	}
}

//every minute, I need to loop thru the trains and update the times
function updateTimes(){
	myTime = new Date().toTimeString().substring(0,5); //simple time in form hh:mm
	for(var i = 0; i < myTrains.length; i++){
		var arrString = getNextTrain(myTrains[i]);
		//this will access the train's arrival time
		$("#trainInfo").children().eq(i).children().eq(4).children().eq(0).text(arrString);

		//time will also need to be adjusted based on current time
		if (arrString === "Closed"){
			var myMinutes = "Tomorrow at " + myTrains[i].arrival;
		}else{
			var myMinutes =  minutesBetween(myTime,arrString);
		}
		//this will access the train's minutes left
		$("#trainInfo").children().eq(i).children().eq(5).children().eq(0).text(myMinutes);
	}
	
}