/**
 * Creates a reveal.js plugin which allows to send questions to a database
 * which can be later viewed by the lecturer from a dashboard or directly.
 * 
 * @param {String} postUrl The URL in which the questions will be POSTED to
 * @returns {Object} Object which can be added to reveal.js instance as a plugin
 */
function FeedbackPlugin(postUrl) {
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
                    <div class="modal-content">
                        <h4>Have a Question?</h4>
                        <p>
                            You have highlighted some text. If you have a question regarding the highlighted text, 
                            please use the form below to ask the question. You can view all the questions asked by student <a href="question_dashboard.html">here.</a>
                        </p>
                        <h5>Your selected text</h5>
                        <blockquote id="highlighted-text-place">
                            ${selectedText} 
                        </blockquote>

                        <div class="input-field col s6" id="question-input">
                            <i class="material-icons prefix">insert_comment</i>
                            <textarea id="question-text" class="materialize-textarea"></textarea>
                            <label for="question-text">My Question is </label>
                        </div>    
                        <div class="progress" style="display: none;">
                            <div class="indeterminate"></div>
                        </div>  
                    </div>
                    <div class="modal-footer">
                        <a class="teal darken-3 waves-effect waves-light btn" id="ask-btn">Ask Question</a>
                        <a class="red darken-3 waves-effect waves-light btn" id="key-btn">Clear Key</a>
                    </div>
                </div>

                <style>
                    #toast-container { 
                        min-width: 10%; 
                        top: 60%; 
                        right: 50%; 
                        transform: translateX(50%) translateY(50%); 
                    }
                </style>
                `);

                // Checking if a key is already present. If not then ask for the key
                if (extension.readCookie("key") == null) {
                    $("#question-input").append(`
                    <div class="input-field col s6" id="key-input">
                        <i class="material-icons prefix">vpn_key</i>
                        <input id="key-textfield" type="password" class="validate">
                        <label for="key-textfield">Class key </label>
                    </div>
                    `);
                }

                // init dialog
                $(`#${dialogId}`).modal({
                    onCloseEnd: function () {
                        $("#key-textfield").val("");
                        $("#question-text").val("");
                    }
                });

                // event handlers
                $("#ask-btn").click(() => {
                    let questionString = $("#question-text").val();
                    let keyString = (extension.readCookie("key") != null) ? extension.readCookie("key") : $("#key-textfield").val();

                    if (questionString.length <= 0 || keyString.length <= 0) {
                        M.toast({
                            html: 'Fill in the missing fields :)',
                            displayLength: 2500
                        });
                    } else {
                        let currentTitle = document.querySelector("title").innerText;
                        extension.sendFeedback(selectedText, currentSlideLink, currentTitle, questionString, keyString, postUrl);
                    }
                });

                // Clear the key from the cookies so user can add new key
                $("#key-btn").click(() => {
                    if (extension.readCookie("key") != null) {
                        extension.deleteCookie("key");
                        $("#question-input").append(`
                        <div class="input-field col s6" id="key-input">
                            <i class="material-icons prefix">vpn_key</i>
                            <input id="key-textfield" type="password" class="validate">
                            <label for="key-textfield">Class key </label>
                        </div>
                        `);
                    }
                });

            } else {
                if (extension.readCookie("key") !== null) {
                    $("#key-input").remove();
                }
                // Dialog already added. Simply change the selected text
                $("#highlighted-text-place").empty();
                $("#highlighted-text-place").append(selectedText);
            }

            // Show the dialog
            $(`#${dialogId}`).modal("open");
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
            // Show the progress bar
            $(".progress").css("display", "block");

            $.ajax({
                method: "POST",
                data: {
                    selectedText: selectedText,
                    slideLink: currentSlideLink,
                    question: question,
                    key: keyString,
                    week: week
                },
                url: postUrl,
                success: function (resp) {
                    // hide progress bar since request is done
                    $(".progress").css("display", "none");
                    if (resp.status == 200) {
                        // Everything well
                        extension.writeCookie("key", keyString);
                        $("#question-modal").modal("close");

                        M.toast({
                            html: 'Question posted :)',
                            displayLength: 2500
                        });
                    } else {
                        // something went wrong
                        M.toast({
                            html: `${resp.messages}`,
                            displayLength: 2500
                        });
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

            /**
             * Materialize css/js library and JQuery are the only dependencies
             * we could allow the devs to include the dependencies statically but
             * if they have many presentations then it would be a hassle... or they 
             * might forget to add one... therefore this plugin will simply set those
             * up for the dev :)
             * 
             * Materialize.css is used for styling the dialog box which allows the 
             * user to type in their question
             * 
             * Materialize.js is used for animations
             * 
             * JQuery is used mainly for making AJAX request. But it also used
             * for more complicated DOM manipulation.
             */

            extension.loadResource("link", onloadCallback = null, optionals = {
                href: "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css",
                rel: "stylesheet"
            });

            extension.loadResource("link", onloadCallback = null, optionals = {
                href: "https://fonts.googleapis.com/icon?family=Material+Icons",
                rel: "stylesheet"
            });

            let jQueryCallback = function () {
                let $ = window.jQuery;

                let materializeJsCallback = function () {

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

                extension.loadResource("script", onload = materializeJsCallback, optionals = {
                    src: "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"
                });
            };

            extension.loadResource("script", onload = jQueryCallback, optionals = {
                src: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"
            });
        }
    };
    return extension;
}