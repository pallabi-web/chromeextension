## LinkedIn Automation Tool (Manifest V3 + Express)
A full-stack solution to automate LinkedIn profile data extraction and feed engagement.

### Project Structure
extension/: The Chrome Extension source code. <br>
backend/: NodeJS server using Express and Sequelize. <br>

### Setup Instructions
1. Backend Setup (NodeJS + Express) <br>
Navigate to the backend folder: <br>
cd backend

Install dependencies:
npm install

Start the server:
node server.js

The server will run on http://localhost:3000 and create a database.sqlite file automatically.

2. Extension Setup (Chrome Manifest V3)
   
a. Open Google Chrome and navigate to chrome://extensions/.<br>
b. Enable Developer Mode (toggle switch in the top right).<br>
c. Click Load unpacked.<br>
d. Select the extension/ folder from this repository.<br>

### Permissions Used
The extension requires the following permissions in manifest.json:

a. activeTab: To read the title of the current page.<br>
b. scripting: To inject the scraping and engagement logic into LinkedIn.<br>
c. tabs: To open and close LinkedIn profile pages during automation.<br>
d. host_permissions: To allow communication with https://www.linkedin.com/ and the local API http://localhost:3000/.<br>

### How to Test Each Feature

1. Current Tab Title Section
   
Open any website in your browser (e.g., google.com).
Open the extension popup and click "Get Current Tab Title".
The title of the page will be displayed instantly inside the popup.

3. LinkedIn Profile Scraping
   
Requirement: You must be manually logged into LinkedIn. <br>
Paste at least 3 LinkedIn profile URLs (separated by commas) into the text box.<br>
Click "Start Profile Scraping".<br>
Behavior: The extension will open each profile in a new tab, extract the data (Name, Bio, Followers, etc.), send it to the Express backend, and close the tab.<br>
Check your terminal or database to see the saved records.<br>

4. LinkedIn Feed Engagement
   
Requirement: You must be on the LinkedIn home/feed page.<br>
Enter a number for Reaction Count and Comment Count.<br>
The button will remain disabled until both fields have valid numbers greater than zero.<br>
Click "Start Feed Engagement".<br>
Behavior: The extension scrolls and randomly likes/comments ("CFBR") on posts until the counts are met, using random delays to simulate human behavior.<br>

### Tech Stack


Backend: NodeJS, Express, Sequelize, SQLite3. <br>
Frontend: HTML5, CSS3, Vanilla JavaScript (Chrome Extension API).



