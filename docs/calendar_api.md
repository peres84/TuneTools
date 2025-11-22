Google Calendar API Integration Workflow (Read-Only)

This workflow outlines the four main phases required to set up a client-side application (like a web app) to securely read a user's calendar data using the Google Calendar API.

Phase 1: Google Cloud Project Setup and Credentials

This phase is done once in the Google Cloud Console.

Create/Select Google Cloud Project: If you don't have one, create a new project.

Enable the Google Calendar API: Navigate to the "APIs & Services" Dashboard and explicitly enable the "Google Calendar API" for your project.

Configure OAuth Consent Screen: Define your application's name, logo, and scopes. The essential scope for reading events is:

https://www.googleapis.com/auth/calendar.readonly

Create OAuth 2.0 Client ID:

Go to "Credentials" and create new credentials.

Select OAuth client ID.

Application type must be Web application.

Set Authorized Origins: This is critical for client-side (browser) applications.

Add the exact URL(s) where your application will be running (e.g., http://localhost:8080, https://yourdomain.com). This ensures only your application can request tokens.

Record Credentials: Save the generated Client ID (used for authorization) and the API Key (used for initializing GAPI).

Phase 2: Client-Side Initialization (HTML/JavaScript)

This code must be included in your web application to load the necessary libraries.

Load Libraries: Include the Google Identity Services (GIS) and Google API Client (GAPI) scripts in your HTML.

<script src="[https://apis.google.com/js/api.js](https://apis.google.com/js/api.js)"></script>
<script src="[https://accounts.google.com/gsi/client](https://accounts.google.com/gsi/client)"></script>

Initialize GAPI Client (gapi.client.init):

Initialize the Google API client with your API_KEY and the Calendar API's discoveryDocs. This prepares the client to make API calls.

Initialize GIS Token Client (google.accounts.oauth2.initTokenClient):

Initialize the Identity Services token client with your CLIENT_ID and the required SCOPE. This object manages the user consent pop-up.

Phase 3: User Authorization (OAuth 2.0 Flow)

This is the process of getting the user's permission and receiving an access token.

Trigger Consent: When the user clicks an "Authorize" button, call tokenClient.requestAccessToken({prompt: 'consent'}).

User Interaction: Google displays a pop-up asking the user to log in and approve the calendar.readonly access.

Handle Token Callback: If approved, Google calls a specified callback function in your app, providing a temporary Access Token in the response. This token proves you have the user's permission.

Store Token: The GAPI client automatically handles storing this token for subsequent authenticated requests.

Phase 4: Data Fetching and Display

With the access token obtained in Phase 3, you can now securely call the Calendar API.

Call the API: Use the initialized GAPI client to make the call to the Calendar API service:

gapi.client.calendar.events.list({
'calendarId': 'primary', // Use 'primary' for the user's main calendar
'timeMin': (new Date()).toISOString(), // Start from now
'showDeleted': false,
'singleEvents': true,
'maxResults': 10,
'orderBy': 'startTime'
});

Process Response: The call returns a promise that resolves with a JSON object containing the items array, which holds the event data (summary, start time, location, etc.).

Handle Errors: Be prepared to catch common errors such as 401 Unauthorized (if the token expired or was revoked) or 403 Forbidden (if rate limits are hit or the API is not enabled).

Display Data: Iterate through the event items and render them to the user interface.
