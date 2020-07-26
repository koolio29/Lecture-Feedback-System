// URL to Google App Script.. needs to be updated for new server script 
const URL = "URL_TO_GOOGLE_APP_SCRIPT_FILE";

// Holds the ID of the questions to answer globally
var post = {
    id: "",
};

/**
 * Gets the value of the cookie
 * 
 * @param {String} cookieName Name of the cookie
 * @returns {String} The value of the cookie. If not set then null
 */
function readCookie(cookieName) {
    let cookieValue = null;
    let allValues = document.cookie.split(";");
    for (let i = 0; i < allValues.length; i++) {
        let currentValue = allValues[i].trim();
        if (currentValue.startsWith(cookieName)) {
            cookieValue = currentValue.split("=")[1];
            break;
        }
    }
    return cookieValue;
}

/**
 * Sets a new cookie
 * 
 * @param {String} cookieName Name of the cookie
 * @param {String} value The value of the cookie
 * @param {Number} expiryDate Number of days to wait before cookie is expired
 */
function writeCookie(cookieName, value, expiryDate) {
    let expire = "";
    if (expiryDate != null) {
        let date = new Date();
        date.setTime(date.getTime() + (expiryDate * 24 * 60 * 1000));
        expire = date.toGMTString();
    }
    document.cookie = `${cookieName}=${value}; expires=${expire}; path=/`;
}

/**
 * Deletes a cookie
 * 
 * @param {String} cookieName Name of the cookie
 */
function removeCookie(cookieName) {
    writeCookie(cookieName, "", -1);
}

/**
 * Group questions posted by their "week"
 * 
 * @param {JSON array} data A JSON array containing all the questions posted
 * @returns {JSON Object} A JSON object containing arrays of questions
 */
function groupQuestionsByWeek(data) {
    let weeks = [];
    let questionsGroups = {};

    // Get all the weeks or presentation name
    for (let i = 0; i < data.length; i++) {
        if (weeks.indexOf(data[i].week) == -1) {
            weeks.push(data[i].week);
        }
    }

    // Create empty arrays for each week or presentation
    for (let i = 0; i < weeks.length; i++) {
        questionsGroups[weeks[i]] = [];
    }

    // Add the questions to the JSON object
    for (let i = 0; i < data.length; i++) {
        questionsGroups[data[i].week].push(data[i]);
    }

    return questionsGroups;
}

/**
 * Displays the questions posted by the student.
 * 
 * @param {JSON Arrau} questions A JSON object containing arrays of questions
 */
function addQuestionsToPage(questions) {
    let groups = Object.keys(questions);

    for (let i = 0; i < groups.length; i++) {
        let groupId = groups[i].replace(" ", "-");
        $(".container").append(`
        <section id="${groupId}-section">
            <h1>${groups[i]}</h1>
        </section>`);

        for (let j = 0; j < questions[groups[i]].length; j++) {
            let current = questions[groups[i]][j];

            $(`#${groupId}-section`).append(`
            <div class="row">
                <div class="col s12">
                    <div class="card-panel white darken-3 black-text">
                        <h5 class="card-title" id="${current.id}-q">${current.question}</h5>
                        <div class="card-content">
                            <b>Highlighted Text:</b>
                            <blockquote>
                                ${current.selectedText}
                            </blockquote>
                            <h5>Answer:</h5>
                            <p>${(current.answer.length > 0) ? current.answer : "No Answer Yet!"}</p>
                        </div>
                        <div class="card-action" id="${current.id}-action">
                            <a href="${current.slideLink}"class="teal darken-3 waves-effect waves-light btn">View in Context</a>
                        </div>
                    </div>
                </div>
            </div>
            `);

            // If an admin is accessing the page then show the Answer Question/Update Answer button
            if (readCookie("user-type") != "student") {
                let btnText = (current.answer.length > 0) ? "Update Answer" : "Answer Question";
                $(`#${current.id}-action`).append(`<a id="${current.id}" class="answer-btn teal darken-3 waves-effect waves-light btn">${btnText}</a>`);
            }
        }
    }

    // Event handler deals with posting the answer to the questions
    $(".answer-btn").click(function (event) {
        post.id = this.id;
        $("#question-placeholder").append($(`#${post.id}-q`)[0].innerHTML);
        $("#answer-modal").modal("open");
    });
}

/**
 * Make the AJAX request to get all the questions from the "database"
 */
function populateQuestions() {
    $(".progress").css("display", "block");
    $.ajax({
        method: "POST",
        data: {
            key: readCookie("key"),
        },
        url: URL + "?path=/get-all-questions",
        success: function (response) {
            $(".container").empty();
            $(".progress").css("display", "none");

            if (response.status == 400) {
                $(".container").append(`<h2><i class="left red-text medium material-icons">lock</i>Missing Key</h2>`);
            } else if (response.status == 404) {
                $(".container").append(`<h2><i class="left red-text medium material-icons">error</i>No Questions Available</h2>`);
            } else {
                // We got questions !!
                let allQuestions = groupQuestionsByWeek(response);
                addQuestionsToPage(allQuestions);
            }
        }
    });
}

/**
 * Makes an AJAX request to authenticate the users key
 * @param {String} key Key to verify
 */
function sendAuthenticationRequest(key) {
    $(".progress").css("display", "block");
    $.ajax({
        method: "POST",
        data: {
            key: key
        },
        url: URL + "?path=/verify-user-type",
        success: function (response) {
            $(".progress").css("display", "none");
            if (response.status == 200) {
                // valid key is used.. whether its an admin or student
                writeCookie("key", key);
                writeCookie("user-type", response.message);
                $("#key-modal").modal("close");

                populateQuestions();
            } else {
                M.toast({
                    html: `${response.message}`,
                    displayLength: 2500
                });
            }
        }
    });
}


$(document).ready(function () {
    // initialize key-modal
    $("#key-modal").modal({
        dismissible: false,
        onCloseEnd: function () {
            $("#key-textfield").val("");
        },
        endingTop: "29%"
    });

    $("#key-btn").click(function () {
        let keyString = $("#key-textfield").val();

        if (keyString.length > 0) {
            console.log(keyString)
            sendAuthenticationRequest(keyString);
        } else {
            M.toast({
                html: 'Key field is empty :)',
                displayLength: 2500
            });
        }
    });

    $("#answer-modal").modal({
        endingTop: "29%",
        onCloseEnd: function () {
            $("#question-placeholder").empty();
            $("#answer-text").val("");
        }
    });

    $("#post-ans-btn").click(function () {
        let answerString = $("#answer-text").val();
        if (answerString.length > 0) {
            $("#answer-progress").css("display", "block");
            $.ajax({
                method: "POST",
                data: {
                    key: readCookie("key"),
                    answer: answerString,
                    id: post.id,

                },
                url: URL + "?path=/add-answer",
                success: function (response) {
                    $("#answer-progress").css("display", "none");
                    if (response.status == 200) {
                        post.id = null;
                        $("#answer-modal").modal("close");
                        populateQuestions();
                        M.toast({
                            html: `Answer posted`,
                            displayLength: 2500
                        });
                    } else {
                        M.toast({
                            html: `${response.message}`,
                            displayLength: 2500
                        });
                    }
                }
            })
        } else {
            M.toast({
                html: 'Answer field is empty :)',
                displayLength: 2500
            });
        }
    });

    $("#remove-key-btn").click(function () {
        if (readCookie("key") != null) {
            removeCookie("key");
            removeCookie("user-type")
            $("#key-modal").modal("open");
        }
    });

    // Check if key is present in the cookie
    if (readCookie("key") == null) {
        $("#key-modal").modal("open");
    } else {
        populateQuestions();
    }
});