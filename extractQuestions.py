import json

NUMBER = 2

with open(f'ids_{NUMBER}.txt', 'r') as file:
    ids = file.readlines()

ids = [int(id.strip()) for id in ids]

with open('questions.json', 'r') as file:
    questions = json.load(file)

questions1 = {
    "knowledge": [],
    "skills": []
}

knowledge = questions['knowledge']
for item in knowledge:
    if item['id'] in ids:
        questions1['knowledge'].append(item)

skills = questions['skills']
for item in skills:
    if item['case_id'] in ids:
        questions1['skills'].append(item)

with open(f'questions{NUMBER}.json', 'w') as file:
    json.dump(questions1, file, indent=2)



