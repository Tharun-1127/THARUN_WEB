const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const DATA_FILE = './data/game_data.json';

router.post('/register', async (req, res) => {
    const { teamName } = req.body;
    const data = await fs.readJson(DATA_FILE);
    
    if (data.teams.find(t => t.name === teamName)) {
        return res.status(400).json({ error: "Team name taken" });
    }

    const newTeam = {
        name: teamName,
        currentStage: 0,
        score: 1000,
        startTime: Date.now(),
        endTime: null,
        hintsUsed: 0
    };

    data.teams.push(newTeam);
    await fs.writeJson(DATA_FILE, data);
    req.session.teamName = teamName;
    res.json({ success: true });
});

router.post('/login', async (req, res) => {
    const { teamName } = req.body;
    const data = await fs.readJson(DATA_FILE);
    
    const team = data.teams.find(t => t.name === teamName);
    if (!team) {
        return res.status(400).json({ error: "Team not found" });
    }

    req.session.teamName = teamName;
    res.json({ success: true });
});

module.exports = router;