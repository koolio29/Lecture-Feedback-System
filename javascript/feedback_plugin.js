/**
 * Creates a reveal.js plugin which allows to send questions to a database
 * which can be later viewed by the lecturer from a dashboard or directly.
 * 
 * @param {String} postUrl The URL in which the questions will be POSTED to
 * @param {String} dashboardUrl The URL in which all questions can be found
 * @returns {Object} Object which can be added to reveal.js instance as a plugin
 */
function FeedbackPlugin(postUrl, dashboardUrl) {
    extension = {
        id: "feedback-plugin",

        /**
         * Gets the link of the current slide
         * 
         * @param {Presentation} deck A reference to the Presentation instance of reveal
         * @returns {String} A link to the current slide
         */
        getCurrentSlide: function (deck) {
            return document.querySelector(".slide-number a").href;
        },

        /**
         * Gets the value of a cookie
         * 
         * @param {String} cookieName Name of the cookie
         * @returns {String} The value of the cookie. If its not set then null
         */
        readCookie: function (cookieName) {
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
        },

        /**
         * Sets a new cookie
         * 
         * @param {String} cookieName The name of the cookie
         * @param {String} value The value of the cookie
         * @param {Number} expiryDate Number of days to wait before cookie is expired
         */
        writeCookie: function (cookieName, value, expiryDate) {
            let expire = "";
            if (expiryDate != null) {
                let date = new Date();
                date.setTime(date.getTime() + (expiryDate * 24 * 60 * 1000));
                expire = date.toGMTString();
            }
            document.cookie = `${cookieName}=${value}; expires=${expire}; path=/`;
        },

        /**
         * Deletes a cookie
         * 
         * @param {String} cookieName The name of the cookie
         */
        deleteCookie: function (cookieName) {
            extension.writeCookie(cookieName, "", -1);
        },

        showToast: function (text, type) {
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
                        z-index: 10;
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

            $(`#${toastId}`).css("background-color", (type === "ok") ? "#42AD64" : "#FA002E");
            $(`#${toastId}`).text(text);
            $(`#${toastId}`).addClass("show");
            setTimeout(function() {
                $(`#${toastId}`).removeClass("show");
            }, 3000);
        },

        escapeTags : function(text) {
            let tagsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            };

            let replaceTag = function(tag) {
                return tagsToReplace[tag] || tag;
            };

            return text.replace(/[&<>]/g, replaceTag);
        },

        /**
         * Loads up the question dialog box which allows the user to type in a question for
         * the selected text. It handles the event which fires of the request to send
         * the question.
         * 
         * @param {String} selectedText The selected text from the slide
         * @param {String} currentSlideLink The link of the slide which the text was selected
         */
        loadQuestionDialog: function (selectedText, currentSlideLink) {
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
                            You have highlighted some text. If you have a question regarding the highlighted text,
                            please use the form below to ask the question. You can view all the questions asked by students <a
                                href="${dashboardUrl}">here.</a>
                        </p>
                        <h2>Your selected text</h2>
                        <blockquote id="highlighted-text-place">
                            <p>${extension.escapeTags(selectedText)}</p>
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
                if (extension.readCookie("key") == null) {
                    $(`#${dialogId} .modal-content`).append(`
                    <div class="key-container">
                        <input placeholder="Class Key" id="key-textfield" type="password">
                    </div>
                    `);
                }

                // event handlers
                $("#ask-btn").click(() => {
                    let questionString = $("#question-text").val();
                    let keyString = (extension.readCookie("key") != null) ? extension.readCookie("key") : $("#key-textfield").val();

                    if (questionString.length <= 0 || keyString.length <= 0) {
                        // TODO: toast here
                        extension.showToast("Missing fields", "error");
                    } else {
                        let currentTitle = document.querySelector("title").innerText;
                        extension.sendFeedback(selectedText, currentSlideLink, currentTitle, questionString, keyString, postUrl);
                    }
                });

                // Clear the key from the cookies so user can add new key
                $("#key-btn").click(() => {
                    if (extension.readCookie("key") != null) {
                        extension.deleteCookie("key");
                        $(`#${dialogId} .modal-content`).append(`
                        <div class="key-container">
                            <input placeholder="Class Key" id="key-textfield" type="password">
                        </div>
                        `);
                    } else {
                        extension.showToast("Key already deleted!", "error");
                    }
                });

            } else {
                if (extension.readCookie("key") !== null) {
                    $("#key-container").remove();
                }
                // Dialog already added. Simply change the selected text
                $("#highlighted-text-place").empty();
                $("#highlighted-text-place").append(extension.escapeTags(selectedText));
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
        },

        /**
         * Sends the question to be stored in the database
         * 
         * @param {String} selectedText Text selected by user
         * @param {String} currentSlideLink Link to the slide which the text was selected from
         * @param {String} week Week in which the slide was presented
         * @param {String} question The question
         * @param {String} keyString The key to post the question
         * @param {String} postUrl The URL to post the question
         */
        sendFeedback: function (selectedText, currentSlideLink, week, question, keyString, postUrl) {
            $.ajax({
                method: "POST",
                data: {
                    selectedText: selectedText,
                    slideLink: currentSlideLink,
                    question: question,
                    key: keyString,
                    week: week
                },
                url: postUrl + "?path=/add-question",
                success: function (resp) {
                    if (resp.status == 200) {
                        // Everything well
                        extension.writeCookie("key", keyString);
                        $("#question-modal").removeClass("active");
                        $("#question-text").val("");
                        $("#key-textfield").val("");
                        $("#overlay").removeClass("active");

                        extension.showToast("Question posted.", "ok")
                    } else {
                        // something went wrong
                        extension.showToast("Missing fields", `${resp.messages}`);
                    }
                }
            });
        },

        /**
         * Adds a resource to the html document
         * 
         * @param {String} tagType Type of tag (valid HTML tag)
         * @param {String} onloadCallback Callback function when the resource is
         * @param {*} optionals Object containing default values for tags
         */
        loadResource: function (tagType, onloadCallback = null, optionals = { rel: "stylesheet", src: null, href: null, async: "false" }) {
            let targetElement = null;
            let resourceElement = document.createElement(tagType);

            if (tagType === "link") { // for css
                targetElement = document.querySelector("head");
                resourceElement.rel = optionals.rel;
                resourceElement.href = optionals.href;
            } else if (tagType === "script") { // for javascript
                targetElement = document.querySelector("body");
                resourceElement.src = optionals.src;
                resourceElement.onload = onloadCallback;
                resourceElement.async = optionals.async;
            }

            let documentFragment = document.createDocumentFragment();
            documentFragment.append(resourceElement);
            targetElement.append(documentFragment);
        },

        /**
         * Sets a new size for the container depending on the window size
         * 
         * @param {String} cssSelector CSS selector for the container 
         */
        setContainerSize: function (cssSelector) {
            document.querySelector(cssSelector).style.width = `${window.innerWidth}px`;
            document.querySelector(cssSelector).style.height = `${window.innerHeight}px`;
        },

        /**
         * Sets up the plugin
         * 
         * @param {Presentation} deck A reference to the Presentation instance of reveal
         */
        init: function (deck) {
            const CONTAINER_ID = "lecture-container";

            // TODO: clean this up
            let slidesWrapper = document.createElement("div");
            slidesWrapper.id = CONTAINER_ID;
            slidesWrapper.append(document.querySelector(".reveal"));

            let wrapperFragment = document.createDocumentFragment();
            wrapperFragment.append(slidesWrapper);
            document.querySelector("body").append(wrapperFragment);

            // reconfig reveal
            deck.configure({ slideNumber: "h/v" });
            deck.configure({ embedded: true });

            // Setting new sizes and events to resize the container
            extension.setContainerSize(`#${CONTAINER_ID}`);
            window.addEventListener("resize", function () {
                extension.setContainerSize(`#${CONTAINER_ID}`);
            });

            let jQueryCallback = function () {
                let $ = window.jQuery;

                // Event handler to get the selected text from the slide
                $(`#${CONTAINER_ID}`).unbind('contextmenu').bind('contextmenu', function (event) {
                    let selectedText = (window.getSelection) ? window.getSelection().toString() : "";

                    if (selectedText.length > 0) {
                        event.preventDefault();
                        let currentSlideLink = extension.getCurrentSlide(deck);
                        extension.loadQuestionDialog(selectedText, currentSlideLink);
                    }
                });
            };

            extension.loadResource("script", onload = jQueryCallback, optionals = {
                src: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"
            });
        }
    };
    return extension;
}