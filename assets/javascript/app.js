/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-lone-blocks */
/* eslint-disable prefer-destructuring */
/* eslint-disable object-shorthand */
/* eslint-disable no-use-before-define */
/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable no-undef */

// Step1:  Initialize Firebase
const config = {
  apiKey: 'AIzaSyCTIyGUugG4jiQbn2ZoeFjqF3LcEggdWDQ',
  authDomain: 'train-schedule-6c69a.firebaseapp.com',
  databaseURL: 'https://train-schedule-6c69a.firebaseio.com',
  projectId: 'train-schedule-6c69a',
  storageBucket: 'train-schedule-6c69a.appspot.com',
  messagingSenderId: '289907468689',
};
firebase.initializeApp(config);

// Step2: Create a variable to reference the database
const database = firebase.database();

// Step3: Set Global Variables Initial Values
let name = '';
let destination = '';
let firstArrival = 0;
let frequency = 0;

// Timer variables
let updateTimerId;
let updateTimerRunning = false;

// Step4: Set Global Calculated Variables
let arrival = 0;
let minutesAway = 0;
const invalidTimeMsg = 'Please enter a valid value.';
let $displayfirstTimeError = $('#first-time-input').attr('is-error');
let displayUpdateTimer = {
  timeLimit: 60, // 60s equal 1 min
  stop: function () {
    // DONE: Use clearInterval to stop the count here and set the clock to not be running.
    clearInterval(updateTimerId);
    updateTimerRunning = false;
  },
  start: function () {
    if (!updateTimerRunning) {
      updateTimerId = setInterval(updateDisplay, 1000 * displayUpdateTimer.timeLimit);
      updateTimerRunning = true;
    } // if
  },
};

// Start timer for DB updates
displayUpdateTimer.start();

// Step5: Capture Button Click and store Input into DB
$('#submit-train').on('click', (event) => {
  // Don't refresh the page!
  event.preventDefault();

  name = $('#name-input').val().trim();
  destination = $('#destination-input').val().trim();
  firstArrival = $('#first-time-input').val().trim();

  // Set format to Unix Epoch, subtract a year from the firstArrival
  // time, so the first train time is never after the current time.
  firstArrivalObject = moment(firstArrival, 'HH:mm').format('HH:mm');
  frequency = $('#frequency-input').val().trim();

  // Step6 - Edge Case Error Handling: Do not except evalid date
  let invalidInput = false;

  if (!name) {
    $('#name-error').text(invalidTimeMsg);
    $('#name-error').attr('is-error', 'true');
    invalidInput = true;
  }
  if (!destination) {
    $('#destination-error').text(invalidTimeMsg);
    $('#destination-error').attr('is-error', 'true');
    invalidInput = true;
  }
  if (firstArrivalObject === 'Invalid date') {
    $('#first-time-error').text(invalidTimeMsg);
    $('#first-time-error').attr('is-error', 'true');
    invalidInput = true;
  }
  if (!frequency.match(/^\d+$/)) {
    $('#frequency-error').text(invalidTimeMsg);
    $('#frequency-error').attr('is-error', 'true');
    invalidInput = true;
  }

  if (invalidInput) {
    return;
  }

  database.ref().push({
    nameDB: name,
    destinationDB: destination,
    firstArrivalDB: firstArrivalObject,
    frequencyDB: frequency,
  }); // database Push

  // Step7: Clear Input values after they are stored in the DB, On Button Click
  $('#name-error').empty();
  $('#name-input').val('');
  $('#destination-error').empty();
  $('#destination-input').val('');
  $('#first-time-error').empty();
  $('#first-time-input').val('');
  $('#frequency-error').empty();
  $('#frequency-input').val('');

  // Step8A: Call Update Form display, On Button Click
  updateDisplay();
}); // submit-click even

function updateDisplay() {
  // Step9: Empty out all the Table elements before appending new data
  $('#train-body').empty();

  // Step10: Take a snapshot and save db values to global variables to be displayed on DB update
  database.ref().on('child_added', (snapshot) => {
    let records = snapshot.val();

    // create reference to the db record's key
    let key = snapshot.ref.key;

    // Step11: Pull data directly from DB, not the reinitialized
    // Global Variables, to populate the table
    name = records.nameDB;
    destination = records.destinationDB;
    firstArrival = records.firstArrivalDB; // HH:mm
    frequency = parseInt(records.frequencyDB, 10); // Uncessary Conversion

    let firstArrivalTimeFormat = 'mm';

    // Step12: Assign values to Global Calculated fields
    // *****************************
    // * Calculate Arrival Times
    // ******************************
    let currentTime = moment().format('X'); // Unix Epoch
    let firstArrivalTime = moment(firstArrival, 'HH:mm').format('X'); // Unix Epoch

    // diffInMinutes1 Used in diffMinutes2 Calculation:
    let diffInMinutes1 = moment(((moment(currentTime, 'X')).diff(moment(firstArrivalTime, 'X')))).format('mm');
    let diffInMinutes2 = 60 - Math.abs(diffInMinutes1); // return positive value

    let diffInHours = moment.utc(((moment(currentTime, 'X')).diff(moment(firstArrivalTime, 'X')))).format('HH');
    // Prevent prob when first Arrival Time is later than Current Time

    // Takes care of minute calculation for an abnormal train schedule
    // when current time is before the first train time:
    if (currentTime < firstArrivalTime) {
      if (parseInt(diffInMinutes2, 10) === 0) {
        normalizedDiffFInHours = 24 - diffInHours;
      } else (parseInt(diffInMinutes2, 10) > 0);
      {
        normalizedDiffFInHours = 24 - diffInHours - 1;
      }

      normalizedDiffInMinutes = normalizedDiffFInHours * 60;
      if (frequency < normalizedDiffInMinutes) {
        let diffInMinutes = parseInt(normalizedDiffInMinutes, 10) + parseInt(diffInMinutes2, 10);
        minutesAway = diffInMinutes;
        arrival = moment(firstArrivalTime, 'X').format('HH:mm:ss a');
      } else {
        // Set mins to abs value of the difference between
        // the current Time and First Arrival Time
        minutesAway = diffInMinutes2;

        // Set Arrival Time to the FirstArrival Time, since it hasn't occured yet
        arrival = moment(firstArrivalTime, 'X').format('HH:mm:ss a');
      } // else
    } else {
      // *****************************************************************
      // Display formatted times
      // *******************************************************************
      let currentTimeDiff = moment(currentTime, 'X').format('HH:mm:ss a');
      let firstArrivalTimeDiff = moment(firstArrivalTime, 'X').format('HH:mm:ss a');
      // *********************************************************************
      // ********************************************************************
      // * Use UNIX EPOCH TIME FOR CALCULATIONS: DO NOT TOUCH THIS CODE
      // ********************************************************************
      let firstArrivalTimeFormat = 'HH:mm:ss';

      currentTime = moment();
      firstArrivalTime = moment(firstArrival, firstArrivalTimeFormat);
      diffInMinutes = currentTime.diff(firstArrivalTime, 'minutes');
      let timeSpentInWait = diffInMinutes % frequency;

      minutesAway = frequency - timeSpentInWait;
      arrival = currentTime.add(minutesAway, 'minutes').format('HH:mm:ss a');
      // *******************************************************************
    }
    // Step13: Append data to table
    // ************************************************************************
    // *  Add key to store on edit delete buttona and first arrival
    // ************************************************************************
    appendTRElement(name, destination, frequency, arrival, minutesAway, key, firstArrival);

    // Handle the errors
  }, function (errorObject) {
    // console.log("Errors handled: " + errorObject.code);
  }); // db eventlisterner
} // updateDisplay

// ***********************************************************************************
// *  Add key to store on edit delete buttona and first arrival
// ***********************************************************************************
function appendTRElement(name,
  destination,
  frequency,
  arrival,
  minutesAway,
  key,
  firstArrival) {
  // create table row
  $newTRElement = $('<tr>');
  $newTRElement.addClass('row m-0');

  // ***************************
  // *Create table data for name
  // ****************************
  $newTDName = $('<td>');
  $newTDName.attr('id', 'name-display');
  $newTDName.addClass('d-inline-block col-2');
  $newTDName.text(name);

  // append Table Data name to Table Row
  $newTRElement.append($newTDName);

  // ***************************
  // *Create table data for role
  // ***************************
  $newTDDestination = $('<td>');
  $newTDDestination.attr('id', 'destination-display');
  $newTDDestination.addClass('d-inline-block col-2');
  $newTDDestination.text(destination);

  // Append Table Data rate to Table Row
  $newTRElement.append($newTDDestination);

  // *********************************
  // * Create table data for Start Date
  // **********************************
  $newTDFrequency = $('<td>');
  $newTDFrequency.attr('id', 'frequency-display');
  $newTDFrequency.addClass('d-inline-block col-2');
  $newTDFrequency.text(frequency);
  // Append Table Data rate to Table Row
  $newTRElement.append($newTDFrequency);

  // ************************************
  // *Create table data for Months Worked
  // *************************************
  $newTDArrival = $('<td>');
  $newTDArrival.attr('id', 'arrival-display');
  $newTDArrival.addClass('d-inline-block col-2');
  $newTDArrival.text(arrival);
  // Append Table Data rate to Table Row
  $newTRElement.append($newTDArrival);

  // ****************************
  // *Create table data for rate
  // *****************************
  $newTDMinsAway = $('<td>');
  $newTDMinsAway.attr('id', 'minutes-away-display');
  $newTDMinsAway.addClass('d-inline-block col-2');
  $newTDMinsAway.text(minutesAway);

  // Append Table Data rate to Table Row
  $newTRElement.append($newTDMinsAway);

  // append Table Row to Table Body
  // ************************************
  $('#train-body').append($newTRElement);
  // ************************************

  // ********************************************
  // * Create and append delete and edit buttons
  // ********************************************
  let $delDiv = $('<div>');
  $delDiv.attr('id', 'del-button');
  $delDiv.addClass('d-inline-block col-1');

  // Fill delete button data-id attribute with the key of the record
  // ***************************************************************
  let delBtn = $("<button class='delete btn btn-primary'>");
  delBtn.attr('data-id', key);
  // ***************************************************************

  delBtn.text('del');
  // ***************************************************************
  $delDiv.append(delBtn);
  let $editDiv = $('<div>');
  $editDiv.attr('id', 'edit-button');
  $editDiv.addClass('d-inline-block col-1');

  // Fill edit button data-id attribute with the key of the record
  // ***************************************************************
  let editBtn = $("<button type='button'class='edit btn btn-primary' data-toggle='modal' data-target='#exampleModal'>");
  editBtn.attr('data-id', key);
  // ***************************************************************
  editBtn.attr('data-name', name);
  editBtn.attr('data-destination', destination);
  editBtn.attr('data-frequency', frequency);
  editBtn.attr('data-firstarrival', firstArrival);
  editBtn.text('edit');
  // ***************************************************************
  $editDiv.append(editBtn);

  // $newTRElement.append($newTDMinsAway, delBtn, editBtn);
  $newTRElement.append($newTDMinsAway, $delDiv, $editDiv);
  $('#train-body').append($newTRElement);
} // AppendElement

// ************************************************************
// * Get update values from edit button attributes
// ************************************************************/
$('#exampleModal').on('show.bs.modal', function (event) {
  let button = $(event.relatedTarget);
  let id = button.attr('data-id');
  let name = button.attr('data-name');
  let destination = button.attr('data-destination');
  let frequency = button.attr('data-frequency');
  let firstArrival = button.attr('data-firstarrival');

  let modal = $('#exampleModal');
  modal.find('.modal-title').text('Please edit the train properties here').attr('data-id', id);
  modal.find('.modal-title').text('Please edit the train properties here');
  modal.find('.modal-body input[id="editName"]').val(name);
  modal.find('.modal-body #editDestination').val(destination);
  modal.find('.modal-body #editFirstTrain').val(firstArrival);
  modal.find('.modal-body #editFreq').val(frequency);
});
// *************************************************************

// *************************************************************
// * Remove item based on delete button data-id
// *************************************************************
$(document).on('click', '.delete', function () {
  let id = $(this).attr('data-id');
  // console.log(id);
  database.ref(id).remove();
  updateDisplay();
});
// ************************************************************

// **************************************************************
// * Update the fields in the database based on id, when the edit button is clicked
// ***************************************************************
$('#submitEdit').on('click', function () {
  let modal = $('#exampleModal');
  let id = modal.find('.modal-title').attr('data-id');
  let newName = modal.find('.modal-body input[id="editName"]').val();
  let newDestination = modal.find('.modal-body #editDestination').val();
  let newFirstArrival = modal.find('.modal-body #editFirstTrain').val();
  let newFrequency = modal.find('.modal-body #editFreq').val();
  database.ref(id).update({
    nameDB: newName,
    destinationDB: newDestination,
    firstArrivalDB: newFirstArrival,
    frequencyDB: newFrequency,
  });
  modal.modal('hide');
  updateDisplay();
});
// **************************************************************

// Step8B: Call Update Form display, if the button is not clicked, to pull whatever is in db
updateDisplay();
