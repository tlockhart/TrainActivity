// Step1:  Initialize Firebase
  var config = {
    apiKey: "AIzaSyCTIyGUugG4jiQbn2ZoeFjqF3LcEggdWDQ",
    authDomain: "train-schedule-6c69a.firebaseapp.com",
    databaseURL: "https://train-schedule-6c69a.firebaseio.com",
    projectId: "train-schedule-6c69a",
    storageBucket: "train-schedule-6c69a.appspot.com",
    messagingSenderId: "289907468689"
  };
  firebase.initializeApp(config);

  //Step2: Create a variable to reference the database
  var database = firebase.database();

  //Step3: Set Global Variables Initial Values
  var name = "";
  var destination = "";
  var firstArrival =0;
  var frequency = 0;

  //Timer variables
  var updateTimerId;
  var updateTimerRunning = false;

  var dbUpdateTimer = {
    timeLimit :10,
    stop: function(){
         // DONE: Use clearInterval to stop the count here and set the clock to not be running.
            clearInterval(updateTimerId);
            updateTimerRunning = false;
           // //console.log("NEXT QUESTION TIMER HAS BEEN STOPPED!")
            //console.error("Stopping nextQuestionStopWatch");
    },
    start: function(){
        if (!nextQuestionClockRunning) {
            updateTimerId = setInterval(updateDataBase,  1000 * dbUpdateTimer.timeLimit);
            updateTimerRunning = true;
            //console.log("NEXT QUESTION TIMER HAS BEEN STARTED");
             //console.error("Starting nextQuestionStopWatch");
        }//if
    }
}

  //Step4: Set Global Calculated Variables
  var arrival = 0; 
  var minutesAway = 0; 
  var invalidTimeMsg = "Please enter a valid time."
  var $displayfirstTimeError = $("#first-time-input").attr('is-error');
  console.log("**firstTimeError = "+$displayfirstTimeError);

  //Step5: Capture Button Click and store Input into DB
  $("#submit-train").on("click", function(event) {
    // Don't refresh the page!
    event.preventDefault();

    // YOUR TASK!!!
    // Code in the logic for storing and retrieving the most recent user.
    // Don't forget to provide initial data to your Firebase database.
    name = $("#name-input").val().trim();
    destination = $("#destination-input").val().trim();
    firstArrival = $("#first-time-input").val().trim();
    firstArrivalObject = moment(firstArrival, "HH:mm").format("X");//Set format to Unix Epoch

    //Step6A - Edge Case Error Handling: Do not except evalid date
    if (firstArrivalObject === "Invalid date"){
      $("#first-time-input").val(invalidTimeMsg);
      $("#first-time-input").attr('is-error', 'true');
      
      console.log("Invalid date");
      return;
    }
    frequency = $("#frequency-input").val().trim();

    console.log("Name = "+name);
    console.log("Destination = "+destination);
    console.log("First Arrival Time = "+firstArrival);
    console.log("Frequency = "+frequency);

    database.ref().push({
      nameDB: name,
      destinationDB: destination,
      firstArrivalDB: firstArrival,
      frequencyDB: frequency
    });//Push

    //Step6B - Edge Case Error Handling: Reset color of first time field
    $("#first-time-input").attr('is-error', 'false');//reset error attribute to false
  });//submit-click even

    //Step7: Clear Input values after they are stored in the DB
    $("#name-input").val('');
    $("#destination-input").val('');
    $("#first-time-input").val('');

    //Step8: Take a snapshot and save db values to global variables to be displayed on DB update
      database.ref().on("child_added", function(snapshot){
        var records = snapshot.val();

        //Step7: Pull data directly from DB, not the reinitialized Global Variables, to populate the table
        /*var nameDBRef = records.nameDB;
        var destinationDBRef = records.destinationDB;
        var firstArrivalDBRef = records.firstArrivalDB;
        var frequencyDBRef = records.frequencyDB;*/
        name = records.nameDB;
        destination = records.destinationDB;
        firstArrival = records.firstArrivalDB;
        frequency = records.frequencyDB;

        //Step9: Assign values to Global Calculated fields
        /*****************************
        * Calculate Months Worked
        ******************************/
       var firstArrivalTimeFormat = "HH:mm:ss";
       var currentTime = moment(moment(), firstArrivalTimeFormat);
       var firstArrivalTime = moment(firstArrival, firstArrivalTimeFormat);
       var diffInMinutes = currentTime.diff(firstArrivalTime, 'minutes');
       /******************************************************************* */
       console.log("CurrentTime = "+currentTime);
       console.log("PastTime = "+firstArrivalTime);
       console.log("Difference between past and current in TIME in Hours = "+diffInMinutes);

        var timeSpentInWait = diffInMinutes % frequency;
        console.log("Time spent in wait = "+timeSpentInWait);

        minutesAway = moment(frequency-timeSpentInWait, 'minutes').format('mm');
        console.log("Train is "+minutesAway+" minutes away");

        arrival = currentTime.add(minutesAway, 'minutes').format('HH:mm:ss a');
        //formattedArrivalTime = arrival.format('LT');

        //console.log("ArrivalCALC = "+formattedArrivalTime);
        console.log("ArrivalCALC = "+arrival);
        /******************************************************************* */         
        //console.log("In database eventlistener");
        /*console.log("NameDB = "+nameDBRef);
        console.log("DestinationDB = "+destinationDBRef);
        console.log("FirstArrivalDB = "+firstArrivalDBRef);
        console.log("FrequencyDB = "+frequencyDBRef);

        //Step10: Append data to table
        appendTRElement(nameDBRef, destinationDBRef, frequencyDBRef, arrival, minutesAway);*/

        console.log("In database eventlistener");
        console.log("Name = "+name);
        console.log("Destination = "+destination);
        console.log("FirstArrival = "+firstArrival);
        console.log("Frequency = "+frequency);

        //Step11: Append data to table
        appendTRElement(name, destination, frequency, arrival, minutesAway);
      // Handle the errors
      }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
      });//db eventlisterner*/

      function appendTRElement(nameDBRef, destinationDBRef, frequencyDBRef, arrival, minutesAway){
        //create table row
        $newTRElement = $('<tr>');

        /***************************
         Create table data for name
        ****************************/
        $newTDName = $('<td>');
        $newTDName.attr('id','name-display');
        $newTDName.text(nameDBRef);
        //append Table Data name to Table Row
        $newTRElement.append($newTDName);

         /***************************
         Create table data for role
        ****************************/
        $newTDDestination = $('<td>');
        $newTDDestination.attr('id','destination-display');
        $newTDDestination.text(destinationDBRef);
        //Append Table Data rate to Table Row
        $newTRElement.append($newTDDestination);

         /***************************
         Create table data for Start Date
        ****************************/
       $newTDFrequency = $('<td>');
       $newTDFrequency.attr('id','frequency-display');
       $newTDFrequency.text(frequencyDBRef);
       //Append Table Data rate to Table Row
       $newTRElement.append($newTDFrequency);

        /***********************************
         Create table data for Months Worked
        ************************************/
       $newTDArrival = $('<td>');
       $newTDArrival.attr('id','arrival-display');
       $newTDArrival.text(arrival);
       //Append Table Data rate to Table Row
       $newTRElement.append($newTDArrival);

        /***************************
         Create table data for rate
        ****************************/
        $newTDMinsAway = $('<td>');
        $newTDMinsAway.attr('id','minutes-away-display');
        $newTDMinsAway.text(minutesAway);
        //Append Table Data rate to Table Row
        $newTRElement.append($newTDMinsAway);
       
       //append Table Row to Table Body
        /***************************/
        $('#train-body').append($newTRElement);
        /****************************/
      }//AppendElement
 