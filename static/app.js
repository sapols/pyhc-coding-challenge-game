let currentTaskNumber = null; // To keep track of the current task
const teamId = 'team1'; // Example team ID
let currentRung = 1; // Start from rung 1

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
            drawTask(); // Draw a new task automatically
        })
        .catch(error => console.error('Error submitting task:', error));
}

function requestHint(taskNumber) {
    fetch(`/api/hint/${teamId}/${taskNumber}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
//            debugger;
            alert(`Hint: ${data.hint}\nHints left: ${data.hints_left}`); // Show hint to the user
        })
        .catch(error => console.error('Error requesting hint:', error));
}

function skipCurrentTask(taskNumber) {
    fetch(`/api/skip/${teamId}/${taskNumber}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            alert(`${data.message}\nSkips left: ${data.skips_left}`); // Notify the team the task was skipped
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

function updateRungDisplay() {
    const rungDisplay = document.getElementById('current-rung');
    rungDisplay.textContent = `Current Rung: ${currentRung}`;
}

document.addEventListener('DOMContentLoaded', () => {
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
