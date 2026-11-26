# NOIR Cinema

A web-based cinema booking and movie management system built to provide users with a convenient way to explore movies, select seats, and manage their cinema bookings.

## About the Project

NOIR Cinema is a cinema web application featuring a modern, dark-themed interface. It allows customers to browse currently showing and upcoming movies, view movie information, select seats, and generate booking tickets.

It also includes an administrative dashboard for managing movie listings and cinema content.

## Features

### Customer Features
- Browse Now Showing and Coming Soon movies
- View movie details and descriptions
- Explore available movie selections
- Interactive 3D seat selection
- Book movie tickets
- View generated booking tickets
- User registration and login

### Admin Features
- Admin login
- Add, edit, and delete movies
- Upload and manage movie posters
- Update movie information and screening status
- Hide and display movie listings
- Manage cinema content

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive layout |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | Backend framework and API |
| MongoDB | Movie database |
| Three.js | Interactive 3D seat selection |

## Project Structure

```text
noir-cinema-project-fixed/
│
├── noir-cinema-code/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── uploads/
│   └── posters/
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites
- Node.js
- npm
- MongoDB database
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/noir-cinema.git
```

### 2. Navigate to the Project Folder

```bash
cd noir-cinema
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=noir_cinema
```

Replace the MongoDB connection string with your own credentials.

### 5. Start the Application

```bash
node server.js
```

### 6. Open the Website

Visit:

```text
http://localhost:3000
```

## Database

NOIR Cinema uses MongoDB to store movie information, including:

- Movie title
- Genres
- Duration
- Movie rating
- Screening status
- Poster image path
- Synopsis
- Poster color settings

Movie management operations are handled through the Express API.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check server and database connection |
| GET | `/api/movies` | Retrieve all movies |
| GET | `/api/movies/:id` | Retrieve a specific movie |
| POST | `/api/movies` | Add a movie |
| PUT | `/api/movies/:id` | Update a movie |
| DELETE | `/api/movies/:id` | Delete a movie |
| POST | `/api/movies/:id/poster` | Upload a movie poster |

## Project Status

**Status:** Developed – Local Testing

## Developer

**Lex Panerio**

BSIT – Mobile and Web Application Development

## Disclaimer

This project is developed for educational and academic purposes. Movie titles and related content are used for demonstration purposes.
