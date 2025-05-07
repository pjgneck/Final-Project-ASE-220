// ─────────────────────────────────────────────────────
// Imports & Initial Setup
// ─────────────────────────────────────────────────────
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const Pet = require('./models/pet');
const User = require('./models/user');

const app = express();
const port = 3000;
const uri = "mongodb+srv://groneckp1:testAdmin1234@cluster0.swgwbji.mongodb.net/Posts?retryWrites=true&w=majority&appName=Cluster0";

// ─────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', 'pages');

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(checkUser);

// ─────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────
const handler = (err) => {
    console.log(err.message, err.code);
    let errors = { username: '', password: '' };

    if (err.message === 'Incorrect Username') errors.username = 'Incorrect Username';
    if (err.message === 'Incorrect Password') errors.password = 'Incorrect Password';

    return errors;
};

const maxAge = 3 * 24 * 60 * 60;

const createWebToken = (id) => {
    return jwt.sign({ id }, 'super secret code shhh', { expiresIn: maxAge });
};

// ─────────────────────────────────────────────────────
// Page Routes
// ─────────────────────────────────────────────────────
app.get('/', (req, res) => res.render('index'));

app.get('/overview', requireAuth, async (req, res) => {
    try {
        const pets = await Pet.find();
        res.render('overview', { pets });
    } catch (err) {
        res.status(400).send(err);
    }
});

app.get('/createpost', (req, res) => res.render('createpost'));

app.get('/post/:id/edit', requireAuth, async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(403).send('Pet not found');
        if (req.user.id != pet.createdById) return res.status(403).send('Unauthorized');

        res.render('editPost', { pet, user: req.user });
    } catch (err) {
        res.status(500).send('Unable to reach editPost');
    }
});

app.get('/post/:id/delete', async (req, res) => {
    const pet = await Pet.findById(req.params.id);
    res.render('deletePost', { pet });
});

app.get('/posts/:userId', requireAuth, async (req, res) => {
    try {
        const pets = await Pet.find({ createdById: req.user._id });
        res.render('myPosts', { pets, user: req.user });
    } catch (err) {
        res.status(500).send('Error retrieving your pets');
    }
});

// ─────────────────────────────────────────────────────
// Page POST/PUT/DELETE Actions
// ─────────────────────────────────────────────────────
app.post('/createpost', async (req, res) => {
    try {
        const pet = new Pet(req.body);
        const result = await pet.save();
        res.send(result);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.put('/post/:id/edit', requireAuth, async (req, res) => {
    try {
        await Pet.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            imageLink: req.body.imageLink,
            type: req.body.type,
            gender: req.body.gender,
            age: req.body.age,
            description: req.body.description
        }, { new: true });

        res.status(200).json({ message: 'Post edited' });
    } catch (err) {
        res.status(400).send('Error editing post ' + err);
    }
});

app.post('/post/:id/comments', requireAuth, async (req, res) => {
    const comment = { text: req.body.text, author: req.user.username };

    try {
        await Pet.findByIdAndUpdate(req.params.id, {
            $push: { comments: comment }
        }, { new: true });

        res.redirect("/overview");
    } catch (err) {
        res.status(500).send('Error adding comment');
    }
});

app.delete('/post/:id/delete', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).send('Pet not found');

        await Pet.findByIdAndDelete(req.params.id);
        res.status(200).send('Post deleted');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// ─────────────────────────────────────────────────────
// Auth Routes
// ─────────────────────────────────────────────────────
app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.login(username, password);
        const token = createWebToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    } catch (err) {
        res.status(400).json({ errors: handler(err) });
    }
});

app.get('/signup', (req, res) => res.render('signup'));

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.create({ username, password });
        const token = createWebToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
    } catch (err) {
        res.status(400).send('Error, user not created');
    }
});

app.get('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
});

// ─────────────────────────────────────────────────────
// API Routes - Posts
// ─────────────────────────────────────────────────────
app.get('/api/posts', async (req, res) => {
    try {
        const result = await Pet.find();
        res.send(result);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.get('/api/post/:id', async (req, res) => {
    try {
        const result = await Pet.findById(req.params.id);
        res.send(result);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.post('/api/post', async (req, res) => {
    try {
        const pet = new Pet(req.body);
        const result = await pet.save();
        res.send(result);
    } catch (err) {
        res.status(400).send(err);
    }
});

// ─────────────────────────────────────────────────────
// API Routes - Users
// ─────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
    try {
        const result = await User.find();
        res.send(result);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const result = await User.findById(req.params.id);
        res.send(result);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.post('/api/user', async (req, res) => {
    try {
        const user = new User(req.body);
        const result = await user.save();
        res.send(result);
    } catch (err) {
        res.status(400).send(err);
    }
});

// ─────────────────────────────────────────────────────
// Database Connection & App Start
// ─────────────────────────────────────────────────────
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
        console.log("Connected to MongoDB");
    })
    .catch((err) => console.log(err));
