{
    "manifest_version": 3,
    "name": "LinkedIn Automation Assistant",
    "version": "1.0.0",
    "description": "Automate LinkedIn profile scraping and feed engagement",
    "permissions": [
      "activeTab",
      "tabs",
      "storage",
      "scripting"
    ],
    "host_permissions": [
      "https://www.linkedin.com/*"
    ],
    "action": {
      "default_popup": "popup/popup.html",
      "default_icon": {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    "background": {
      "service_worker": "background/background.js"
    },
    "content_scripts": [
      {
        "matches": ["https://www.linkedin.com/*"],
        "js": ["content/content.js"],
        "run_at": "document_idle"
      }
    ],
    "icons": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
