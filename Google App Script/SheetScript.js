// spreadSheet object stores the reference to the spreadsheet we want to use... link needs to change for every new deployment
var spreadSheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1Wf_mRl3d4GQ00PSEI8rqJ8J8NHlPo1eFFXxJTkLuO8g/edit#gid=893931470");

// The spreadsheet needs to contain the the following sheets:-
// Questions -> Contains everything related to questions
// Keys -> Contains the valid keys which can access the spreadsheet
var questionSheet = spreadSheet.getSheetByName("Questions");
var keySheet = spreadSheet.getSheetByName("Keys");

// init GaExpress
var app = new Gexpress.App();

/**
 * Verify that the key given for a user is valid
 * 
 * @param {String} key - The key to verify
 * @param {String} userType - Type of user
 * @returns {Boolean} True if the key is valid else False
 */
function verifyKey(key, userType) {
    let rows = keySheet.getRange(1, 1, keySheet.getLastRow(), keySheet.getLastColumn()).getValues();
    let isValid = false;

    // Starting from 1 since 0 is headers
    for (let i = 1; i < rows.length; i++) {
        let currentRow = rows[i];

        // If the key and usertype matches to the given row, the key is valid
        if (key == currentRow[0] && currentRow[1] == userType) {
            isValid = true;
            break;
        }
    }
    return isValid;
}

/**
 * Checks if the key given is a valid for students
 * 
 * @param {String} key Key to validate
 * @returns {Boolean} True if its valid else False
 */
function isStudent(key) {
    return verifyKey(key, "STUDENT");
}

/**
 * Checks if the key given is a valid for students
 * 
 * @param {String} key Key to validate
 * @returns {Boolean} True if its valid else False
 */
function isAdmin(key) {
    return verifyKey(key, "ADMIN");
}

/**
 * Adds an answer for a given question ID into the Google SpreadSheet
 * 
 * @param {String} questionId Question id
 * @param {String} answer Answer for the question
 */
function addAnswer(questionId, answer) {
    let rows = questionSheet.getRange(1, 1, questionSheet.getLastRow(), questionSheet.getLastColumn()).getValues();
    let anwerIndex = rows[0].indexOf("Answer");
    let idIndex = rows[0].indexOf("Id");

    // find the row index
    for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
        let id = rows[rowIndex][idIndex];
        if (questionId == id) {

            // adding 1 to the indexes since range starts from 1 while arrays starts
            // from 0
            questionSheet.getRange((rowIndex + 1), (anwerIndex + 1)).setValue(answer);
            break;
        }
    }
}

/**
 * Generates a "unique" ID for questions
 * 
 * @returns {Number}  Unique ID which is basically number of milliseconds between midnight, 
* January 1, 1970 Universal Coordinated Time (UTC)
 */
function generateId() {
    return Date.now();
}

/**
 * Checks if a given questions is already in the SpreadSheet
 * 
 * @param {String} questionId Id of the question
 * @returns {Boolean} True if questions is in SpreadSheet else False
 */
function isQuestionAvailable(questionId) {
    let isAvailable = false;

    let data = [];
    let rows = questionSheet.getRange(2, 1, questionSheet.getLastRow() - 1, questionSheet.getLastColumn()).getValues();

    for (let i = 0; i < rows.length; i++) {
        let currentQuestionId = rows[i][0];
        if (questionId == currentQuestionId) {
            isAvailable = true;
            break;
        }
    }

    return isAvailable;
}

/**
 * Handles request to get all questions from the SpreadSheet
 */
app.post("/get-all-questions", function (request, response, next) {
    let key = request.query.key;
    let resp = null;

    // check if the key parameter is empty
    if (!key) {
        resp = {
            status: 400,
            message: "Missing key"
        };
    // Check if the does not belong to either the student of admin
    } else if (!isStudent(key) && !isAdmin(key)) {
        resp = {
            status: 400,
            message: "Invalid key"
        };
    // Key is valid for the given user... 
    } else {
        let data = [];

        let rows = questionSheet.getRange(1, 1, questionSheet.getLastRow(), questionSheet.getLastColumn()).getValues();

        // Starting the iteration at 1 since 0th row is the headers row
        for (let i = 1; i < rows.length; i++) {
            let currentRow = rows[i];
            data.push({
                id: currentRow[0],
                week: currentRow[1],
                question: currentRow[2],
                selectedText: currentRow[3],
                slideLink: currentRow[4],
                answer: currentRow[5]
            });
        }

        resp = (data.length > 0) ? data : { status: 404, message: "No Questions Available" };
    }

    response.set("content-type", "application/json");
    response.send(JSON.stringify(resp));
    response.end();
}, true);

/**
 * Handles request to add questions to the SpreadWSheet
 */
app.post("/add-question", function (request, response, next) {
    let userKey = request.query.key;

    let question = request.query.question;
    let selectedText = request.query.selectedText;
    let slideLink = request.query.slideLink;
    let weekTitle = request.query.week;

    // Default values will be added since its a new question
    let answer = "";
    let id = generateId();

    let resp = null;

    if (!userKey) {
        resp = {
            status: 400,
            message: "Missing Key"
        }
    } else if (!isStudent(userKey) && !isAdmin(userKey)) {
        resp = {
            status: 400,
            message: "Invalid key"
        };
    // Check if any of the required parameters is missing
    } else if (!question || !selectedText || !slideLink || !weekTitle) {
        resp = {
            status: 400,
            message: "Missing values for adding question"
        };
    } else {
        questionSheet.appendRow([id, weekTitle, question, selectedText, slideLink, answer]);
        resp = {
            status: 200,
            message: "Question added!"
        }
    }

    response.set("content-type", "application/json");
    response.send(JSON.stringify(resp));
    response.end();
}, true);

/**
 * Handles requests to add an answer to a given question
 */
app.post("/add-answer", function (request, response, next) {
    let adminKey = request.query.key;
    let id = request.query.id;
    let answer = request.query.answer;

    let resp = null;

    if (!adminKey) {
        resp = {
            status: 400,
            message: "Missing Key"
        }
    } else if (!isAdmin(adminKey)) {
        resp = {
            status: 400,
            message: "Invalid key"
        };
    } else if (!id || !answer) {
        resp = {
            status: 400,
            message: "Missing values for adding question"
        };
    } else if (!isQuestionAvailable(id)) {
        resp = {
            status: 404,
            message: "Unable to find question id"
        };
    } else {
        addAnswer(id, answer);
        resp = {
            status: 200,
            message: "Answer added"
        };
    }

    response.set("content-type", "application/json");
    response.send(JSON.stringify(resp));
    response.end();
}, true);

/**
 * Handles request to verify users identity
 */
app.post("/verify-user-type", function (request, response, next) {
    let key = request.query.key;
    let resp = null;

    if (!key) {
        resp = {
            status: 400,
            message: "Missing Key"
        };
    } else if (isAdmin(key)) {
        resp = {
            status: 200,
            message: "admin"
        };
    } else if (isStudent(key)) {
        resp = {
            status: 200,
            message: "student"
        };
    } else {
        resp = {
            status: 400,
            message: "Invalid key"
        };
    }

    response.set("content-type", "application/json");
    response.send(JSON.stringify(resp));
    response.end();
}, true);

// this hooks Gexpress into appscript 
function doGet(e) { return app.doGet(e) }
function doPost(e) { return app.doPost(e) }