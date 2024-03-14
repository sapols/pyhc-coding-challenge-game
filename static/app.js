let currentTaskNumber = null; // To keep track of the current task
let teamId; // Initialize without a value because it gets set on page load
let currentRung = 1; // Start from rung 1
let highestUnlockedRung = 1; // Initialize with the first rung unlocked

// Define drawTask in the global scope
function drawTask() {
    const currentTaskDiv = document.getElementById('current-task');
    // Fetch tasks from the current rung
    fetch(`/api/tasks/${currentRung}`)
        .then(response => response.json())
        .then(data => {
            // Randomly select a task from the fetched tasks
            const taskIndex = Math.floor(Math.random() * data.rung_tasks.length);
            const task = data.rung_tasks[taskIndex];
            currentTaskNumber = task.task_number; // Update current task number
            points = data.rung_points
            pointsStr = points === 1 ? "1 pt" : `${points} pts`
            // Display the task with a Submit Task button
            currentTaskDiv.innerHTML = `<h2>${task.title} [${pointsStr}]</h2><p>${task.description}</p><button onclick="submitTask(${task.task_number})">Submit Task</button>`;
            updateRungDisplay(); // Update the rung display
            document.getElementById('draw-task').disabled = true; // Disable button after first press
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

function submitTask(taskNumber) {
    fetch(`/api/submit/${teamId}/${taskNumber}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            alert(`${data.message}\nTotal points: ${data.current_points}`); // Simple feedback to the user
            document.getElementById('team-points').textContent = `${teamId} Points: ${data.current_points}`; // Update points displayed with team name
            currentRung = Math.min(currentRung + 1, 5); // Advance to the next rung, max out at 5
            highestUnlockedRung = Math.max(highestUnlockedRung, currentRung); // Update the highest unlocked rung
            drawTask(); // Draw a new task automatically
            updateRungDisplay(); // Update the display
        })
        .catch(error => console.error('Error submitting task:', error));
}

function requestHint(taskNumber) {
    fetch(`/api/hint/${teamId}/${taskNumber}`, { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        if(data.hints_left !== undefined) {
            alert(`Hint: ${data.hint}\nHints left: ${data.hints_left}`); // Show hint to the user
            if (data.hints_left === 0) {
                document.getElementById('get-hint').disabled = true;
                document.getElementById('get-hint').style.backgroundColor = '#ccc';
            }
        }
    })
    .catch(error => console.error('Error requesting hint:', error));
}

function skipCurrentTask(taskNumber) {
    fetch(`/api/skip/${teamId}/${taskNumber}`, { method: 'POST' }) // Note: Ensure currentTaskNumber is correctly assigned when drawing a task
    .then(response => response.json())
    .then(data => {
        alert(`${data.message}\nSkips left: ${data.skips_left}`); // Notify the team the task was skipped
        if (data.skips_left === 0) {
            document.getElementById('skip-task').disabled = true;
            document.getElementById('skip-task').style.backgroundColor = '#ccc';
        }
        drawTask(); // Automatically draw a new task
    })
    .catch(error => console.error('Error skipping task:', error));
}

function startTimer(duration, display) {
    let timer = duration, minutes, seconds;
    const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(interval);
            alert("Time's up!");
            // TODO: Additional logic to handle the end of the game
        }
    }, 1000);
}

function selectRung(rung) {
    currentRung = rung;
    drawTask();
    updateRungDisplay();
}

function updateRungDisplay() {
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`rung-${i}`);
        btn.disabled = i > highestUnlockedRung || i === currentRung;
        btn.classList.toggle('active', i === currentRung);
        // Remove previously set special class for the active button to reset state
        btn.classList.remove('active-disabled');
        // If the button is the current rung and it's disabled, add a specific class
        if(i === currentRung && btn.disabled) {
            btn.classList.add('active-disabled');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const teamName = prompt("Please enter your team name (no spaces):", "team1");
    if (teamName != null && teamName !== "") {
        teamId = teamName; // Set the global teamId with the entered team name
        // Fetch to initialize the team data or check if the team is already initialized
        fetch(`/api/init/${teamId}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error initializing team:', error));
    }

    document.getElementById('team-points').textContent = `${teamId} Points: 0`; // Initialize team points with team name
    document.getElementById('draw-task').addEventListener('click', drawTask);
    document.getElementById('get-hint').addEventListener('click', () => {
        if(currentTaskNumber) {
            requestHint(currentTaskNumber);
        }
    });
    document.getElementById('skip-task').addEventListener('click', () => {
        if(currentTaskNumber) {
            skipCurrentTask(currentTaskNumber);
        }
    });
    updateRungDisplay(); // Update the rung display

    // Timer initialization
    const ninetyMinutes = 60 * 90,
        display = document.querySelector('#time-left');
    startTimer(ninetyMinutes, display);
});
