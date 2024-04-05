document.addEventListener("DOMContentLoaded", function() {
    const startTimerButton = document.getElementById('timer-button');
    const timerDisplay = document.getElementById('timer');

    // Initialize variables for the timer
    let intervalId;
    const duration = 90 * 60; // 90 minutes in seconds
    let timerRunning = false; // Tracks whether the timer is running
    let timeRemaining = duration; // Track the remaining time

    // Starts the game timer
     function startTimer(duration, display) {
        let timer = duration, minutes, seconds;
        intervalId = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(intervalId);
                intervalId = null;
                timerRunning = false;
                alert("Time's up! Thanks for playing.");
                document.getElementById('timer-button').disabled = true;
            }
            timeRemaining = timer; // Update the remaining time
        }, 1000);
    }

    // Pauses the game timer
    function pauseTimer() {
        clearInterval(intervalId);
        intervalId = null;
        timerRunning = false;
        startTimerButton.textContent = 'Start Timer'; // Change button text back to "Start Timer"
    }

    // Attach the event listener to the start/pause button
    startTimerButton.addEventListener('click', function() {
        if (!timerRunning) {
            startTimer(timeRemaining, timerDisplay); // Start or resume from the last timeRemaining
            startTimerButton.textContent = 'Pause Timer'; // Change button text to "Pause Timer"
            timerRunning = true;
        } else {
            pauseTimer(); // Pause the timer if it's running
        }
    });

    // Function to poll for team data and update the UI
    function updateTeamData() {
    fetch('/api/all_team_data')
        .then(response => response.json())
        .then(data => {
            const teamsInfoContainer = document.getElementById('teams-info');
            teamsInfoContainer.innerHTML = ''; // Clear the container

            // Convert object to array and sort by points then rung then name, descending
            const sortedTeams = Object.entries(data).sort((a, b) => {
                // First, sort by points, descending
                const pointsDifference = b[1].points - a[1].points;
                if (pointsDifference !== 0) return pointsDifference;

                // Next, if points are equal, sort by rung, descending
                const rungDifference = b[1].current_rung - a[1].current_rung;
                if (rungDifference !== 0) return rungDifference;

                // Finally, if rungs are also equal, sort by team name, alphabetically
                return a[0].localeCompare(b[0]);
            });

            // Iterate through each sorted team and display their information
            sortedTeams.forEach(([teamName, teamData]) => {
                const teamDiv = document.createElement('div');
                teamDiv.className = 'team-info'; // For styling, if needed
                teamDiv.innerHTML = `<strong>${teamName}</strong>: Points: ${teamData.points}, Rung: ${teamData.current_rung}`;
                teamsInfoContainer.appendChild(teamDiv);
            });
        })
        .catch(error => console.error('Error fetching team data:', error));
    }

    // Set an interval to periodically update team data
    setInterval(updateTeamData, 5000); // Update every 5 seconds
});
