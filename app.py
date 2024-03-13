from flask import Flask, jsonify, request, send_from_directory
import json

app = Flask(__name__)

# Load tasks from the JSON file
with open('coding_tasks.json', 'r') as file:
    tasks = json.load(file)

# In-memory data structure for teams' progress, points, hints, and skips
# Example: teams_data = {'team1': {'current_rung': 1, 'points': 0, 'hints': 2, 'skips': 1, 'completed_tasks': [], 'skipped_tasks': []}}
teams_data = {}

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/tasks/<int:rung>', methods=['GET'])
def get_tasks(rung):
    # Assuming rung numbers in the JSON start from 1 (e.g., "Rung_1")
    rung_key = f'Rung_{rung}'
    if rung_key in tasks:
        return jsonify({'rung_tasks': tasks[rung_key]['tasks'], 'rung_points': tasks[rung_key]['points']}), 200
    else:
        return jsonify({'error': 'Rung not found'}), 404

@app.route('/api/submit/<team_id>/<int:task_number>', methods=['POST'])
def submit_task(team_id, task_number):
    # Logic to verify task completion and update team's progress
    # For simplicity, let's assume all task submissions are valid
    # This endpoint would be called after manual verification by a judge.
    # Find the task's rung based on its task_number
    for rung_key, rung_data in tasks.items():
        for task in rung_data['tasks']:
            if task['task_number'] == task_number:
                # Update team data with completed task and points
                if team_id not in teams_data:
                    teams_data[team_id] = {'current_rung': 1, 'points': 0, 'hints': 2, 'skips': 1,
                                           'completed_tasks': [], 'skipped_tasks': []}
                if task_number not in teams_data[team_id]['completed_tasks']:
                    teams_data[team_id]['completed_tasks'].append(task_number)
                    teams_data[team_id]['points'] += rung_data['points']
                    return jsonify({'message': f"Task submitted successfully for {rung_data['points']} point(s).",
                                    'current_points': teams_data[team_id]['points']}), 200
    return jsonify({'error': 'Task not found'}), 404

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
                    return jsonify({'hint': task['hint'], 'hints_left': teams_data[team_id]['hints'], 'teams_data': teams_data}), 200
    print(f"teams_data:\n{teams_data}")  # TODO: DELETE MEE
    return jsonify({'error': 'Hint not available or task not found', 'teams_data': teams_data}), 404

@app.route('/api/skip/<team_id>/<int:task_number>', methods=['POST'])
def skip_task(team_id, task_number):
    # Logic to decrement a team's skip count.
    # Check if the team has skips left and decrement
    if team_id in teams_data and teams_data[team_id]['skips'] > 0:
        teams_data[team_id]['skips'] -= 1
        teams_data[team_id]['skipped_tasks'].append(task_number)
        print(f"teams_data:\n{teams_data}")  # TODO: DELETE MEE
        return jsonify({'message': 'Task skipped.', 'skips_left': teams_data[team_id]['skips']}), 200
    print(f"teams_data:\n{teams_data}")  # TODO: DELETE MEE
    return jsonify({'error': 'No skips left'}), 404

if __name__ == '__main__':
    app.run(debug=True)
