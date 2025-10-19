// backend/server.js

import express from 'express';
import cors from 'cors';
import { readLeaderboard, addScore } from './leaderboard.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// test route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Get leaderboard >> top 5 by score
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = readLeaderboard();
    const top5 = leaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    res.json(top5);
});

// Post leaderbord >> add new score
app.post('/api/leaderboard', (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    const updatedLeaderboard = addScore(name, score);
    res.status(201).json(updatedLeaderboard.slice(-5).sort((a, b) => b.score - a.score));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});