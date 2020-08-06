# Lecture Feedback System Demo

This repository contains a [reveal.js](https://revealjs.com/) plugin written to allows students to ask questions regarding the content of the lecture. 

Furthermore, it contains instructions to setup a quick and easy "server" to store the questions asked by students and get questions asked by other students. In addition to this, the "server" provides an end point to post answers to those questions stored in a "database"

A quick demo of the system can be found [here]()

*__Note:__* For the latest features, pull `develop` branch.

### Table of Contents

[1 - Getting Started](#1---Getting-Started)  
&nbsp;&nbsp;&nbsp;&nbsp;[1.1 - Setting Up Server Script](#1.1---Setting-Up-Server-Script)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.1 - Creating The Google SpreadSheet](#1.1.1---Creating-The-Google-SpreadSheet)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.2 - Setting Up The Google App Script](#1.1.2---Setting-Up-The-Google-App-Script)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.3 - Deploying the Google App Script](#1.1.3---Deploying-the-Google-App-Script)   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.4 - Server Script Endpoints](#1.1.4---Server-Script-Endpoints)  
&nbsp;&nbsp;&nbsp;&nbsp;[1.2 - Setting Up Front-End](#1.2---Setting-Up-Front-End)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.2.1 - Adding the Plugin](#1.2.1---Adding-the-Plugins)    
&nbsp;&nbsp;&nbsp;&nbsp;[2.1 - Asking Questions](#2.1---Asking-Questions)  
&nbsp;&nbsp;&nbsp;&nbsp;[2.2 - Viewing Questions](#2.2---Viewing-Questions)  
&nbsp;&nbsp;&nbsp;&nbsp;[2.3 - Answering Questions](#2.3---Answering-Questions)  
[3 - Built With](#3---Built-With)

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

### 2.2 - Viewing Questions

### 2.3 - Answering Questions

## 3 - Built With

* [Gexpress](https://github.com/coderofsalvation/Gexpress) - Express middleware for google appscript (build NODEJS-like applications) + generated api-client .
* [reveal.js](https://revealjs.com/) - Open source HTML presentation framework. Built-in API is used to create a plugin.
* [reveal.js-menu](https://github.com/denehyg/reveal.js-menu) - Slide out menu for reveal.js.
* [jQuery](https://jquery.com/) - Used to make Ajax calls and for DOM manipulation by the `reveal.js` plugin.