
const backendURL = 'https://fradoka-goalquiz-backend.hosting.codeyourfuture.io/api/leaderboard';

  const bestScoreElem = document.getElementById('best-score');
  const recentList = document.getElementById('recent-scores');
  const playerSection = document.getElementById('player-section');
  const startQuizBtn = document.getElementById('start-btn');
  const usernameInput = document.getElementById('player-name');
  const statSection = document.getElementById('stats-section');
  const quizSection = document.getElementById('quiz-section');
  const questionText = document.getElementById('question-text');
  const optionsContainer = document.getElementById('options-container');
  const nextBtn = document.getElementById('next-btn');
  const timerElem = document.getElementById('timer');
  const scoreElem = document.getElementById('current-score');

  let questions = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let playerName = '';
  let timer;
  let timeLeft = 15;

function savePlayerScore(username, score) {
    const key = `goalquiz_${username}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    history.push(score);
    history.slice(-5); // keep only last 5 scores
    localStorage.setItem(key, JSON.stringify(history));
}

function getPlayerBestScore(username) {
    const key = `goalquiz_${username}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    return history.length ? Math.max(...history) : 0;
}

function showRecentScores(username) {
    const key = `goalquiz_${username}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    const best = getPlayerBestScore(username);

    bestScoreElem.textContent = `your best score: ${best}`;
    recentList.innerHTML = history
        .map((score, i) => `<li>Game ${i + 1}: ${score} pts</li>`)
        .join('');
}

startQuizBtn.addEventListener('click', async () => {
    playerName = usernameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to start the quiz.');
        return;
    }
    // Start the quiz logic here...
    console.log(`Fetching questions for player: ${playerName}`);
    playerSection.style.display = 'none';
    quizSection.style.display = 'block';
    
    questions = await fetchQuestions();
    console.log('Fetched questions:', questions); 
    currentQuestionIndex = 0;
    score = 0;

    if (questions.length === 0) {
        alert('No questions available. Please try again later.');
        playerSection.style.display = 'block';
        quizSection.style.display = 'none';
        return;
    }

    showQuestion();

});

function showQuestion() {
    clearInterval(timer);
    timeLeft = 15;
    timerElem.textContent = `Time Left: ${timeLeft}s`;
    timerElem.style.color = 'black';

    const currentQuestion = questions[currentQuestionIndex];
    questionText.textContent = currentQuestion.question;

    optionsContainer.innerHTML = "";
    nextBtn.style.display = 'none';

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => handleAnswer(button, currentQuestion.correctAnswer));
        optionsContainer.appendChild(button);
    });

    //start countdown
    timer = setInterval(() => {
        timeLeft--;
        timerElem.textContent = `⏱️ ${timeLeft}s`;
        if (timeLeft <= 5) {
            timerElem.style.color = 'red';
        }
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    const allbtns = document.querySelectorAll('.option-btn');
    allbtns.forEach(btn => btn.disabled = true);

    // Highlight correct answer
    const currentQuestion = questions[currentQuestionIndex];
    allbtns.forEach(btn => {
        if (btn.textContent === currentQuestion.correctAnswer) {
            btn.classList.add('correct');
        }
    });

    nextBtn.style.display = 'inline-block';
}

function handleAnswer(selectedBtn, correctAnswer) {
    clearInterval(timer); // stop timer
    const selected = selectedBtn.textContent;
    const allbtns = document.querySelectorAll('.option-btn');
    allbtns.forEach(btn => btn.disabled = true);

    if (selected === correctAnswer) {
        score++;
        scoreElem.textContent = `Score: ${score}`;
        selectedBtn.classList.add('correct');
    } else {
        selectedBtn.classList.add('wrong');
        // Highlight correct answer
        allbtns.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }

    nextBtn.style.display = 'inline-block';
}

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        endQuiz();
    }
});

function endQuiz() {
    clearInterval(timer); // stop timer

    const bestScore = getPlayerBestScore(playerName);
    savePlayerScore(playerName, score);
    const newBest = Math.max(bestScore, score);

    quizSection.innerHTML = 
    `<h2>Quiz Over!</h2>
    <p>Your Score: <strong>${score}</strong> / ${questions.length}</p>
    <button onclick="location.reload()">Play Again</button>
    <p>Your Best Score: <strong>${newBest}</strong></p>
    <button id="submit-score-btn" class="action-btn">Submit Score to Leaderboard</button>
    <button id="play-again-btn" class="action-btn">Play Again</button>`;

    document.getElementById('submit-score-btn').addEventListener('click', async () => {
        document.getElementById('submit-score-btn').disabled = true;
        await submitScore(playerName, score);
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
        location.reload();
    });
}

async function submitScore(name, score) {
    console.log('Submitting:', { name, score, typeOfScore: typeof score });
    if (!playerName || typeof score !== 'number' || score < 0) {
        alert('Invalid score. Cannot submit.');
        return;
    }

    try {
        const response = await fetch(`${backendURL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score })
        });
        if (!response.ok) {
            throw new Error('Failed to submit score');
        }
        const data = await response.json();
        console.log('Score submitted successfully:', data);
        alert('✅ Score submitted to leaderboard!');
        fetchLeaderboard(); // refresh leaderboard
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('⚠️ Failed to submit score. Please try again later.');
    }
}

async function fetchQuestions (){
    const apiUrl = "https://the-trivia-api.com/v2/questions?tags=soccer&limit=5";
    startQuizBtn.disabled = true;
    startQuizBtn.textContent = 'Loading... ⚽️';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        const questions = data.map(item => ({
            question: item.question.text,
            correctAnswer: item.correctAnswer,
            options: shuffleArray([...item.incorrectAnswers, item.correctAnswer])
        }));

        console.log(questions);
        return questions;
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('⚠️ Failed to load questions. Please try again later.');
        return [];
    } finally {
        startQuizBtn.disabled = false;
        startQuizBtn.textContent = 'Start Quiz';
    }
}

async function fetchLeaderboard () {
    try {
        const response = await fetch(backendURL);
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        renderLeaderboard(data);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        const tbody = document.querySelector('#leaderboard tbody');
        tbody.innerHTML = '<tr><td colspan="3">Failed to load leaderboard.</td></tr>';
    }
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function renderLeaderboard(leaderboard) {
    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = leaderboard
        .slice(0, 5)
        .map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
            </tr>
        `)
        .join('');
}

// Initial fetch of leaderboard on page load
fetchLeaderboard();