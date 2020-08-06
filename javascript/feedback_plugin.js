// This is needed since for some reason selected text does not get updated
// after the first selection within the event handler... can be fixed.. but this
// is a good enough solution for now
var globalQuestion = {
    selectedText: "",
}

/**
 * Escapes special characters from inner HTML
 * 
 * @param {String} text HTML text
 * @returns {String} Text which has all the html tags escaped
 */
function escapeTags(text) {
    let tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };

    let replaceTag = function (tag) {
        return tagsToReplace[tag] || tag;
    };

    return text.replace(/[&<>]/g, replaceTag);
}

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
function deleteCookie(cookieName) {
    writeCookie(cookieName, "", -1);
}


/**
 * Shows a toast notification for the user
 * 
 * @param {String} text Text to show
 * @param {String} toastType Type of toast
 */
function showToast(text, toastType) {
    const toastId = "toast";

    if (!$(`#${toastId}`)[0]) {
        $("body").append(`
            <div id="toast"></div> 
            <style>
                #toast {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translate(-50%);
                    background-color: #42AD64;
                    color: white;
                    padding: 16px;
                    border-radius: 4px;
                    text-align: center;
                    z-index: 1000;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
                    visibility: hidden;
                    opacity: 0;
                }
                #toast.show {
                    visibility: visible;
                    animation: fadeInOut 3s;
                }
                @keyframes fadeInOut {
                    5%,
                    95% {
                        opacity: 1;
                        bottom: 50px
                    }
                    15%,
                    85% {
                        opacity: 1;
                        bottom: 30px
                    }
                }
            </style>
        `);
    }

    $(`#${toastId}`).css("background-color", (toastType === "ok") ? "#42AD64" : "#FA002E");
    $(`#${toastId}`).text(text);
    $(`#${toastId}`).addClass("show");

    setTimeout(() => {
        $(`#${toastId}`).removeClass("show");
    }, 3000);
}

/**
 * Gets the current slide link. This is to avoid having the user to manually go
 * through the slides to fully load them up
 */
function getCurrentSlideLink() {
    return window.location.href;
}

/**
 * Shows the question box which allows the user to type in their questions
 * 
 * @param {String} selectedText Shows the selected text from the slides, if any was selected
 * @param {String} currentSlideLink Link to the current slide
 * @param {String} url URL to which to make the database call to add the question
 */
function showQuestionBox(selectedText, currentSlideLink, url) {
    const dialogId = "question-modal";
    // If the question dialog is added to page, then add it
    if (!$(`#${dialogId}`)[0]) {
        $("body").append(`
        <div class="modal" id="${dialogId}">
            <div class="modal-header">
                <div class="title">
                    <h1>Have a Question?</h1>
                </div>
            </div>
            <div class="modal-content">
                <p style="font-size: 1.1em;">
                    You can view the questions for the current presentation by checking the side menu</a>
                </p>
                <h2>Your selected text</h2>
                <blockquote id="highlighted-text-place">
                    <p>${escapeTags(selectedText)}</p>
                </blockquote>

                <div class="question-container">
                    <textarea style="resize: none;" rows="5" cols="66" placeholder="My Question is..."
                        id="question-text"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button id="key-btn">CLEAR KEY</button>
                <button id="ask-btn">ASK QUESTION</button>
            </div>
        </div>
        <div id="overlay"></div>
        <style>
            .modal div h1 {
                display: block !important;
                font-size: 2em !important;
                margin-top: 0.67em !important;
                margin-bottom: 0.67em !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                font-weight: bold !important;
            }

            .modal h2 {
                display: block !important;
                font-size: 1.5em !important;
                margin-top: 0.83em !important;
                margin-bottom: 0.83em !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                font-weight: bold !important;
            }

            .modal div {
                display: block !important;
            }

            .modal p {
                display: block !important;
                margin-top: 1em !important;
                margin-bottom: 1em !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }

            .modal blockquote {
                display: block !important;
                margin-top: 1em !important;
                margin-bottom: 1em !important;
                margin-left: 40px !important;
                margin-right: 40px !important;
            }

            .modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                transition: 200ms ease-in-out;
                border: 1px solid black;
                border-radius: 10px;
                z-index: 10;
                background-color: white;
                width: 800px;
                max-width: 80%;
                max-height: 100%;
                overflow: auto;
            }

            .modal.active {
                transform: translate(-50%, -50%) scale(1);
            }

            .modal-header {
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid black;
            }

            .modal-content {
                padding: 20px 15px;
            }

            .modal-footer {
                padding-left: 15px;
                padding-right: 15px;
                padding-top: 0px;
                padding-bottom: 20px;
                overflow: auto;
            }

            .key-container {
                margin-top: 10px;
            }

            .question-container {
                width: 100%;
            }

            #question-text {
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                font-size: 1.15em;
            }

            #key-textfield {
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                font-size: 1em;
            }

            #key-textfield {
                padding: 5px;
            }

            #highlighted-text-place {
                border-left: 5px solid #FFBABF;
                padding-left: 10px;
                text-align: justify;
            }

            #overlay {
                position: fixed !important;
                opacity: 0 !important;
                top: 0 !important;
                left: 0 !important;
                bottom: 0 !important;
                right: 0 !important;
                z-index: 9 !important;
                background-color: rgba(0, 0, 0, 0.5) !important;
                pointer-events: none !important;
            }

            #overlay.active {
                pointer-events: all !important;
                opacity: 1 !important;
            }

            #key-btn,
            #ask-btn {
                float: right;
                padding: 9px;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.3);
            }

            #ask-btn {
                background-color: green;
                color: white;
                margin-right: 7px;
            }

            #ask-btn:hover {
                background-color: darkgreen;
            }

            #key-btn {
                background-color: #FA002E;
                color: white;
            }

            #key-btn:hover {
                background-color: #AD0020;
            }
        `);

        // Checking if a key is already present. If not then ask for the key
        if (readCookie("key") == null) {
            $(`#${dialogId} .modal-content`).append(`
            <div class="key-container">
                <input placeholder="Class Key" id="key-textfield" type="password">
            </div>
            `);
        }

        $("#ask-btn").click(() => {
            let questionString = $("#question-text").val();
            let keyString = (readCookie("key") != null) ? readCookie("key") : $("#key-textfield").val();

            if (questionString.length <= 0 || keyString.length <= 0) {
                showToast("Missing fields", "error");
            } else {
                let currentTitle = document.querySelector("title").innerText;
                postQuestion(globalQuestion.selectedText, getCurrentSlideLink(), currentTitle, questionString, keyString, url);
            }
        });

        $("#key-btn").click(() => {
            if (readCookie("key") != null) {
                deleteCookie("key");
                $(`#${dialogId} .modal-content`).append(`
                <div class="key-container">
                    <input placeholder="Class Key" id="key-textfield" type="password">
                </div>
                `);
            } else {
                showToast("Key already deleted!", "error");
            }
        });
    } else {
        if (readCookie("key") != null) {
            $(".key-container").remove();
        } else if (!$(".key-container")[0]) {
            $(`#${dialogId} .modal-content`).append(`
            <div class="key-container">
                <input placeholder="Class Key" id="key-textfield" type="password">
            </div>
            `);
        }
        // Dialog already added. Simply change the selected text
        $("#highlighted-text-place").empty();
        $("#highlighted-text-place").append(escapeTags(selectedText));
    }

    $("#overlay").click(() => {
        $(`#${dialogId}`).removeClass("active");
        $("#question-text").val("");
        $("#key-textfield").val("");
        $("#overlay").removeClass("active");
    });

    // Show modal now
    $(`#${dialogId}`).addClass("active");
    $("#overlay").addClass("active");
}

/**
 * Adds the questions to the side menu of the presentation
 *  
 * @param {Array} questions An array questions objects
 */
function addQuestionsToPage(questions) {
    $(".custom-menu-container").empty();
    for (let i = 0; i < questions.length; i++) {
        $(".custom-menu-container").append(`
            <div class="card">
                <div class="card-header">
                    <h1>${questions[i].question}</h1>
                    <hr>
                </div>
                <div class="card-content">
                    <h3>Selected Text</h3>
                    <blockquote class="highlighted-text">
                    ${escapeTags(questions[i].selectedText)}
                    </blockquote>
                    <h3>Answer</h3>
                    <p>${(questions[i].answer.length > 0) ? questions[i].answer : "No Answer Yet!"}</p>
                        ${(readCookie("user-type") != "student") ? `<br><input style="width: 100%;" class="${questions[i].id}-ans-textfield" type="text" placeholder="Answer"/>` : ""}
                </div>
                <div class="card-footer clear-fix">
                    ${
            (readCookie("user-type") != "student") ? `<button class="ans-btn" id="${questions[i].id}">Post Answer</button>` : ""
            }
                    <button data-url="${questions[i].slideLink}" class="context-btn">View in Context</button>
                </div>
            </div>
        `)
    }

    // go to the context of a question
    $(".context-btn").click((event) => {
        let contextUrl = event.currentTarget.dataset.url;
        window.location.href = contextUrl;
    });

    // post answer for a given question
    $(".ans-btn").click((event) => {
        let questionId = event.currentTarget.id;
        let answer = $(`.${questionId}-ans-textfield`).val();

        if (answer.length > 0) {
            postAnswer(questionId, answer, readCookie("key"), url);
        } else {
            showToast("Answer missing!", "error");
        }
    });
}

/**
 * Groups the questions by their presentation
 * 
 * @param {Array} questions Array of questions which are not grouped by presentation
 * @returns An array of questions grouped by presentation
 */
function getQuestionsForPresentation(questions) {
    const SLIDE_TITLE = document.querySelector("title").innerText;
    let presentationQuestions = [];

    // get the questions for current week
    for (let i = 0; i < questions.length; i++) {
        if (questions[i].week == SLIDE_TITLE) {
            presentationQuestions.push(questions[i]);
        }
    }

    return presentationQuestions;
}

/**
 * Gets the questions asked for a given slide.
 * TODO: This may need to be removed.
 * 
 * @param {Array} questions Array of questions
 * @returns An array of questions grouped by slide link
 */
function getQuestionsFromCurrentSlide(questions) {
    let tempQuestions = [];
    const LINK = getCurrentSlideLink();

    for (let i = 0; i < questions.length; i++) {
        if (questions[i].slideLink == LINK) {
            tempQuestions.push(questions[i]);
        }
    }

    return tempQuestions;
}

/**
 * Makes the network call to get all the questions 
 * 
 * @param {String} key The secret key
 * @param {String} url URL to make the network call
 */
function getQuestions(key, url) {
    $.ajax({
        method: "POST",
        data: {
            key: key
        },
        url: `${url}?path=/get-all-questions`,
        success: (response) => {
            $(".custom-menu-container").empty();

            if (response.status == 400) {
                $(".custom-menu-container").append("<h3>Missing Key</h3>");
            } else if (response.status == 404) {
                $(".custom-menu-container").append("<h3>No Questions Available</h3>");
            } else {
                let questions = getQuestionsForPresentation(response);

                if (questions.length > 0) {
                    addQuestionsToPage(questions);
                } else {
                    $(".custom-menu-container").append("<h3>No Questions Available</h3>");
                }
            }
        }
    });
}

/**
 * Authenticates the user and gets the user type
 * 
 * @param {String} key The secret key
 * @param {String} url The URl to make the network call to 
 */
function authenticateUser(key, url) {
    $.ajax({
        method: "POST",
        data: {
            key: key
        },
        url: `${url}?path=/verify-user-type`,
        success: (response) => {
            if (response.status == 200) {
                showToast("User authenticated", "ok");
                writeCookie("key", key);
                writeCookie("user-type", response.message);

                if ($("#key-card")[0]) {
                    $("#key-title").text("Key is Set");
                    $(".card-content").css("display", "none");
                    $(".key-add-btn").css("display", "none");
                    $(".key-delete-btn").css("display", "block");
                    $(".key-textfield").val("");
                }
            } else {
                showToast(`${response.message}`, "error");
            }
        }
    });
}

/**
 * Posts a questions to the google spreadsheet
 * 
 * @param {String} selectedText Selected text from the presentation
 * @param {String} currentSlideLink Slide link 
 * @param {String} week Name of the presentation
 * @param {String} question The question
 * @param {String} key The secret key
 * @param {String} url The URL to make the network call to
 */
function postQuestion(selectedText, currentSlideLink, week, question, key, url) {
    $.ajax({
        method: "POST",
        data: {
            selectedText: selectedText,
            slideLink: currentSlideLink,
            question: question,
            week: week,
            key: key
        },
        url: `${url}?path=/add-question`,
        success: (response) => {
            if (response.status == 200) {
                writeCookie("key", key);
                $("#question-modal").removeClass("active");
                $("#question-text").val("");
                $("#key-textfield").val("");
                $("#overlay").removeClass("active");
                showToast("Question posted.", "ok")

                if (readCookie("user-type") == null) {
                    authenticateUser(readCookie("key"), url);
                }
            } else {
                showToast(`${response.message}`, "error");
            }
        }
    });
}

/**
 * Makes the network call to add an asnwer to a question 
 * 
 * @param {String} questionId Question id
 * @param {String} answer Answer to the question
 * @param {String} key The secret key
 * @param {String} url The URL to make the network call to
 */
function postAnswer(questionId, answer, key, url) {
    $.ajax({
        method: "POST",
        data: {
            key: key,
            answer: answer,
            id: questionId
        },
        url: `${url}?path=/add-answer`,
        success: (response) => {
            if (response.status == 200) {
                showToast("Answer posted", "ok");
            } else {
                showToast(`${response.message}`, "error");
            }
        }
    });
}

/**
 * Loads up the key setting for  the side menu
 * 
 * @param {String} url The URL to make the network call to authenticate the key
 */
function loadKeySetting(url) {
    const CONTAINER_ID = "key-menu";

    // Load up the main div if its not already there
    if (!$(`#key-card`)[0]) {
        $(`#${CONTAINER_ID}`).append(`
        <div class="card" id="key-card">
            <div class="card-header">
                <h1 id="key-title">Secret Key</h1>
                <hr>
            </div>
            <div class="card-content">
                <h3>Enter Key Provided by Lecturer:</h3>
                <input class="key-textfield" type="password" placeholder="Your Key"/>
            </div>
            <div class="card-footer clear-fix">
                <button class="key-add-btn">Authenticate</button>
                <button class="key-delete-btn">Delete Key</button>
            </div>
        </div>
        `);
    }

    if (readCookie("key") == null) {
        $(".key-delete-btn").css("display", "none");
    } else {
        $("#key-card .card-content").css("display", "none");
        $(".key-add-btn").css("display", "none");
        $(".key-delete-btn").css("display", "block");
        $("#key-title").text("Key is Set");
    }

    // key event
    $(".key-add-btn").click(() => {
        let keyString = $(".key-textfield").val();

        if (keyString.length > 0) {
            authenticateUser(keyString, url);
        } else {
            showToast("Key missing", "error");
        }
    });

    $(".key-delete-btn").click(() => {
        deleteCookie("key");
        deleteCookie("user-type");

        $("#key-title").text("Enter Key");
        $(".card-content").css("display", "block");
        $(".key-add-btn").css("display", "block");
        $(".key-delete-btn").css("display", "none");
    });
}

/**
 * Loads up a button which would allow the user to ask questions without selecting
 * any text from the presentation
 * 
 * @param {String} containerId CSS selector id for the container to add the button
 * @param {String} url The URL to use to post the question
 */
function loadAskQuestionButton(containerId, url) {
    $(`#${containerId}`).append(`
        <button id="main-ask-btn">Ask a Question</button>
        <style>
            #main-ask-btn {
                position: fixed;
                top: 3.5%;
                left: 95.35%;
                transform: translate(-50%, -50%);
                border: 0px solid black;
                z-index: 8;
                background-color: white;
                width: 125px;
                padding: 0.35%;
                max-height: 100%;
                overflow: auto;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.3);
                background-color: #7747D1;
            }

            #main-ask-btn:hover {
                background-color: #2E0085;
            }
        </style>
    `);

    $("#main-ask-btn").click(() => {
        globalQuestion.selectedText = "N/A";
        showQuestionBox("N/A", getCurrentSlideLink(), url);
    })
}

/**
 * Checks if the side menu is loaded. When loaded fire off the callback function
 * to load up the plugin
 * 
 * @param {Function} callback Callback function
 */
function isMenuAvailable(callback) {
    if ($(".custom-menu-container")[0]) {
        callback();
    } else {
        setTimeout(() => {
            isMenuAvailable(callback)
        }, 500);
    }
}

/**
 * Fires off the operation to start off to load the plugin
 * 
 * @param {String} CONTAINER_ID CSS selector for the presentation container
 * @param {String} SERVER_SCRIPT_URL The main url for the google app script
 */
function loadPlugin(CONTAINER_ID, SERVER_SCRIPT_URL) {
    const callback = () => {

        // Event handler to listen for text selection in the presentation
        $(`#${CONTAINER_ID}`).contextmenu(function (event) {
            let selectedText = (window.getSelection()) ? window.getSelection().toString() : "";

            if (selectedText.length > 0) {
                event.preventDefault();
                globalQuestion.selectedText = selectedText;
                showQuestionBox(selectedText, getCurrentSlideLink(), SERVER_SCRIPT_URL);
            }
        });

        // loads in the question butti=on for the presentation
        loadAskQuestionButton(CONTAINER_ID, SERVER_SCRIPT_URL);

        // menu events
        $(".slide-menu-button").click(() => {
            $('[data-button="0"]').trigger('click');
        });

        // listens for any clicks for the button in the tool-bar panel
        // This is already handled within RevealMenu but there is a delay in
        //  animation in hiding the panel which is the reason why this is added
        $(".toolbar-panel-button").click((event) => {
            let buttonId = event.currentTarget.dataset.button;

            if (buttonId == 0) {
                $("#key-menu").css("display", "none");
                $(".custom-menu-container").css("display", "none");

            } else if (buttonId == 1) {
                // questions menu button
                $("#key-menu").css("display", "none");
                $(".custom-menu-container").css("display", "block");
                $(".custom-menu-container").empty();

                if (readCookie("key") == null) {
                    $(".custom-menu-container").empty();
                    $(".custom-menu-container").append("<h3>Please add key from key menu</h3>");
                }

                if (readCookie("key") != null && readCookie("user-type") != null) {
                    $(".custom-menu-container").append("<h3>Loading Questions...</h3>");
                    getQuestions(readCookie("key"), SERVER_SCRIPT_URL);
                }
            } else if (buttonId == 2) {
                // key menu button
                $(".custom-menu-container").css("display", "none");
                $("#key-menu").css("display", "block");

                loadKeySetting(SERVER_SCRIPT_URL);
            }
        });
    };

    isMenuAvailable(callback);
}

/**
 * Loads the JQuey library.
 * 
 * JQuery library is used for easier manipulation of DOM and Making AJAX requests
 * 
 * @param {Strin} url JQuery CDN link
 * @param {Function} onLoadCallback Callback function
 */
function loadJQuery(url, onLoadCallback) {
    let targetElement = document.querySelector("body");

    let resourceElement = document.createElement("script");
    resourceElement.src = url;
    resourceElement.onload = onLoadCallback;
    resourceElement.async = false;

    let fragment = document.createDocumentFragment();
    fragment.append(resourceElement);
    targetElement.append(fragment);
}

/**
 * The actual plugin for the presentation.
 * 
 * This plugin depends heavily on RevealMenu plugin. Therefore, make sure RevealMenu
 * is setup properly as shown in the user guide on GitLab
 * 
 * @param {String} url The URL to the Google App Script
 * @returns The Plugin
 */
const FeedbackPlugin = (url) => {
    return {
        id: "feedback-plugin-verison-2",
        init: (deck) => {
            const SERVER_SCRIPT_URL = url;

            // Wrapping the reveal presentation
            const CONTAINER_ID = "lecture-container";

            let slidesWrapper = document.createElement("div");
            slidesWrapper.id = CONTAINER_ID;
            slidesWrapper.append(document.querySelector(".reveal"));

            let wrapperFragment = document.createDocumentFragment();
            wrapperFragment.append(slidesWrapper);
            document.querySelector("body").append(wrapperFragment);

            // Handling the resizing of the presentation
            let resizeContainer = (cssSelector) => {
                document.querySelector(cssSelector).style.width = `${window.innerWidth}px`;
                document.querySelector(cssSelector).style.height = `${window.innerHeight}px`;
            };

            resizeContainer(`#${CONTAINER_ID}`);
            window.addEventListener("resize", () => {
                resizeContainer(`#${CONTAINER_ID}`);
            });

            // reconfig reveal
            deck.configure({ slideNumber: "h/v" });
            deck.configure({ embedded: true });

            // loading Jquery
            const jQueryCallback = () => {
                const $ = window.jQuery;
                loadPlugin(CONTAINER_ID, SERVER_SCRIPT_URL);
            };

            loadJQuery(
                url = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
                onLoadCallback = jQueryCallback
            );
        }
    };
};