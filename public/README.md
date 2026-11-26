# NOIR Cinema – Ticketing System (3D seat map)

## Run it
VS Code: right-click `index.html` → Open with Live Server. Or open `index.html` in a browser.

## Customize the site
At the top of `app.js`, `SITE` and `SITE2` control the name shown in the header, browser tab, footer, and generated movie synopsis. They are currently set to `NOIR` and `Cinema`.

## Admin demo login
The starter demo account is `admin@luma.ph` / `admin123`. This legacy login is intentionally retained so existing demo access is not changed by the rebrand. Change it before testing with other people, and do not treat this front-end login as secure.

## Files
`index.html`, `styles.css`, `app.js`, `vendor/three.min.js` (three.js r128), `posters/`

## Important: before public deployment
This is a front-end-only demo. Accounts, bookings, admin changes and uploaded posters are stored in each visitor's own browser (`localStorage`). That means visitors do not share the same movie updates or bookings, and the Admin dashboard cannot see every visitor's bookings.

The admin credentials are shipped in public JavaScript. Anyone who inspects the source can find them and bypass the intended privacy of the Admin page. Hiding the Admin link is not security. Do not use this version for real customer data or a real cinema business. A production version needs server-side authentication, access control and a connected database. The database ZIP contains a schema, but this app is not connected to it yet.

Demo payment only. No real money is charged.
