const express = require('express');
const session = require('express-session');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const DATA_FILE = './data/game_data.json';

// Initialize JSON Database if not exists
if (!fs.existsSync(DATA_FILE)) {
    const initialData = { 
        teams: [], 
        questions: [
            { id: 0, text: "I speak without a mouth and hear without ears. What am I?", answer: "echo", hint: "Sound reflection" },
            { id: 1, text: "The more of me there is, the less you see. What am I?", answer: "darkness", hint: "Opposite of light" }
        ] 
    };
    fs.outputJsonSync(DATA_FILE, initialData);
}

app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'hunt-secret-123',
    resave: false,
    saveUninitialized: true
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
