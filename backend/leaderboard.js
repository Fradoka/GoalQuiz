import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./leaderboard.json');

export const readLeaderboard = () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading leaderboard:', err);
        return [];
    }
};

export const saveLeaderboard = (leaderboard) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(leaderboard, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving leaderboard:', err);
    }
};

export const addScore = (name, score) => {
    const leaderboard = readLeaderboard();
    const existingIndex = leaderboard.findIndex(entry => entry.name === name);

    if (existingIndex !== -1) {
        // Player exists: only update if new score is higher
        if (score > leaderboard[existingIndex].score) {
            leaderboard[existingIndex].score = score;
        }
    } else {
        // New player
        leaderboard.push({ name, score });
    }

    // keep only last 25 scores
    const limited = leaderboard.slice(0, 25);
    saveLeaderboard(limited);

    return limited;
};