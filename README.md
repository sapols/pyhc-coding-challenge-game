# PyHC Challenge Ladder

A coding challenge game where players compete to solve randomly dealt Python in Heliophysics Community (PyHC) coding tasks of increasing difficulty.

# Running the Game

1. `flask run` starts the back-end Python server from `app.py`
2. Players join the game by accessing the front-end at `http://127.0.0.1:5000/`
3. A leaderboard with a 90-minute timer is available at `http://127.0.0.1:5000/leaderboard` 

Note: all game data is ephemeral and the game completely resets each time the Flask server restarts. Team data is stored in-memory via the `teams_data` dict in `app.py`.