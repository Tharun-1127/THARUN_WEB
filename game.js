const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const DATA_FILE = './data/game_data.json';

router.get('/status', async (req, res) => {
    if (!req.session.teamName) return res.status(401).send();
    
    const data = await fs.readJson(DATA_FILE);
    const team = data.teams.find(t => t.name === req.session.teamName);
    
    if (!team) return res.status(404).json({ error: "Team not found" });
    
    // Only apply time-based scoring to teams that haven't finished
    if (!team.endTime) {
        // Apply time-based scoring: lose 1 point per 10 seconds
        const timeElapsed = Math.floor((Date.now() - team.startTime) / 10000); // 10 seconds = 1 point
        const timePenalty = Math.min(timeElapsed, 500); // Max 500 points deduction
        const originalScore = team.score;
        team.score = Math.max(500, 1000 - timePenalty - (team.hintsUsed * 50)); // Minimum 500 points
        
        // Save the updated score
        if (team.score !== originalScore) {
            await fs.writeJson(DATA_FILE, data);
        }
    }
    
    const question = data.questions[team.currentStage];
    if (!question) return res.json({ finished: true, score: team.score });
    
    res.json({ 
        stage: team.currentStage, 
        total: data.questions.length,
        question: question.text,
        score: team.score
    });
});

router.post('/answer', async (req, res) => {
    if (!req.session.teamName) return res.status(401).send();
    
    const { answer } = req.body;
    const data = await fs.readJson(DATA_FILE);
    const team = data.teams.find(t => t.name === req.session.teamName);
    
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.currentStage >= data.questions.length) return res.json({ finished: true, score: team.score });
    
    const question = data.questions[team.currentStage];
    if (!question) return res.status(500).json({ error: "Question not found" });

    // Apply time-based scoring before answering
    const timeElapsed = Math.floor((Date.now() - team.startTime) / 10000);
    const timePenalty = Math.min(timeElapsed, 500);
    team.score = Math.max(500, 1000 - timePenalty - (team.hintsUsed * 50));

    if (answer.toLowerCase().trim() === question.answer.toLowerCase()) {
        team.currentStage++;
        if (team.currentStage >= data.questions.length) {
            team.endTime = Date.now();
            // Completion bonus: +100 points for finishing
            team.score += 100;
        }
        await fs.writeJson(DATA_FILE, data);
        return res.json({ correct: true });
    }
    await fs.writeJson(DATA_FILE, data);
    res.json({ correct: false });
});

router.get('/hint', async (req, res) => {
    if (!req.session.teamName) return res.status(401).send();
    
    const data = await fs.readJson(DATA_FILE);
    const team = data.teams.find(t => t.name === req.session.teamName);
    
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.currentStage >= data.questions.length) return res.json({ finished: true });
    
    const question = data.questions[team.currentStage];
    if (!question) return res.status(500).json({ error: "Question not found" });
    
    // Apply time-based scoring before giving hint
    const timeElapsed = Math.floor((Date.now() - team.startTime) / 10000);
    const timePenalty = Math.min(timeElapsed, 500);
    team.score = Math.max(500, 1000 - timePenalty - (team.hintsUsed * 50));
    
    team.score -= 50; // Hint penalty
    team.hintsUsed++;
    await fs.writeJson(DATA_FILE, data);
    res.json({ hint: question.hint });
});

router.get('/leaderboard', async (req, res) => {
    const data = await fs.readJson(DATA_FILE);
    const sorted = data.teams.sort((a, b) => b.score - a.score);
    res.json(sorted);
});

module.exports = router;
