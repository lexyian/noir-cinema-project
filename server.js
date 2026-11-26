
const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'noir_cinema';

const FRONTEND_DIR = path.join(__dirname, 'noir-cinema-code');
const POSTER_DIR = path.join(__dirname, 'uploads', 'posters');
const MAX_POSTER_BYTES = 2 * 1024 * 1024;
const POSTER_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

app.use(express.json({ limit: '4mb' }));

let mongoClient;
let database;

// Check MongoDB connection
app.get('/api/health', async (req, res) => {
    if (!database) {
        return res.status(503).json({
            ok: false,
            message: 'Database is not connected.'
        });
    }

    try {
        await database.command({ ping: 1 });

        res.json({
            ok: true,
            message: 'NOIR Cinema backend is connected to MongoDB.',
            database: database.databaseName
        });
    } catch (error) {
        res.status(503).json({
            ok: false,
            message: error.message
        });
    }
});

// GET all movies
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await database.collection('movies')
            .find({})
            .sort({ _id: 1 })
            .toArray();

        res.json(movies);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve movies.',
            error: error.message
        });
    }
});

// GET one movie
app.get('/api/movies/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const movie = await database.collection('movies').findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : id
        });

        if (!movie) {
            return res.status(404).json({
                message: 'Movie not found.'
            });
        }

        res.json(movie);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// ADD a movie
app.post('/api/movies', async (req, res) => {
    try {
        const movie = { ...req.body };
        delete movie._id;

        let pendingPoster = null;

        if (typeof movie.poster === 'string' && movie.poster.startsWith('data:')) {
            pendingPoster = movie.poster;
            movie.poster = '';
        }

        if (!Object.keys(movie).length) {
            return res.status(400).json({
                message: 'Movie information is required.'
            });
        }

        const result = await database.collection('movies')
            .insertOne(movie);

        let newMovie = await database.collection('movies')
            .findOne({ _id: result.insertedId });

        if (pendingPoster) {
            newMovie = await storePoster(newMovie, pendingPoster);
        }

        res.status(201).json({
            message: 'Movie added successfully.',
            movie: newMovie
        });
    } catch (error) {
        const status = error.status || 500;

        res.status(status).json({
            message: status === 500 ? 'Failed to add movie.' : error.message,
            error: status === 500 ? error.message : undefined
        });
    }
});

// UPDATE a movie
app.put('/api/movies/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const movieId = ObjectId.isValid(id) ? new ObjectId(id) : id;
        const updates = { ...req.body };

        delete updates._id;

        let pendingPoster = null;

        if (Object.prototype.hasOwnProperty.call(updates, 'poster')) {
            const poster = updates.poster;
            delete updates.poster;

            if (poster == null || poster === '') {
                // An edit that does not include a new image must keep the saved poster.
            } else if (typeof poster === 'string' && poster.startsWith('data:')) {
                pendingPoster = poster;
            } else if (typeof poster === 'string' && poster.startsWith('/uploads/posters/')) {
                updates.poster = poster;
            } else {
                return res.status(400).json({
                    message: 'Upload the poster as an image file.'
                });
            }
        }

        if (!Object.keys(updates).length && !pendingPoster) {
            return res.status(400).json({
                message: 'No update information provided.'
            });
        }

        if (Object.keys(updates).length) {
            const result = await database.collection('movies')
                .updateOne(
                    { _id: movieId },
                    { $set: updates }
                );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    message: 'Movie not found.'
                });
            }
        }

        let updatedMovie = await database.collection('movies')
            .findOne({ _id: movieId });

        if (!updatedMovie) {
            return res.status(404).json({
                message: 'Movie not found.'
            });
        }

        if (pendingPoster) {
            updatedMovie = await storePoster(updatedMovie, pendingPoster);
        }

        res.json({
            message: 'Movie updated successfully.',
            movie: updatedMovie
        });
    } catch (error) {
        const status = error.status || 500;

        res.status(status).json({
            message: status === 500 ? 'Failed to update movie.' : error.message,
            error: status === 500 ? error.message : undefined
        });
    }
});

// DELETE a movie
app.delete('/api/movies/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const movieId = ObjectId.isValid(id) ? new ObjectId(id) : id;

        const result = await database.collection('movies')
            .deleteOne({ _id: movieId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Movie not found.'
            });
        }

        await Promise.all(['jpg', 'jpeg', 'png', 'webp', 'gif'].map(ext => (
            fs.rm(path.join(POSTER_DIR, `${String(movieId)}.${ext}`), { force: true })
        )));

        res.json({
            message: 'Movie deleted successfully.'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete movie.',
            error: error.message
        });
    }
});

// Save a poster onto an existing movie. The same movie id is updated in place.
app.post('/api/movies/:id/poster', async (req, res) => {
    try {
        const movie = await database.collection('movies').findOne(movieFilter(req.params.id));

        if (!movie) {
            return res.status(404).json({
                message: 'Movie not found.'
            });
        }

        const updatedMovie = await storePoster(movie, req.body && req.body.image);

        res.json({
            message: 'Poster saved.',
            movie: updatedMovie
        });
    } catch (error) {
        const status = error.status || 500;

        res.status(status).json({
            message: status === 500 ? 'Failed to save poster.' : error.message,
            error: status === 500 ? error.message : undefined
        });
    }
});

app.use('/uploads/posters', express.static(POSTER_DIR, {
    fallthrough: false,
    index: false,
    maxAge: '1h'
}));

// Serve the frontend
app.use(express.static(FRONTEND_DIR));

app.use((error, req, res, next) => {
    if (error && (error.type === 'entity.too.large' || error.status === 413)) {
        return res.status(413).json({
            message: 'Upload is too large. Choose a smaller poster.'
        });
    }

    return next(error);
});

function movieFilter(id) {
    return { _id: ObjectId.isValid(id) ? new ObjectId(id) : id };
}

function parsePoster(image) {
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return { error: 'Poster image data is missing or is not an image.' };
    }

    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(image);

    if (!match) {
        return { error: 'Use a JPG, PNG, WEBP, or GIF poster.' };
    }

    const buffer = Buffer.from(match[2], 'base64');

    if (!buffer.length) {
        return { error: 'Poster image data is empty.' };
    }

    if (buffer.length > MAX_POSTER_BYTES) {
        return { error: 'Poster is too large. Use an image under 2 MB.' };
    }

    if (!hasImageSignature(match[1], buffer)) {
        return { error: 'That file is not a valid image.' };
    }

    return { ext: POSTER_TYPES[match[1]], buffer };
}

function hasImageSignature(type, buffer) {
    if (type === 'image/jpeg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    if (type === 'image/png') {
        return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }

    if (type === 'image/gif') {
        return buffer.subarray(0, 4).toString('ascii') === 'GIF8';
    }

    if (type === 'image/webp') {
        return buffer.length >= 12
            && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
            && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    }

    return false;
}

async function storePoster(movie, image) {
    const parsed = parsePoster(image);

    if (parsed.error) {
        const error = new Error(parsed.error);
        error.status = 400;
        throw error;
    }

    await fs.mkdir(POSTER_DIR, { recursive: true });

    const id = String(movie._id);

    await Promise.all(['jpg', 'jpeg', 'png', 'webp', 'gif'].map(ext => (
        fs.rm(path.join(POSTER_DIR, `${id}.${ext}`), { force: true })
    )));

    const filename = `${id}.${parsed.ext}`;
    await fs.writeFile(path.join(POSTER_DIR, filename), parsed.buffer);

    const poster = `/uploads/posters/${filename}?v=${Date.now()}`;

    await database.collection('movies').updateOne(
        { _id: movie._id },
        { $set: { poster } }
    );

    return database.collection('movies').findOne({ _id: movie._id });
}

// Start server
async function startServer() {
    if (!MONGODB_URI) {
        console.error('Missing MONGODB_URI. Check your .env file.');
        process.exit(1);
    }

    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();

        database = mongoClient.db(DB_NAME);
        await database.command({ ping: 1 });
        await fs.mkdir(POSTER_DIR, { recursive: true });

        console.log(`Connected to MongoDB database: ${DB_NAME}`);

        app.listen(PORT, () => {
            console.log(`NOIR Cinema is running at http://localhost:${PORT}`);
            console.log(`Database test: http://localhost:${PORT}/api/health`);
            console.log(`Movies API: http://localhost:${PORT}/api/movies`);
        });
    } catch (error) {
        console.error('Could not connect to MongoDB.');
        console.error('Details:', error.message);

        if (mongoClient) {
            await mongoClient.close().catch(() => {});
        }

        process.exit(1);
    }
}

// Graceful shutdown
async function shutDown() {
    if (mongoClient) {
        await mongoClient.close().catch(() => {});
    }

    process.exit(0);
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

startServer();
