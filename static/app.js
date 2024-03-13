let currentTaskNumber = null; // To keep track of the current task
const teamId = 'team1'; // Example team ID, should be dynamically set or retrieved in a real scenario

// Define drawTask globally so it can be accessed by submitTask and skipCurrentTask
function drawTask() {
    const currentTaskDiv = document.getElementById('current-task');
    // Fetch a task from rung 1 as an example
    fetch('/api/tasks/1')
        .then(response => response.json())
        .then(data => {
            // Randomly select a task from the fetched tasks
            const taskIndex = Math.floor(Math.random() * data.length);
            const task = data[taskIndex];
            currentTaskNumber = task.task_number; // Update current task number
            // Display the task with a Submit Task button
            currentTaskDiv.innerHTML = `<h2>${task.title}</h2><p>${task.description}</p><button onclick="submitTask(${task.task_number})">Submit Task</button>`;
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

function submitTask(taskNumber) {
    fetch(`/api/submit/${teamId}/${taskNumber}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            alert(data.message); // Simple feedback to the user
            document.getElementById('team-points').textContent = data.current_points; // Update points displayed
            drawTask(); // Draw a new task automatically
        })
        .catch(error => console.error('Error submitting task:', error));
}

function requestHint(taskNumber) {
    fetch(`/api/hint/${teamId}/${taskNumber}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            alert(`Hint: ${data.hint}`); // Show hint to the user
        })
        .catch(error => console.error('Error requesting hint:', error));
}

function skipCurrentTask() {
    fetch(`/api/skip/${teamId}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            alert(data.message); // Notify the team the task was skipped
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
            // Additional logic to handle the end of the game
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial setup and event listeners
    //drawTask(); // Draw the first task when the page loads

    document.getElementById('draw-task').addEventListener('click', drawTask);
    document.getElementById('get-hint').addEventListener('click', () => {
        if(currentTaskNumber) {
            requestHint(currentTaskNumber);
        }
    });
    document.getElementById('skip-task').addEventListener('click', skipCurrentTask);

    // Timer initialization
    const ninetyMinutes = 60 * 90,
          display = document.querySelector('#time-left');
    startTimer(ninetyMinutes, display);
});
