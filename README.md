## LinkedIn Automation Tool (Manifest V3 + Express)
A full-stack solution to automate LinkedIn profile data extraction and feed engagement.

Project Structure
extension/: The Chrome Extension source code.
backend/: NodeJS server using Express and Sequelize.

Setup Instructions
1. Backend Setup (NodeJS + Express)
Navigate to the backend folder:
cd backend

Install dependencies:
npm install

Start the server:
node server.js

The server will run on http://localhost:3000 and create a database.sqlite file automatically.

2. Extension Setup (Chrome Manifest V3)
   
a. Open Google Chrome and navigate to chrome://extensions/.
b. Enable Developer Mode (toggle switch in the top right).
c. Click Load unpacked.
d. Select the extension/ folder from this repository.

Permissions Used
The extension requires the following permissions in manifest.json:

a. activeTab: To read the title of the current page.
b. scripting: To inject the scraping and engagement logic into LinkedIn.
c. tabs: To open and close LinkedIn profile pages during automation.
d. host_permissions: To allow communication with https://www.linkedin.com/* and the local API http://localhost:3000/*.

How to Test Each Feature

1. Current Tab Title Section
   
Open any website in your browser (e.g., google.com).
Open the extension popup and click "Get Current Tab Title".
The title of the page will be displayed instantly inside the popup.

3. LinkedIn Profile Scraping
   
Requirement: You must be manually logged into LinkedIn.
Paste at least 3 LinkedIn profile URLs (separated by commas) into the text box.
Click "Start Profile Scraping".
Behavior: The extension will open each profile in a new tab, extract the data (Name, Bio, Followers, etc.), send it to the Express backend, and close the tab.
Check your terminal or database to see the saved records.

4. LinkedIn Feed Engagement
   
Requirement: You must be on the LinkedIn home/feed page.
Enter a number for Reaction Count and Comment Count.
The button will remain disabled until both fields have valid numbers greater than zero.
Click "Start Feed Engagement".
Behavior: The extension scrolls and randomly likes/comments ("CFBR") on posts until the counts are met, using random delays to simulate human behavior.

Tech Stack
Backend: NodeJS, Express, Sequelize, SQLite3.
Frontend: HTML5, CSS3, Vanilla JavaScript (Chrome Extension API).



