let currentTasks = {1: null, 2: null, 3: null, 4: null, 5: null}; // Tracks the current task number for each rung
let teamId; // Team ID will be set upon page load
let currentRung = 1; // Start from rung 1
let highestUnlockedRung = 1; // Initially, only the first rung is unlocked (TODO: could be inferred from teamData.current_tasks: the highest rung with a defined task number. If I do that, I believe entering a team name that already exists when first prompted would perfectly restore the state of that team [at present, everything seems restored EXCEPT the highestUnlockedRung since only Rung1 is unlocked...])
let teamData = {}; // Syncs with the back-end `teams_data` (TODO: does this make all other global variables unnecessary except teamId & currentRung? If so, delete them and refactor? Eh... maybe not worth it; could break at least the rung changing/unlocking logic)


// Function to draw a task, modified to use current rung and handle task for specific rung
function drawTask() {
    const currentTaskDiv = document.getElementById('current-task');
    // Check if there's already a task for the current rung
    if (currentTasks[currentRung] !== null) {
        // If so, directly use the task ID stored in currentTasks to fetch and display the task details
        fetch(`/api/tasks/${teamId}/${currentRung}`)
            .then(response => response.json())
            .then(task => {
                if (task.error) { // Check if an error message was returned instead of task details
                    currentTaskDiv.innerHTML = `<h2>No tasks left in this rung!</h2>`;
                    document.getElementById('draw-task').disabled = true; // Optionally disable drawing a new task for this rung
                } else {
                    // Assuming the backend returns task details directly
                    const pointsStr = task.points === 1 ? "1 pt" : `${task.points} pts`;
                    currentTaskDiv.innerHTML = `<span class="task-points">${pointsStr}</span><h2>${task.title}</h2><p>${task.description}</p>`;
                }
                updateRungDisplay(); // Update the rung display based on the current rung status
            })
            .catch(error => {
                console.error('Error fetching current task:', error);
                currentTaskDiv.innerHTML = `<h2>Error fetching tasks. Please try again later.</h2>`;
            });
    } else {
        // If no current task, request a new task from the server
        fetch(`/api/tasks/${teamId}/${currentRung}`)
            .then(response => response.json())
            .then(task => {
                if (task.error) { // Handle case when no more tasks are available for this rung
                    currentTaskDiv.innerHTML = `<h2>No tasks left in this rung!</h2>`;
                    document.getElementById('draw-task').disabled = true; // Optionally disable drawing a new task for this rung
                } else {
                    currentTasks[currentRung] = task.task_number; // Update current task for the rung
                    // Display the fetched task details
                    const pointsStr = task.points === 1 ? "1 pt" : `${task.points} pts`;
                    currentTaskDiv.innerHTML = `<span class="task-points">${pointsStr}</span><h2>${task.title}</h2><p>${task.description}</p>`;
                }
                updateRungDisplay(); // Ensure rung display is updated
            })
            .catch(error => {
                console.error('Error fetching new task:', error);
                currentTaskDiv.innerHTML = `<h2>Error fetching tasks. Please try again later.</h2>`;
            });
    }
    document.getElementById('draw-task').style.display = 'none'; // Remove the button after the first press
    document.getElementById('submit-task').style.display = 'block'; // Show the "Submit Task" button after the first press
    document.getElementById('current-task').style.display = 'block'; // Show the current task div after the first press
    syncTeamData();
    saveGameState();
}


// Function to handle task submission, updated for rung management and instructor approval with passcode verification
function submitTask(taskNumber) {
    // Prompt for instructor approval
    let approvalDialog = confirm("Wait for instructor approval...\nIs the solution correct?");

    if (approvalDialog) {
        // Prompt for the passcode
        let passcode = prompt("Enter instructor's 4-digit passcode:");

        // Verify the passcode with the backend
        fetch(`/api/verify_passcode/${passcode}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.valid) {
                    // Proceed with submitting the task because passcode was valid
                    fetch(`/api/submit/${teamId}/${taskNumber}`, { method: 'POST' })
                        .then(response => response.json())
                        .then(data => {
                            alert(`${data.message}`);
                            // Update team points display and reset current task for the current rung
                            document.getElementById('team-points').innerHTML = `${teamId} Points: <b>${data.current_points}</b>`;
                            currentTasks[currentRung] = null; // Clear the current task for the rung upon successful submission
                            currentRung = Math.min(currentRung + 1, 5); // Advance to the next rung, max out at 5
                            highestUnlockedRung = Math.max(highestUnlockedRung, currentRung); // Update the highest unlocked rung
                            updateBackendRung();
                            drawTask(); // Draw a new task from the next rung
                        })
                        .catch(error => console.error('Error submitting task:', error));
                } else {
                    // Handle invalid passcode
                    alert("Invalid passcode. Submission canceled.");
                }
            })
            .catch(error => console.error('Error verifying passcode:', error));
    } else {
        // If the instructor does not approve, or the user pressed "No", just close the dialog
        // Additional logic can be added here if needed
        console.log("Task submission canceled by instructor.");
    }
    syncTeamData();
    saveGameState();
}


// Function to request a hint for the current task
function requestHint() {
    if (currentTasks[currentRung] !== null) {
        // Check if the hint is already displayed
        const existingHint = document.querySelector('.hint');
        if (!existingHint) { // Only proceed if no hint is currently displayed
            fetch(`/api/hint/${teamId}/${currentTasks[currentRung]}`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.hint) {
                        // Select the current task div
                        const currentTaskDiv = document.getElementById('current-task');
                        // Create a new paragraph element for the hint
                        const hintPara = document.createElement('p');
                        hintPara.className = 'hint'; // Assign a class to the hint paragraph
                        hintPara.innerHTML = `Hint: ${data.hint}`; // Use innerHTML in case you want to include HTML formatting in the future
                        currentTaskDiv.appendChild(hintPara); // Append the hint paragraph to the current task div

                        // Display hints left (Use setTimeout to let hint text display before showing the alert)
                        setTimeout(() => {
                            alert(`Hints left: ${data.hints_left}`);
                        }, 20); // A delay of 10 milliseconds is usually enough to allow the DOM update to render

                        // Disable the get hint button if no hints are left
                        if (data.hints_left === 0) {
                            document.getElementById('get-hint').disabled = true;
                            document.getElementById('get-hint').style.backgroundColor = '#ccc';
                        }
                    } else {
                        // Handle the case where no hint is available
                        alert("No hint available for this task. Note your hint counter likely still decremented which can break this button...");
                    }
                })
                .catch(error => console.error('Error requesting hint:', error));
        } else {
            alert("Hint already displayed.");
        }
    } else {
        // If no current task is selected to request a hint for
        alert("No task selected to request a hint for.");
    }
    syncTeamData();
    saveGameState();
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
    } else {
        // If no current task is selected to skip
        alert("No task selected to skip.");
    }
    syncTeamData();
    saveGameState();
}


function syncTeamData() {
    fetch(`/api/team_data/${teamId}`)
        .then(response => response.json())
        .then(data => {
            // Update the global teamData variable
            teamData = data;

            // Update points
            document.getElementById('team-points').innerHTML = `${teamId} Points: <b>${data.points}</b>`;

            // Update the button texts with the current number of hints and skips
            document.getElementById('get-hint').textContent = `Get Hint (${data.hints})`;
            document.getElementById('skip-task').textContent = `Skip Task (${data.skips})`;

            // Optionally, disable the buttons if no hints or skips are left
            if (data.hints <= 0) {
                document.getElementById('get-hint').disabled = true;
            }
            if (data.skips <= 0) {
                document.getElementById('skip-task').disabled = true;
            }
        })
        .catch(error => console.error('Error syncing team data:', error));
}


// Functionality to select a different rung and fetch the task for that rung
function selectRung(selectedRung) {
    if (selectedRung <= highestUnlockedRung) {
        currentRung = selectedRung;
        updateBackendRung();
        drawTask(); // Draw task for newly selected rung
    } else {
        alert("This rung is locked. Complete tasks to unlock higher rungs.");
    }
    //syncTeamData();
    saveGameState();
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
    //syncTeamData();
    saveGameState();
}


function updateBackendRung() {
    fetch(`/api/update_rung/${teamId}/${currentRung}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log(data.message);
            } else if (data.error) {
                console.error(data.error);
            }
        })
        .catch(error => console.error('Error updating current rung in backend:', error));
}


function saveGameState() {
    const gameState = {
        teamId,
        currentTasks,
        currentRung,
        highestUnlockedRung,
        teamData
    };
    sessionStorage.setItem('pyhcGameState', JSON.stringify(gameState));
}


function loadGameState() {
    const savedState = sessionStorage.getItem('pyhcGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        teamId = gameState.teamId;
        currentTasks = gameState.currentTasks;
        currentRung = gameState.currentRung;
        highestUnlockedRung = gameState.highestUnlockedRung;
        teamData = gameState.teamData;

        // Ensure the UI is updated to reflect the loaded state
        syncTeamData();
        updateRungDisplay();
        if(currentTasks[currentRung] !== null) {
            drawTask();
        }
    }
}


document.addEventListener('DOMContentLoaded', function initializeOrLoadGame() {
    function promptForTeamName() {
        // Prompt for team name and initialize team data
        teamId = prompt("Please enter your team name:", "Team1");
        if (teamId) {
            // Initialize or retrieve team data from the backend
            fetch(`/api/init/${teamId}`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                    // After successfully initializing, save the initial state
                    saveGameState();
                    // Continue with setting up UI and event listeners
                    setupGame();
                })
                .catch(error => console.error('Error initializing team:', error));
        } else {
            alert("You must enter a team name to start.");
            promptForTeamName(); // Recursively call this function until a team name is entered
        }
    }

    function setupGame() {
        // Set event listeners for interactive elements
        document.getElementById('draw-task').addEventListener('click', () => {
            if(currentTasks[currentRung] === null) {
                drawTask();
            } else {
                alert("You already have a task drawn for this rung. Please complete it before drawing a new one.");
            }
        });

        document.getElementById('team-points').innerHTML = `${teamId} Points: <b>0</b>`; // Initialize team points with team name
        document.getElementById('get-hint').addEventListener('click', requestHint);
        document.getElementById('skip-task').addEventListener('click', skipCurrentTask);

        updateRungDisplay(); // Update the rung display
    }

    // Check if there is saved game state in sessionStorage
    if (sessionStorage.getItem('pyhcGameState') !== null) {
        loadGameState(); // If so, load the game state
        setupGame(); // Setup the game after loading the state
    } else {
        promptForTeamName(); // Otherwise, start by prompting for a team name
    }
    syncTeamData();
});