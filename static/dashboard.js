document.addEventListener("DOMContentLoaded", function() {
// TODO: Sort teams display by points, highest to lowest?
// TODO: Fix back-end bug where current-rung never updates
    const startTimerButton = document.getElementById('start-timer');
    const timerDisplay = document.getElementById('timer');

    // Initialize variables for the timer
    let intervalId;
    const duration = 90 * 60; // 90 minutes in seconds

    // Start timer function adapted from your provided snippet
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
                alert("Time's up! Please submit your final task.");
            }
        }, 1000);
    }

    // Attach the event listener to the start button
    startTimerButton.addEventListener('click', function() {
        // Prevent starting the timer multiple times
        if (!intervalId) {
            startTimer(duration, timerDisplay);
        }
    });

    // Function to poll for team data and update the UI
    function updateTeamData() {
    fetch('/api/all_team_data')
        .then(response => response.json())
        .then(data => {
            const teamsInfoContainer = document.getElementById('teams-info');
            teamsInfoContainer.innerHTML = ''; // Clear the container

            // Convert object to array and sort by points, descending
            const sortedTeams = Object.entries(data).sort((a, b) => {
                const pointsDifference = b[1].points - a[1].points;
                if (pointsDifference === 0) { // If points are equal, sort by team name
                    return a[0].localeCompare(b[0]);
                }
                return pointsDifference;
            });

            // Iterate through each sorted team and display their information
            sortedTeams.forEach(([teamName, teamData]) => {
                const teamDiv = document.createElement('div');
                teamDiv.className = 'team-info'; // For styling, if needed
                teamDiv.innerHTML = `<strong>${teamName}</strong>: Points: ${teamData.points}, Current Rung: ${teamData.current_rung}`;
                teamsInfoContainer.appendChild(teamDiv);
            });
        })
        .catch(error => console.error('Error fetching team data:', error));
    }


    // Set an interval to periodically update team data
    setInterval(updateTeamData, 5000); // Update every 5 seconds
});
