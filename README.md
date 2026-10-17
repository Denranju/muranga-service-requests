# Murang'a County Public Service Request System

A web application for residents of Murang'a County to report service problems
(streetlights, water, garbage collection, roads and similar) and for county staff to
follow each report through to resolution.

Built with React 18 (Vite) and a small Node.js / Express server. **All data is saved in
the file `data/db.json`.**

## Features
- Resident registration with email verification (6-digit code, valid 10 minutes)
- Strong-password rules with a live strength meter, Show/Hide password, and forgot-password reset
- Separate Citizen and Staff/Admin login tabs. Staff sign in with email, personal number and ID number; admins can add more staff
- Request form: category, sub-county, location, description and optional photo
- Status tracking: Pending, In Progress, Resolved, with a dated history for every request
- Queue: residents see their position in line; admins see the whole queue
- Admin dashboard: all complaints, search and filters, CSV export, open vs resolved analytics
- Admin feedback on a request, shown to the resident with a "new feedback" alert
- Language button: English, Kiswahili and Gĩkũyũ (choice is remembered)
- Helpline: 0119706796

## Running the project
Requires Node.js 18 or newer.

    npm install
    npm run dev

Open http://localhost:5173. This starts the server (port 3001) and the web app together.

To run it as one server instead:

    npm start

then open http://localhost:3001.

## Where the data is stored
Everything is kept in `data/db.json`: accounts, requests, feedback, history and login sessions.
The file is created on the first run if it does not exist. Passwords and ID numbers are saved
as salted PBKDF2 hashes, never as plain text. To start fresh, stop the server and delete the
file; it is recreated with the three staff accounts below.

## Accounts
- Staff (Staff / Admin login tab). No password: enter email, personal number and ID number.

  | Personal number | ID number | Email | Role |
  |-----------------|-----------|-------|------|
  | MCG-0001 | 10000001 | admin@muranga.go.ke | County Administrator |
  | MCG-0002 | 10000002 | works@muranga.go.ke | Public Works Officer |
  | MCG-0003 | 10000003 | water@muranga.go.ke | Water and Sanitation Officer |

  These are demo values. A logged-in admin can add more staff under "Staff accounts".
- Residents register their own accounts from the login page.

## Folder layout
    data/db.json         the data file
    server/index.js      Express server: reads and writes data/db.json
    shared/core.js       business rules: accounts, codes, requests, queue, feedback
    public/logo.png      Murang'a County coat of arms
    src/api.js           calls from the web app to the server
    src/config.js        county details, helpline, categories, sub-counties
    src/translations.js  English, Kiswahili and Gĩkũyũ text
    src/i18n.jsx         language provider and language buttons
    src/App.jsx          sign-in state and role-based screens
    src/components/      interface components
    src/styles.css       colours and layout (variables at the top)

## API (all under /api)
| Method and path | Who | Purpose |
|-----------------|-----|---------|
| POST /register/start, /register/verify, /code/resend | public | register with an emailed code |
| POST /reset/request, /reset/complete | public | forgot password |
| POST /login, /staff/login, /logout | public | sign in and out |
| GET /me | signed in | current user |
| GET, POST /requests | signed in | list own (admin: all) / submit (citizen) |
| PATCH /requests/:id/status | admin | change status |
| POST /requests/:id/feedback | admin | send feedback to the resident |
| POST /feedback/read | citizen | mark feedback as read |
| GET, POST /staff | admin | list / add staff |

## Email verification
There is no mail server, so the verification email is shown on screen as a preview. To send
real emails, call an email service from `issueCode()` in `shared/core.js`.

## Changing details
- Helpline and email: src/config.js
- Colours: variables at the top of src/styles.css (taken from the coat of arms)
- Wording and translations: src/translations.js (the Gĩkũyũ text should be reviewed by a native speaker)

## Limitations
A national ID number is not a secret, so staff login by ID number suits a demonstration
only; a live system should use passwords or one-time codes for staff. The data file is
suitable for a single server and small volumes; a live deployment would use a database.
Photos are limited to 500KB.
