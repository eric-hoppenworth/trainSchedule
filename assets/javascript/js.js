// Initialize Firebase and authenticate/////////////////
var config = {
	apiKey: "AIzaSyAtVioWBqR2KGFyxmDXTu27W7AKe6xwtzI",
	authDomain: "trainschedule-1fce4.firebaseapp.com",
	databaseURL: "https://trainschedule-1fce4.firebaseio.com",
	projectId: "trainschedule-1fce4",
	storageBucket: "trainschedule-1fce4.appspot.com",
	messagingSenderId: "27202443767"
};
firebase.initializeApp(config);

// Start a sign in process for an unauthenticated user.
var provider = new firebase.auth.GithubAuthProvider();
provider.addScope('repo');

$("#signIn").on("click",function(){
	firebase.auth().signInWithRedirect(provider);

	// Using a redirect.
	firebase.auth().getRedirectResult().then(function(result) {
	  if (result.credential) {
	    // This gives you a GitHub Access Token.
	    var token = result.credential.accessToken;
	  }
	  var user = result.user;

	}).catch(function(error) {
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  // The email of the user's account used.
	  var email = error.email;
	  // The firebase.auth.AuthCredential type that was used.
	  var credential = error.credential;
	  if (errorCode === 'auth/account-exists-with-different-credential') {
	    alert('You have signed up with a different provider for that email.');
	    // Handle linking here if your app allows it.
	  } else {
	    console.error(error);
	  }
	});

})



///////////////////////////////////////////////////////////////////
//     Globals    /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////


var dataBase = firebase.database().ref();
var myTrains = [];
var myCities = [];
var closingTime = "23:00";  //trains close at 11pm
var myTime = new Date().toTimeString().substring(0,5); //simple time in form hh:mm
var TrainEndPoint = dataBase.child("Trains");
var CityEndPoint = dataBase.child("Cities");

var mapHolderString;
var mapHolderObject;

dataBase.once("value",function(snapshot){
	//remove the sign in button
  	//$("#signIn").remove();
	//put map on the page
	$("#mapHolder").html('<img id="myMap" alt="A map of the US" src="assets/images/map.png">');
	for (var i = 0; i < myCities.length;i++){
		printNewCity(myCities[i]);
	}
})


///////////////////////////////////////////////////////////////////
//       Manage Trains      ///////////////////////////////////////
///////////////////////////////////////////////////////////////////


//train object constructor for creating new train objects
function Train(name, dest, arrival, freq){
	this.name = name;
	this.dest = dest;
	this.arrival = arrival;
	this.freq = freq;
	//put the new train into the database
	this.key = TrainEndPoint.push().key;
	TrainEndPoint.child(this.key).set(this);
};


//get the trains from the database and put them on the screen
TrainEndPoint.on("child_added", function(snapshot) {
	var myTrain = snapshot.val();
	printNewTrain(myTrain);
	var trainIndex = myTrains.length;
	myTrains.push(myTrain);
	updateTime(trainIndex);
});

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
	timeDiv.append("<p>" + "Tomorrow at " + myTrain.arrival + "</p>");

	trainRow.append(btnDiv).append(nameDiv).append(destDiv).append(freqDiv).append(arrivalDiv).append(timeDiv);
	$("#trainInfo").append(trainRow);
}

//button for adding trains
$("#btnNewTrain").on("click",function(){
	var name = $("#nameInput").val();
	var dest = $("#destInput").val();
	var arrival = $("#arrivalInput").val();
	var freq = $("#freqInput").val();

	//validate data
	if (name === "" || dest === "" || arrival === "" || freq === ""){
		alert("All fields are required");
		return false;
	}
	//ensure that frequency is within certain parameters
	if( parseInt(freq,10) <= 0){
		alert("Frequency must be a positive number");
		return false;
	} else if( parseInt(freq,10) >  1440){
		alert("frequency must be less than 24 hours.  Use a value of 1440 minutes for a train that only arrives once per day.");
		return false;
	}
	//clear inputs
	$("#nameInput").val("");
	$("#destInput").val("");
	$("#arrivalInput").val("");
	$("#freqInput").val("");
	//create a new trainOBject
	var myTrain = new Train(name,dest,arrival,freq);
});


//button for removing trains
//removes form database, array, and HTML.
$(".container").on("click",".btnDelete",function(){
	var myKey = $(this).attr("data-key");
	TrainEndPoint.child(myKey).remove();
	var index = $(".btnDelete").index(this);
	myTrains.splice(index,1);
	$(".trainRow").eq(index).remove();
});

///////////////////////////////////////////////////////////////////
//  Manage Cities /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////


//object constructor for city
function City(name,position){

	this.name = name;
	this.position = position;
	this.key = CityEndPoint.push().key;
	//save the city in the dataBase
	CityEndPoint.child(this.key).set(this);
}

//when added to the database, add to array and HTML
CityEndPoint.on("child_added",function(snapshot){
	var myCity = snapshot.val();
	printNewCity(myCity);
	myCities.push(myCity)
});

function printNewCity(myCity){
	var holder = $("<div>");
	holder.addClass("city");
	holder.attr("data-name",myCity.name);
	holder.attr("data-key",myCity.key);
	var newStar = $("<img>");
	newStar.attr("src","assets/images/star.png");
	newStar.addClass("star");
	var txt = $("<p>").text(myCity.name);
	holder.append(newStar);
	holder.append(txt);
	holder.css(myCity.position);
	//put on map
	$("#mapHolder").append(holder);

};

//if you click the add button, you will be able to add a new city to the map
$("#btnAddCity").on("click",function(){
	$("#myMap").one("click",function(event){

		var cityName = prompt("What is the name of the city you are adding?");

		//validation
		if(myCities.indexOf(cityName) > -1){
			alert("A city with that name already exists");
			return false;
		}
		if(cityName === null){
			return false;
		}

		//calculate mouse position
		var mapX = $(this).offset().left - $(this).position().left;
		var mapY = $(this).offset().top - $(this).position().top;
		var starX = event.pageX - mapX;
		var starY = event.pageY - mapY;
		var starPosition = {
			left: starX,
			top: starY
		};
		//create newCity object
		var myCity = new City(cityName,starPosition);
	});
});

//if you click a city already on the map, you can remove it
$("#mapHolder").on("click",".city", function(){
	//update database
	var key = $(this).attr("data-key");
	CityEndPoint.child(key).remove();
	var index = myCities.indexOf($(this).attr("data-name"));
	myCities.splice(index,1);

	//remove from HTML
	$(this).remove();

})

///////////////////////////////////////////////////////////////////
//  Manage Times  /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

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
	//this one neven changes
	var arrivalTime = myTrain.arrival;
	//this one will
	var scheduleTime = myTrain.arrival;
	var currentTime = myTime;
	var foundTime = false;
	//first check to see if the train has had its first arrival
	if (arrivalTime > currentTime) {
		return "First Train";
	}
	while(foundTime === false){
		if(scheduleTime > currentTime){
			//the train has not arrived yet
			return scheduleTime;
		} else if (scheduleTime === currentTime){
			//the train is arriving right now
			return scheduleTime;
		} else {
			//the train is still on its route
			scheduleTime = addMinutes(scheduleTime,parseInt(myTrain.freq,10));
		}
		if(parseInt(myTrain.freq,10) > minutesBetween(currentTime)){
			//this train has a frequency larger than the time left in the day.  It will not arrive agian until tommorow
			return "Closed"
		}
	}
}

//every minute, I need to loop thru the trains and update the times
function updateAllTimes(){
	for(var i = 0; i < myTrains.length; i++){
		updateTime(i);
	}

}
function updateTime(trainIndex){
	myTime = new Date().toTimeString().substring(0,5); //simple time in form hh:mm
	var i = trainIndex
	var arrivalString = getNextTrain(myTrains[i]);
	//this will access the train's arrival time
	if(arrivalString === "First Train"){
		$("#trainInfo").children().eq(i).children().eq(4).children().eq(0).text(myTrains[i].arrival)
	} else{
		$("#trainInfo").children().eq(i).children().eq(4).children().eq(0).text(arrivalString);
	}
	
	var myMinutes;
	//time will also need to be adjusted based on current time
	if (arrivalString === "Closed"){
		myMinutes = "Tomorrow at " + myTrains[i].arrival;
	}else if (arrivalString === "First Train"){
		myMinutes = "First Train of the Day in " + minutesBetween(myTime,myTrains[i].arrival);
	}else{
		myMinutes =  minutesBetween(myTime,arrivalString);
	}
	//this will access the train's minutes left
	$("#trainInfo").children().eq(i).children().eq(5).children().eq(0).text(myMinutes);
}


///////////////////////////
// Code to run on Start ///
///////////////////////////
var currentSeconds = new Date().getSeconds();
setTimeout(function(){
	updateAllTimes();
	setInterval(updateAllTimes,60000);
},(60-currentSeconds)*1000);


// function TrainAI(name,dest,arr,freq){
// 	$("#destination").val(dest);
// 	$("#startTime").val(arr);
// 	$("#name").val(name);
// 	$("#frequency").val(freq);

// 	for (var i = 0; i<100;i++){
// 		var time = 2000;
// 		setTimeout(clickMe,time*i);
// 	}
// }

// function clickMe(){
// 	$("#submit").click();
// }