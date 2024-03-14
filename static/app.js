let currentTasks = {1: null, 2: null, 3: null, 4: null, 5: null}; // Tracks the current task number for each rung
let teamId; // Team ID will be set upon page load
let currentRung = 1; // Start from rung 1
let highestUnlockedRung = 1; // Initially, only the first rung is unlocked

// Function to draw a task, modified to use current rung and handle task for specific rung
function drawTask() {
    const currentTaskDiv = document.getElementById('current-task');
    // Check if there's already a task for the current rung
    if (currentTasks[currentRung] !== null) {
        // If so, directly use the task ID stored in currentTasks to fetch and display the task details
        fetch(`/api/tasks/${teamId}/${currentRung}`)
            .then(response => response.json())
            .then(task => {
                // Assuming the backend returns task details directly
                const pointsStr = task.points === 1 ? "1 pt" : `${task.points} pts`;
                currentTaskDiv.innerHTML = `<h2>${task.title} [${pointsStr}]</h2><p>${task.description}</p><button onclick="submitTask(${task.task_number})">Submit Task</button>`;
                updateRungDisplay(); // Update the rung display based on the current rung status
            })
            .catch(error => console.error('Error fetching current task:', error));
    } else {
        // If no current task, request a new task from the server
        fetch(`/api/tasks/${teamId}/${currentRung}`)
            .then(response => response.json())
            .then(task => {
                currentTasks[currentRung] = task.task_number; // Update current task for the rung
                // Display the fetched task details as before
                const pointsStr = task.points === 1 ? "1 pt" : `${task.points} pts`;
                currentTaskDiv.innerHTML = `<h2>${task.title} [${pointsStr}]</h2><p>${task.description}</p><button onclick="submitTask(${task.task_number})">Submit Task</button>`;
                updateRungDisplay(); // Ensure rung display is updated
            })
            .catch(error => console.error('Error fetching new task:', error));
    }
    document.getElementById('draw-task').disabled = true; // Disable the button after the first press
}


// Function to handle task submission, updated for rung management and instructor approval
function submitTask(taskNumber) {
    // Prompt for instructor approval
    let approvalDialog = confirm("Wait for instructor approval...\nIs the solution correct?");

    if (approvalDialog) {
        fetch(`/api/submit/${teamId}/${taskNumber}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                alert(`${data.message}\nTotal points: ${data.current_points}`);
                // Update team points display and reset current task for the current rung
                document.getElementById('team-points').textContent = `Team Points: ${data.current_points}`;
                currentTasks[currentRung] = null; // Clear the current task for the rung upon successful submission
                currentRung = Math.min(currentRung + 1, 5); // Advance to the next rung, max out at 5
                highestUnlockedRung = Math.max(highestUnlockedRung, currentRung); // Update the highest unlocked rung
                drawTask(); // Draw a new task from the next rung
            })
            .catch(error => console.error('Error submitting task:', error));
    } else {
        // If the instructor does not approve, or the user pressed "No", just close the dialog
        // Additional logic can be added here if needed
        console.log("Task submission canceled by instructor.");
    }
}

// Function to request a hint for the current task
function requestHint() {
    if (currentTasks[currentRung] !== null) {
        fetch(`/api/hint/${teamId}/${currentTasks[currentRung]}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.hint) {
                    alert(`Hint: ${data.hint}\nHints left: ${data.hints_left}`);
                    if (data.hints_left === 0) {
                        document.getElementById('get-hint').disabled = true;
                        document.getElementById('get-hint').style.backgroundColor = '#ccc';
                    }
                } else {
                    alert("No hint available for this task :( Complain to Shawn.\n\nNote your hint counter likely still decremented which can break this button...");
                }
            })
            .catch(error => console.error('Error requesting hint:', error));
    } else {
        alert("No task selected to request a hint for.");
    }
}

// Skipping a task, now ensuring it fetches a new task for the current rung
function skipCurrentTask() {
    if (currentTasks[currentRung] !== null) {
        fetch(`/api/skip/${teamId}/${currentTasks[currentRung]}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                alert(`${data.message}\nSkips left: ${data.skips_left}`);
                if (data.skips_left === 0) {
                    document.getElementById('skip-task').disabled = true;
                    document.getElementById('skip-task').style.backgroundColor = '#ccc';
                }
                currentTasks[currentRung] = null; // Reset the current task for the rung after skipping
                drawTask(); // Draw a new task for the current rung
            })
            .catch(error => console.error('Error skipping task:', error));
    }
}

// Timer functionality to count down from 1.5 hours
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
            alert("Time's up! Please submit your final task.");
            // TODO: Additional logic to handle the end of the game
        }
    }, 1000);
}

// Functionality to select a different rung and fetch the task for that rung
function selectRung(selectedRung) {
    if (selectedRung <= highestUnlockedRung) {
        currentRung = selectedRung;
        drawTask(); // Draw task for newly selected rung
    } else {
        alert("This rung is locked. Complete tasks to unlock higher rungs.");
    }
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

// Initialize the game when the document is ready
document.addEventListener('DOMContentLoaded', function promptForTeamName() {
    // Prompt for team name and initialize team data
    teamId = prompt("Please enter your team name (no spaces):", "team1");
    if (teamId) {
        document.getElementById('team-points').textContent = `Team Points: 0`;
        // Initialize or retrieve team data from the backend
        fetch(`/api/init/${teamId}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(error => console.error('Error initializing team:', error));

        // Set event listeners for interactive elements
        document.getElementById('draw-task').addEventListener('click', () => {
            if(currentTasks[currentRung] === null) {
                drawTask();
            } else {
                alert("You already have a task drawn for this rung. Please complete it before drawing a new one.");
            }
        });

        document.getElementById('team-points').textContent = `${teamId} Points: 0`; // Initialize team points with team name
        document.getElementById('get-hint').addEventListener('click', requestHint);
        document.getElementById('skip-task').addEventListener('click', skipCurrentTask);

        updateRungDisplay(); // Update the rung display

        // Start the game timer (90 minutes = 5400 seconds)
        startTimer(5400, document.getElementById('time-left'));
    } else {
        alert("You must enter a team name to start.");
        promptForTeamName(); // Recursively call this function until a team name is entered
    }
});