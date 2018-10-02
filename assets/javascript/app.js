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
  //console.log("**firstTimeError = "+$displayfirstTimeError);

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
    firstArrivalObject = moment(firstArrival, "HH:mm").format("HH:mm");/*.subtract(1, "years").format("X");*/
    frequency = $("#frequency-input").val().trim();

    //Step6 - Edge Case Error Handling: Do not except evalid date
    var invalidInput = false;
   
    if(!name){
      $("#name-error").text(invalidTimeMsg);
      $("#name-error").attr('is-error', 'true');
      invalidInput = true;
      //console.log("Name = "+name);
    }
    if(!destination){
      $("#destination-error").text(invalidTimeMsg);
      $("#destination-error").attr('is-error', 'true');
      invalidInput = true;
      //console.log("destination = "+destination);
    }
    if (firstArrivalObject === "Invalid date"){
      $("#first-time-error").text(invalidTimeMsg);
      $("#first-time-error").attr('is-error', 'true');
      invalidInput = true;
      //console.log("firstArrivalObject = "+firstArrivalObject);
      //return;
    }
    if(!frequency.match(/^\d+$/)){
      $("#frequency-error").text(invalidTimeMsg);
      $("#frequency-error").attr('is-error', 'true');
      invalidInput = true;
      //console.log("frequency = "+frequency);
    }

    if(invalidInput){
      return;
    }
    
    //console.log("Name = "+name);
    //console.log("Destination = "+destination);
    //console.log("First Arrival Time = "+firstArrival);
    //console.log("Frequency = "+frequency);

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

          //create reference to the db record's key
          var key = snapshot.ref.key

          //Step11: Pull data directly from DB, not the reinitialized Global Variables, to populate the table
          name = records.nameDB;
          destination = records.destinationDB;
          firstArrival = records.firstArrivalDB;//HH:mm
          frequency = parseInt(records.frequencyDB);//Uncessary Conversion

          var firstArrivalTimeFormat = "mm";

          //Step12: Assign values to Global Calculated fields
          /*****************************
          * Calculate Arrival Times
          ******************************/
        var currentTime = moment().format("X");//Unix Epoch
        var firstArrivalTime = moment(firstArrival, "HH:mm").format("X");//Unix Epoch

        //diffInMinutes1 Used in diffMinutes2 Calculation:
        var diffInMinutes1 = moment(((moment(currentTime, "X")).diff(moment(firstArrivalTime, "X")))).format("mm");
        var diffInMinutes2 = 60-Math.abs(diffInMinutes1);//return positive value

        var diffInHours = moment.utc(((moment(currentTime, "X")).diff(moment(firstArrivalTime, "X")))).format("HH");
        //Prevent prob when first Arrival Time is later than Current Time
        //console.log("DIFF IN HOURS = "+diffInHours+"; DIFF IN MINUTES1 = "+diffInMinutes1);
        //console.log("DIFF IN HOURS = "+diffInHours+"; DIFF IN MINUTES2 = "+diffInMinutes2);

        //Takes care of minute calculation for an abnormal train schedule when current time is before the first train time:
         if(currentTime < firstArrivalTime){
          //console.log("ABNORMAL TIME: CURRENT TIME BEFORE FIRST TIME");
          //console.log('*************');
                   
          //console.log("!!!!!Difference in Hours "+diffInHours+" in mins = "+diffInMinutes2);
          if (parseInt(diffInMinutes2) === 0)
            {
              normalizedDiffFInHours = 24-diffInHours;
            }
          else (parseInt(diffInMinutes2) > 0)
            {
              normalizedDiffFInHours = 24-diffInHours-1;
            }
          
          normalizedDiffInMinutes = normalizedDiffFInHours *60;
          //console.log("Diff in Hours1 = "+normalizedDiffFInHours);
          //console.log("Diff in Hours2 = "+normalizedDiffInMinutes);
          if(frequency < normalizedDiffInMinutes){
            //console.log("-----IN NOMALIZE")
            
            var diffInMinutes = parseInt(normalizedDiffInMinutes) + parseInt(diffInMinutes2)
            minutesAway = diffInMinutes;
            arrival = moment(firstArrivalTime, "X").format('HH:mm:ss a');
            //console.log("Normalized mins away ="+ minutesAway);
          }
          else{
              
            //Set mins to abs value of the difference between the current Time and First Arrival Time
            minutesAway = diffInMinutes2;
            //console.log("Train is "+minutesAway+" minutes away");

            //Set Arrival Time to the FirstArrival Time, since it hasn't occured yet
            arrival = moment(firstArrivalTime, "X").format('HH:mm:ss a');
            //console.log('*************');
            //console.log("Name = "+name);
            //console.log("Destination = "+destination);
            //console.log("CurrentTime = "+currentTime+"Formatted ="+moment(currentTime, "X").format('HH:mm:ss a'));
            //console.log("FirstArrival = "+firstArrival+"Formatted ="+moment(firstArrivalTime, "X").format('HH:mm:ss a'));
            //console.log("Frequency = "+ frequency);
          }//else

        }//if
        else {
          //console.log("NORMAL TIME:FIRST TIME BEFORE CURRENT TIME");
          //console.log('*************');
        /***************************************************************** */
        //Display formatted times
        /******************************************************************* */
        //console.log("CurrentTime Formatted = "+moment(currentTime, "X").format('HH:mm:ss a'));
        var currentTimeDiff = moment(currentTime, "X").format('HH:mm:ss a');
        //console.log("FirstTime Formatted = "+moment(firstArrivalTime, "X").format('HH:mm:ss a'));
        var firstArrivalTimeDiff = moment(firstArrivalTime, "X").format('HH:mm:ss a');
          //diffInHours = moment.utc(((moment(currentTimeDiff, "HH:mm:ss a")).diff(moment(firstArrivalTimeDiff, "HH:mm:ss a")))).format("HH");
        //console.log("Difference between firstArrival and current TIME in "+/* Hours "+diffInHours+";*/"Minutes = "+diffInMinutes1);
        
        /************************************************************************
         /**********************************************************************
          * Use UNIX EPOCH TIME FOR CALCULATIONS: DO NOT TOUCH THIS CODE
          **********************************************************************/
          
          /*Removed 10/01:
          var timeSpentInWait = diffInMinutes1 %  frequency;
          //console.log("Time spent in wait = "+timeSpentInWait);

          //Redundant since minutesAway is already in mins format
          //minutesAway = moment( frequency-timeSpentInWait, "minutes").format('mm'); 
          minutesAway = frequency-timeSpentInWait;
          
          //console.log("Train is "+minutesAway+" minutes away");

          arrival = moment(currentTime, "X").add(minutesAway, 'minutes').format('HH:mm:ss a');
          //console.log("ArrivalCALC = "+arrival);*/
          
          //add 10/01
          /****************************************************** */
          var firstArrivalTimeFormat = "HH:mm:ss";

        currentTime = moment();
        firstArrivalTime = moment(firstArrival, firstArrivalTimeFormat);
        diffInMinutes = currentTime.diff(firstArrivalTime, 'minutes');
        var timeSpentInWait = diffInMinutes %  frequency;

        minutesAway = frequency - timeSpentInWait;

        arrival = currentTime.add(minutesAway, 'minutes').format('HH:mm:ss a');
          /******************************************************************* */         
          //console.log("In database eventlistener");
          //console.log("Name = "+name);
          //console.log("Destination = "+destination);
          //console.log("FirstArrival = "+firstArrival);
          //console.log("Frequency = "+ frequency);
        }
          //Step13: Append data to table
          /***********************************************************************************
           *  Add key to store on edit delete buttona and first arrival
           * ********************************************************************************/
          appendTRElement(name, destination,  frequency, arrival, minutesAway, key, firstArrival);

        // Handle the errors
        }, function(errorObject) {
          //console.log("Errors handled: " + errorObject.code);
        });//db eventlisterner*/
      }//updateDisplay

      /***********************************************************************************
       *  Add key to store on edit delete buttona and first arrival
       **********************************************************************************/
      function appendTRElement(name, destination, frequency, arrival, minutesAway, key, firstArrival){
        //create table row
        $newTRElement = $('<tr>');
        $newTRElement.addClass('row m-0');

        /***************************
         Create table data for name
        ****************************/
        $newTDName = $('<td>');
        $newTDName.attr('id','name-display');
        $newTDName.addClass('d-inline-block col-2');
        $newTDName.text(name);
        //append Table Data name to Table Row
        $newTRElement.append($newTDName);

         /***************************
         Create table data for role
        ****************************/
        $newTDDestination = $('<td>');
        $newTDDestination.attr('id','destination-display');
        $newTDDestination.addClass('d-inline-block col-2');
        $newTDDestination.text(destination);
        //Append Table Data rate to Table Row
        $newTRElement.append($newTDDestination);

         /***************************
         Create table data for Start Date
        ****************************/
       $newTDFrequency = $('<td>');
       $newTDFrequency.attr('id','frequency-display');
       $newTDFrequency.addClass('d-inline-block col-2');
       $newTDFrequency.text(frequency);
       //Append Table Data rate to Table Row
       $newTRElement.append($newTDFrequency);

        /***********************************
         Create table data for Months Worked
        ************************************/
       $newTDArrival = $('<td>');
       $newTDArrival.attr('id','arrival-display');
       $newTDArrival.addClass('d-inline-block col-2');
       $newTDArrival.text(arrival);
       //Append Table Data rate to Table Row
       $newTRElement.append($newTDArrival);

        /***************************
         Create table data for rate
        ****************************/
        $newTDMinsAway = $('<td>');
        $newTDMinsAway.attr('id','minutes-away-display');
        $newTDMinsAway.addClass('d-inline-block col-2');
        $newTDMinsAway.text(minutesAway);

        //Append Table Data rate to Table Row
        $newTRElement.append($newTDMinsAway);
       
       //append Table Row to Table Body
        /***************************/
        $('#train-body').append($newTRElement);
        /****************************/

        /********************************************
         * Create and append delete and edit buttons
         ******************************************/
        var $delDiv = $('<div>');
        $delDiv.attr('id', 'del-button');
        $delDiv.addClass('d-inline-block col-1');
      
        //Fill delete button data-id attribute with the key of the record
        /***************************************************************/
          var delBtn = $("<button class='delete btn btn-primary'>");
          delBtn.attr("data-id", key);
         /**************************************************************/
       
        delBtn.text("del");
        /**************************************************************/
        $delDiv.append(delBtn);
      
      
        var $editDiv = $('<div>');
        $editDiv.attr('id', 'edit-button');
        $editDiv.addClass('d-inline-block col-1');
      
         //Fill edit button data-id attribute with the key of the record
        /***************************************************************/
        var editBtn = $("<button type='button' class='edit btn btn-primary' data-toggle='modal' data-target='#exampleModal'>");
        editBtn.attr("data-id", key);
        /**************************************************************/
        editBtn.attr("data-name", name);
        editBtn.attr("data-destination", destination);
        editBtn.attr("data-frequency", frequency);
        editBtn.attr("data-firstarrival", firstArrival);
        editBtn.text("edit");
        /**************************************************************/
        $editDiv.append(editBtn);
      
        //$newTRElement.append($newTDMinsAway, delBtn, editBtn);
        $newTRElement.append($newTDMinsAway, $delDiv, $editDiv);
        $('#train-body').append($newTRElement);
      }//AppendElement

      /**************************************************************
 * Get update values from edit button attributes
 * ***********************************************************/
$('#exampleModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);
  var id = button.attr('data-id');
  var name = button.attr('data-name');
  var destination = button.attr('data-destination');
  var frequency = button.attr('data-frequency');
  var firstArrival = button.attr('data-firstarrival');

  var modal = $("#exampleModal");
  modal.find('.modal-title').text('Please edit the train properties here').attr("data-id", id);
  modal.find('.modal-title').text('Please edit the train properties here');
  modal.find('.modal-body input[id="editName"]').val(name);
  modal.find('.modal-body #editDestination').val(destination);
  modal.find('.modal-body #editFirstTrain').val(firstArrival);
  modal.find('.modal-body #editFreq').val(frequency);
})
/*************************************************************/

/**************************************************************
 * Remove item based on delete button data-id 
 ************************************************************/ 
$(document).on("click", ".delete", function () {
  var id = $(this).attr("data-id");
  //console.log(id);
  database.ref(id).remove();
  updateDisplay();
});
/************************************************************/ 

/**************************************************************
 * Update the fields in the database based on id, when the edit button is clicked
 ***************************************************************/
$("#submitEdit").on("click", function () {
  var modal = $("#exampleModal");
  var id = modal.find('.modal-title').attr("data-id");
  var newName = modal.find('.modal-body input[id="editName"]').val();
  var newDestination = modal.find('.modal-body #editDestination').val();
  var newFirstArrival = modal.find('.modal-body #editFirstTrain').val();
  var newFrequency = modal.find('.modal-body #editFreq').val();
  database.ref(id).update({
    nameDB: newName,
    destinationDB: newDestination,
    firstArrivalDB: newFirstArrival,
    frequencyDB: newFrequency
  });
  modal.modal('hide');
  updateDisplay();
});
/**************************************************************/

      //Step8B: Call Update Form display, if the button is not clicked, to pull whatever is in db
      updateDisplay();
 