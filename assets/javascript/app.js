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
  var firstArrival = 0;
  var frequency = 0;

  //Timer variables
  var updateTimerId;
  var updateTimerRunning = false;

  //Step4: Set Global Calculated Variables
  var arrival = 0; 
  var minutesAway = 0; 
  var invalidTimeMsg = "Please enter a valid value."
  var $displayfirstTimeError = $("#first-time-input").attr('is-error');
  console.log("**firstTimeError = "+$displayfirstTimeError);

  var displayUpdateTimer = {
    timeLimit :60,//60s equal 1 min
    stop: function(){
         // DONE: Use clearInterval to stop the count here and set the clock to not be running.
            clearInterval(updateTimerId);
            updateTimerRunning = false;
    },
    start: function(){
        if (!updateTimerRunning) {
            updateTimerId = setInterval(updateDisplay,  1000 * displayUpdateTimer.timeLimit);
            updateTimerRunning = true;
        }//if
    }
}

  //Start timer for DB updates
  displayUpdateTimer.start();

  //Step5: Capture Button Click and store Input into DB
  $("#submit-train").on("click", function(event) {
    // Don't refresh the page!
    event.preventDefault();

    name = $("#name-input").val().trim();
    destination = $("#destination-input").val().trim();
    firstArrival = $("#first-time-input").val().trim();

    //Set format to Unix Epoch, subtract a year from the firstArrival time, so the first train time is never after the current time.
    firstArrivalObject = moment(firstArrival, "HH:mm")/*.subtract(1, "years")*/.format("X");
    frequency = $("#frequency-input").val().trim();

    //Step6 - Edge Case Error Handling: Do not except evalid date
    var invalidInput = false;
   
    if(!name){
      $("#name-error").text(invalidTimeMsg);
      $("#name-error").attr('is-error', 'true');
      invalidInput = true;
      console.log("Name = "+name);
    }
    if(!destination){
      $("#destination-error").text(invalidTimeMsg);
      $("#destination-error").attr('is-error', 'true');
      invalidInput = true;
      console.log("destination = "+destination);
    }
    if (firstArrivalObject === "Invalid date"){
      $("#first-time-error").text(invalidTimeMsg);
      $("#first-time-error").attr('is-error', 'true');
      invalidInput = true;
      console.log("firstArrivalObject = "+firstArrivalObject);
      //return;
    }
    if(!frequency.match(/^\d+$/)){
      $("#frequency-error").text(invalidTimeMsg);
      $("#frequency-error").attr('is-error', 'true');
      invalidInput = true;
      console.log("frequency = "+frequency);
    }

    if(invalidInput){
      return;
    }
    
    console.log("Name = "+name);
    console.log("Destination = "+destination);
    console.log("First Arrival Time = "+firstArrival);
    console.log("Frequency = "+frequency);

    database.ref().push({
      nameDB: name,
      destinationDB: destination,
      firstArrivalDB: firstArrivalObject,
      frequencyDB: frequency
    });//database Push

   //Step7: Clear Input values after they are stored in the DB, On Button Click
   $("#name-error").empty();
   $("#name-input").val('');
   $("#destination-error").empty();
   $("#destination-input").val('');
   $("#first-time-error").empty();
   $("#first-time-input").val('');
   $("#frequency-error").empty();
   $("#frequency-input").val('');

    //Step8A: Call Update Form display, On Button Click
    updateDisplay();
  });//submit-click even

      function updateDisplay(){
        //Step9: Empty out all the Table elements before appending new data
         $('#train-body').empty();

        //Step10: Take a snapshot and save db values to global variables to be displayed on DB update
        database.ref().on("child_added", function(snapshot){
          var records = snapshot.val();

          //Step11: Pull data directly from DB, not the reinitialized Global Variables, to populate the table
          name = records.nameDB;
          destination = records.destinationDB;
          firstArrival = records.firstArrivalDB;
          frequency = parseInt(records.frequencyDB);//Uncessary Conversion

          //Step12: Assign values to Global Calculated fields
          /*****************************
          * Calculate Arrival Times
          ******************************/
        //BROKE THE CODE, because moment accept the format of the data as the second argument, the format must match the data
        //var currentTime = moment(moment(), firstArrivalTimeFormat); 
        var currentTime = moment();
        var firstArrivalTime = moment(firstArrival, "X");
        var diffInMinutes = currentTime.diff(firstArrivalTime, 'minutes');

        //Prevent prob when first Arrival Time is later than Current Time
        console.log("DIFF IN MINUTES = "+diffInMinutes);
       if (diffInMinutes < 0){
          console.log("ABNORMAL TIME: CURRENT TIME BEFORE FIRST TIME");
          diffInMinutes = Math.abs(diffInMinutes);//return positive value

          //Set mins to abs value of the difference between the current Time and First Arrival Time
          minutesAway = diffInMinutes;
          console.log("Train is "+minutesAway+" minutes away");

          //Set Arrival Time to the FirstArrival Time, since it hasn't occured yet
          arrival = firstArrivalTime.format('HH:mm:ss a');
        }
        else {
          console.log("NORMAL TIME:FIRST TIME BEFORE CURRENT TIME");
        /***************************************************************** */
        //Display formatted times
        /******************************************************************* */
        console.log("CurrentTime Formatted = "+currentTime.format('HH:mm:ss a'));
        console.log("FirstTime Formatted = "+firstArrivalTime.format('HH:mm:ss a'));
        console.log("Difference between firstArrival and current TIME in Minutes = "+diffInMinutes);
        
        /************************************************************************
         /**********************************************************************
          * Use UNIX EPOCH TIME FOR CALCULATIONS: DO NOT TOUCH THIS CODE
          **********************************************************************/
          var timeSpentInWait = diffInMinutes %  frequency;
          console.log("Time spent in wait = "+timeSpentInWait);

          //Redundant since minutesAway is already in mins format
          //minutesAway = moment( frequency-timeSpentInWait, "minutes").format('mm'); 
          minutesAway = frequency-timeSpentInWait;
          
          console.log("Train is "+minutesAway+" minutes away");

          arrival = currentTime.add(minutesAway, 'minutes').format('HH:mm:ss a');
          console.log("ArrivalCALC = "+arrival);
          /******************************************************************* */         
          console.log("In database eventlistener");
          console.log("Name = "+name);
          console.log("Destination = "+destination);
          console.log("FirstArrival = "+firstArrival);
          console.log("Frequency = "+ frequency);
        }
          //Step13: Append data to table
          appendTRElement(name, destination,  frequency, arrival, minutesAway);
        // Handle the errors
        }, function(errorObject) {
          console.log("Errors handled: " + errorObject.code);
        });//db eventlisterner*/
      }//updateDisplay

      function appendTRElement(name, destination, frequency, arrival, minutesAway){
        //create table row
        $newTRElement = $('<tr>');

        /***************************
         Create table data for name
        ****************************/
        $newTDName = $('<td>');
        $newTDName.attr('id','name-display');
        $newTDName.text(name);
        //append Table Data name to Table Row
        $newTRElement.append($newTDName);

         /***************************
         Create table data for role
        ****************************/
        $newTDDestination = $('<td>');
        $newTDDestination.attr('id','destination-display');
        $newTDDestination.text(destination);
        //Append Table Data rate to Table Row
        $newTRElement.append($newTDDestination);

         /***************************
         Create table data for Start Date
        ****************************/
       $newTDFrequency = $('<td>');
       $newTDFrequency.attr('id','frequency-display');
       $newTDFrequency.text(frequency);
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

      //Step8B: Call Update Form display, if the button is not clicked, to pull whatever is in db
      updateDisplay();
 