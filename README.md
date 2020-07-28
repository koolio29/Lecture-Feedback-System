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
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.1.4 - Server Endpoints](#1.1.4---Server-Endpoints)  
&nbsp;&nbsp;&nbsp;&nbsp;[1.2 - Setting Up Front-End](#1.2---Setting-Up-Front-End)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.2.1 - Adding the Plugin](#1.2.1---Adding-the-Plugin)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.2.2 - Updating Default Dashboard URL](#1.2.2---Updating-Default-Dashboard-URL)  
[2 - Usage](#2---Usage)  
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

#### 1.1.4 - Server Endpoints

### 1.2 - Setting Up Front-End

#### 1.2.1 - Adding the Plugin

#### 1.2.2 - Updating Default Dashboard URL

## 2 - Usage

### 2.1 - Asking Questions

### 2.2 - Viewing Questions

### 2.3 - Answering Questions

## 3 - Built With

* [Gexpress](https://github.com/coderofsalvation/Gexpress) - Express middleware for google appscript (build NODEJS-like applications) + generated api-client .
* [reveal.js](https://revealjs.com/) - Open source HTML presentation framework. Built-in API is used to create a plugin.