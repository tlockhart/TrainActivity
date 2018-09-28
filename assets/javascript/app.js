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

  var displayUpdateTimer = {
    timeLimit :60,//60s equal 1 min
    stop: function(){
         // DONE: Use clearInterval to stop the count here and set the clock to not be running.
            clearInterval(updateTimerId);
            updateTimerRunning = false;
           // //console.log("NEXT QUESTION TIMER HAS BEEN STOPPED!")
            //console.error("Stopping nextQuestionStopWatch");
    },
    start: function(){
        if (!updateTimerRunning) {
            updateTimerId = setInterval(updateDisplay,  1000 * displayUpdateTimer.timeLimit);
            updateTimerRunning = true;
            //console.log("NEXT QUESTION TIMER HAS BEEN STARTED");
             //console.error("Starting nextQuestionStopWatch");
        }//if
    }
}

  //Start timer for DB updates
  displayUpdateTimer.start();

  //Step4: Set Global Calculated Variables
  var arrival = 0; 
  var minutesAway = 0; 
  var invalidTimeMsg = "Please enter a valid value."
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
    frequency = $("#frequency-input").val().trim();

    //Step6 - Edge Case Error Handling: Do not except evalid date
    var invalidInput = false;
    /*if(name && destination && firstArrival){
      console.log("--------Invalid Information----------");
      invalidInput = true;
      //return;
    }*/
    if(!name){
      $("#name-input").val(invalidTimeMsg);
      $("#name-input").attr('is-error', 'true');
      invalidInput = true;
      console.log("Name = "+name);
    }
    if(!destination){
      $("#destination-input").val(invalidTimeMsg);
      $("#destination-input").attr('is-error', 'true');
      invalidInput = true;
      console.log("destination = "+destination);
    }
    if (firstArrivalObject === "Invalid date"){
      $("#first-time-input").val(invalidTimeMsg);
      $("#first-time-input").attr('is-error', 'true');
      invalidInput = true;
      console.log("firstArrivalObject = "+firstArrivalObject);
      //return;
    }
    if(!frequency.match(/^\d+$/)){
      $("#frequency-input").val(invalidTimeMsg);
      $("#frequency-input").attr('is-error', 'true');
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
      firstArrivalDB: firstArrival,
      frequencyDB: frequency
    });//database Push

   //Step7: Clear Input values after they are stored in the DB, On Button Click
   $("#name-input").val('');
   $("#destination-input").val('');
   $("#first-time-input").val('');
    

    //Step8A: Call Update Form display, On Button Click
    updateDisplay();
  });//submit-click even

  //Step8B: Call Update Form display, if the button is not clicked, to pull whatever is in db
  updateDisplay();

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
          frequency = parseInt(records.frequencyDB);

          //Step12: Assign values to Global Calculated fields
          /*****************************
          * Calculate Months Worked
          ******************************/
        var firstArrivalTimeFormat = "HH:mm:ss";
        var minSecondsFormat = "mm:ss";
        //var frequencyTimeFormat ="minutes";
        var currentTime = moment(moment(), firstArrivalTimeFormat);
        var firstArrivalTime = moment(firstArrival, firstArrivalTimeFormat);
        var diffInMinutes = currentTime.diff(firstArrivalTime, 'minutes');
        /*var frequencyTime = moment(frequency, "minutes").format('mm');*/
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

          minutesAway = moment( frequency-timeSpentInWait, "minutes").format('mm');
          
          console.log("Train is "+minutesAway+" minutes away");

          arrival = currentTime.add(minutesAway, 'minutes').format('HH:mm:ss a');
          console.log("ArrivalCALC = "+arrival);
          /******************************************************************* */         
          console.log("In database eventlistener");
          console.log("Name = "+name);
          console.log("Destination = "+destination);
          console.log("FirstArrival = "+firstArrival);
          console.log("Frequency = "+ frequency);
          
          //If time is in the past, then set displays to train not started
          /*if(minutesAway === 'Invalid date')
          {
            minutesAway = 'Not Started';
            arrival = 'Not Started';
          }*/
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
 