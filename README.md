# Lecture Feedback System

This repository contains a [reveal.js](https://revealjs.com/) plugin written to allows students to ask questions regarding the content of the lecture. 

Furthermore, it contains instructions to setup a quick and easy "server" to store the questions asked by students and get questions asked by other students. In addition to this, the "server" provides an end point to post answers to those questions stored in a "database"

A quick demo of the system can be found [here]()

*__Note:__* For the latest features, pull `develop` branch.

### Table of Contents

[1 - Getting Started](#1-getting-started)  
&nbsp;&nbsp;&nbsp;&nbsp;[1.1 - Setting Up Server Script](#11-setting-up-server-script)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.1 - Creating The Google SpreadSheet](#111-creating-the-google-spreadsheet)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.2 - Setting Up The Google App Script](#112-setting-up-the-google-app-script)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.3 - Deploying the Google App Script](#113-deploying-the-google-app-script)   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.4 - Server Script Endpoints](#114-server-script-endpoints)  
&nbsp;&nbsp;&nbsp;&nbsp;[1.2 - Setting Up Front-End](#1.2-setting-up-front-end)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.2.1 - Adding the Plugins](#121-adding-the-plugins)    
[2 - Usage](#2-usage)  
&nbsp;&nbsp;&nbsp;&nbsp;[2.1 - Asking Questions](#21-asking-questions)  
&nbsp;&nbsp;&nbsp;&nbsp;[2.2 - Viewing Questions](#22-viewing-questions)  
&nbsp;&nbsp;&nbsp;&nbsp;[2.3 - Answering Questions](#23-answering-questions)  
&nbsp;&nbsp;&nbsp;&nbsp;[2.4 - Changing The Secret Key](#24-changing-the-secret-key)   
[3 - Built With](#3-built-with)

## 1 - Getting Started

The following instructions will help you to setup the "server" side of the system as well as the front-end.

### 1.1 - Setting Up Server Script

The server side is basically a `Google App Script` which is depolyed as web app. This script interacts with a Google SpreadSheet, which acts a database, to add/retrieve questions as well as to add/update answers.

#### 1.1.1 - Creating The Google SpreadSheet
Before setting up the server script, the Google SpreadSheet must be created. To create the Google SpreadSheet go to your google drive and create a new folder.

![Folder_creation](/assets/folder_creation.png)

Inside that folder, create a Google SpreadSheet.

![Sheet_creation](/assets/sheet_creation.png)

In the new Google Spreadsheet, create two new sheets called `Questions` and `Keys`. The `Questions` sheet will hold the questions and answers while the `Keys` will hold the keys/password which the student needs to use post and view questions. Lecturer is also provided a key so that they can post answer to questions. Keep in mind that the sheet names are case-sensitive.

![sheet_creation_2](/assets/table_creation.png)

In the `Questions` sheet, create the following columns (case-sensitive) starting from row 1 column 1.

![sheet_creation_2](/assets/questions_creation.png)

Then in the `Keys` sheet, create the following columns (case-sensitive) starting from row 1 and column 1. You will also need to add the same values (case-sensitive) for the `User Type` column as shown in the screenshot.

![sheet_creation_2](/assets/key_creation.png)

For the key column, you have to add a key/password for each of the user type.

Finally, take a note of the URL of the Google SpreadSheet. This URL will be needed in that next section.

#### 1.1.2 - Setting Up The Google App Script

To setup the Google App Script, head over to [script.google.com](https://script.google.com/) and sign in to your google account. Then create a new project.

When the new script is loaded, paste the following code in found in `Google App Script/SheetScript.js` into the newly created script.

After pasting the code in the Google App Script editor, change the value of the global variable `spreadSheet`, found in line 2, to the Google SpreadSheet URL which was noted from [section 1.1.1](#1.1---Setting-Up-Server-Script)

Before this script is deployed as a web app, the `Gexpress` library will need to be added. This can be done by adding `1Lm_jNmD2FWYF-Kgj7AdHVvLEVXZ4c5AXwzd1KJSb48scn0HLBq64um7S` to the libraries of the project (Resource > Libraries).

<!-- Taken from Gexpress docs -->
![Adding Library](/assets/gexpress_library.gif)

*__Note:__ Please select the latest version when adding the library.*

#### 1.1.3 - Deploying the Google App Script

When deploying the script as a web app (Publish > Depoly as a web app) you will need to make sure the configuration is set as below.

![Depoloy Config](/assets/deploy.png)

When you confirm and deploy, you will be asked to authorize the script to access the Google SpreadSheet.

When the authorization is complete, you will be provided a URL which gives access to the Google App Script. This URL must be provided to `reveal.js` plugin in order to post and get questions from the Google SpreadSheet.

![Depoloy url](/assets/deploy_url.png)

#### 1.1.4 - Server Script Endpoints

| URL                          | Method | Required Parameters    | Description                                            |
|------------------------------|--------|------------------------|--------------------------------------------------------|
|/exec?path=/get-all-questions | POST   | __key__ = Secret key | Allows users to get all questions from the Google SpreadSheet |
|/exec?path=/add-question      | POST   | __key__ = Secret key, <br>__question__ = The question, <br>__selectedText__ = Highlighted text, <br>__slideLink__ = Link to the slide, <br>__week__ = Week which the slide belong to | Adds a question to the Google SpreadSheet |
|/exec?path=/add-answer        | POST   | __key__ = Secret key, <br>__id__ = Id of question, <br>__answer__ = Answer to question | Adds/Updates answer for a given question|
|/exec?path=/verify-user-type  | POST   | __key__ = Secret key | Verifies the key and user type |

### 1.2 - Setting Up Front-End

Before you can add in the plugins needed, please make sure that the `reveal.js-menu` is properly is setup in the project directory. It is recommended to use the manual installation of the plugin to avoid to avoid installing node.js. Manual installation guide can be found [here.](https://github.com/denehyg/reveal.js-menu#manual)

Moreover, you will need to place the file(s) found in the `javascript` and `reveal-menu-panels` folder in your own project directory. These file are essential to for the front-end

#### 1.2.1 - Adding the Plugins

To setup the reveal presentation to allow questions to be asked, you will need to configure the reveal.js.

Before you initialize the `reveal` instance import the required plugins to the `HTML` file of your presentation.
```html
<!-- Make sure the paths to the plugins are correct -->
<script src="PATH_TO_PLUGIN/feedback_plugin.js"></script>
<script src="PATH_TO_REVEAL_MENU/reveal.js-menu/menu.js"></script>
```

You can now copy the sample configuration below to your reveal presentation.

Please make sure to change the `SERVER_URL` variable to the URL you got from [1.1.3 - Deploying the Google App Script](#1.1.3---Deploying-the-Google-App-Script)

```javascript
const SERVER_URL = "YOUR_GOOGLE_APP_SCRIPT_URL";
Reveal.initialize({
    // you can have other settings...

    // You can add other plugins as well. RevealMenu and FeedbackPlugin(Server_URl) is required.
    plugins: [RevealMenu, FeedbackPlugin(SERVER_URL)],

    // Copy this as it is. Don't make any changes except for the path to the custom panels
    menu: {
        keyboard: false,
        width: "third",
        custom: [
            {
                title: 'Questions',
                icon: '<i class="fas fa-comment-alt">',
                src: '/PATH_TO_REVEAL_PANEL/question-panel.html'
            },
            {
                title: "Key Settings",
                icon: '<i class="fas fa-key">',
                src: '/PATH_TO_REVEAL_PANEL/key-panel.html'
            }
        ]
    }
});
```

## 2 - Usage

### 2.1 - Asking Questions

There are two ways to ask questions. 

The first way is to simply click the button in the top right corner of the screen. This will open a dialog box in which you can type in your question. You maybe asked to enter a secret key if its not set. This secret key can be seen in the Google SpreadSheet created in [1.1.1 - Creating The Google SpreadSheet](#111-creating-the-google-spreadsheet).

![Depoloy Config](/assets/asking_question_1.gif)

The second way to ask a question is to highlight the text in the presentation that you have a question about and right click. This will again open the dialog box in which you can type in your question.

![Depoloy Config](/assets/asking_question_2.gif)

### 2.2 - Viewing Questions

You can view questions asked for the presentation you are viewing by opening the side menu and going to the questions tab.

The questions tab will show the questions asked by the students and will allow you to view the slide, by clicking the "View in Context" button, in which they had the question.

![Depoloy Config](/assets/viewing_questions.gif)

### 2.3 - Answering Questions

In order to answer questions asked by students, you will need to have added the administrative secret key. Check [2.4 - Changing The Secret Key](#24-changing-the-secret-key) to see how to change the key. 

When the administrative key is added, you can once again view the questions as shown in [2.2 - Viewing Questions](#22-viewing-questions). You will notice a textfield will be present in order for you to type in the answer for the question. If the answer is already given for a question, you can update the answer of the question by simply writing down a new answer.

![Depoloy Config](/assets/answering_question.gif)

### 2.4 - Changing The Secret Key

To change the secret key, open the side menu and click on the "Key Settings" tab. This will show whether the key if a key is currently set or not. If its not set then you can simply add your key and click "Authenticate" button. If a key is already present, you can always remove the key and type in your new key.

![Depoloy Config](/assets/changing_key.gif)

## 3 - Built With

* [Gexpress](https://github.com/coderofsalvation/Gexpress) - Express middleware for google appscript (build NODEJS-like applications) + generated api-client .
* [reveal.js](https://revealjs.com/) - Open source HTML presentation framework. Built-in API is used to create a plugin.
* [reveal.js-menu](https://github.com/denehyg/reveal.js-menu) - Slide out menu for reveal.js.
* [jQuery](https://jquery.com/) - Used to make Ajax calls and for DOM manipulation by the `reveal.js` plugin.