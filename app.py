from flask import Flask, jsonify, request, send_from_directory
import json
from random import choice

app = Flask(__name__)

# Load tasks from the JSON file
with open('coding_tasks.json', 'r') as file:
    tasks = json.load(file)

# Example structure for teams_data with current tasks added
# teams_data = {'team1': {'current_rung': 1, 'points': 0, 'hints': 2, 'skips': 1,
#                         'completed_tasks': [], 'skipped_tasks': [], 'current_tasks': {1: None, 2: None, 3: None, 4: None, 5: None}}}
teams_data = {}


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/api/init/<team_id>', methods=['POST'])
def init_team(team_id):
    if team_id not in teams_data:
        teams_data[team_id] = {'current_rung': 1, 'points': 0, 'hints': 2, 'skips': 1,
                               'completed_tasks': [], 'skipped_tasks': [],
                               'current_tasks': {1: None, 2: None, 3: None, 4: None, 5: None}}
        return jsonify({'message': f'Team {team_id} initialized.'}), 200
    return jsonify({'message': f'Team {team_id} already exists.'}), 200


@app.route('/api/tasks/<team_id>/<int:rung>', methods=['GET'])
def get_tasks(team_id, rung):
    if team_id not in teams_data or rung < 1 or rung > 5:
        return jsonify({'error': 'Invalid team ID or rung'}), 400

    team = teams_data[team_id]
    current_task_number = team['current_tasks'][rung]
    # Return the current task if there is one
    if current_task_number:
        for rung_key, rung_data in tasks.items():
            for task in rung_data['tasks']:
                if task['task_number'] == current_task_number:
                    task['points'] = tasks[rung_key]['points']
                    return jsonify(task), 200


    # Otherwise, draw a new task avoiding repeats
    rung_key = f'Rung_{rung}'
    eligible_tasks = [task for task in tasks[rung_key]['tasks']
                      if task['task_number'] not in team['completed_tasks'] + team['skipped_tasks']]

    if not eligible_tasks:
        return jsonify({'error': 'No more tasks available for this rung'}), 404

    new_task = choice(eligible_tasks)
    new_task['points'] = tasks[rung_key]['points']
    teams_data[team_id]['current_tasks'][rung] = new_task['task_number']
    return jsonify(new_task), 200


@app.route('/api/submit/<team_id>/<int:task_number>', methods=['POST'])
def submit_task(team_id, task_number):
    # Logic to verify task completion and update team's progress
    for rung_key, rung_data in tasks.items():
        for task in rung_data['tasks']:
            if task['task_number'] == task_number and task_number not in teams_data[team_id]['completed_tasks']:
                teams_data[team_id]['completed_tasks'].append(task_number)
                teams_data[team_id]['points'] += rung_data['points']
                # Find the rung this task belongs to and reset current task for that rung
                rung_number = int(rung_key.split('_')[1])
                teams_data[team_id]['current_tasks'][rung_number] = None
                return jsonify(
                    {'message': f"Task submitted successfully for {rung_data['points']} point(s).",
                     'current_points': teams_data[team_id]['points']}), 200
    return jsonify({'error': 'Task not found or already submitted'}), 404


@app.route('/api/hint/<team_id>/<int:task_number>', methods=['POST'])
def request_hint(team_id, task_number):
    # Logic to decrement a team's hint count and return the hint
    # Ensure the team exists and has hints left
    if team_id in teams_data and teams_data[team_id]['hints'] > 0:
        # Find the hint for the requested task
        for rung_key, rung_data in tasks.items():
            for task in rung_data['tasks']:
                if task['task_number'] == task_number:
                    teams_data[team_id]['hints'] -= 1
                    print(f"teams_data:\n{teams_data}")  # TODO: DELETE MEE
                    return jsonify({'hint': task['hint'], 'hints_left': teams_data[team_id]['hints']}), 200
    print(f"teams_data:\n{teams_data}")  # TODO: DELETE MEE
    return jsonify({'error': 'Hint not available or task not found'}), 404

@app.route('/api/skip/<team_id>/<int:task_number>', methods=['POST'])
def skip_task(team_id, task_number):
    if team_id in teams_data and teams_data[team_id]['skips'] > 0:
        # Decrement the team's skip count
        teams_data[team_id]['skips'] -= 1
        # Add the skipped task to the skipped_tasks list
        teams_data[team_id]['skipped_tasks'].append(task_number)
        # Find the rung for the skipped task and reset the current task for that rung
        for rung_key, rung_data in tasks.items():
            for task in rung_data['tasks']:
                if task['task_number'] == task_number:
                    rung_number = int(rung_key.split('_')[1])
                    teams_data[team_id]['current_tasks'][rung_number] = None
                    break
        print(f"teams_data:\n{teams_data}")  # TODO: DELETE MEE
        return jsonify({'message': 'Task skipped.', 'skips_left': teams_data[team_id]['skips']}), 200
    print(f"teams_data:\n{teams_data}")  # TODO: DELETE MEE
    return jsonify({'error': 'No skips left'}), 404


if __name__ == '__main__':
    app.run(debug=True)
