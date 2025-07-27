#!/usr/bin/env python
import sys
import json
import os
import requests
from typing import Dict, Any

def call_chatgpt_api(question_data: Dict[str, Any]) -> str:
    """
    Call ChatGPT API to get an explanation for a financial question.
    
    Args:
        question_data: Dictionary containing question information
        
    Returns:
        String response from ChatGPT
    """
    
    # Get API key from environment variable
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return "Error: OPENAI_API_KEY environment variable not set"
    
    # Extract question information
    question_text = question_data.get('text', '')
    justification = question_data.get('justification', '')
    correct_answers = []
    
    # Get correct answers
    for answer in question_data.get('answers', []):
        if answer.get('correct', False):
            correct_answers.append(answer.get('text', ''))
    
    # Build the prompt
    prompt = f"""Jsi odborný lektor financí a finančních trhů. Prosím vysvětli následující otázku z finanční oblasti:

OTÁZKA: {question_text}

SPRÁVNÉ ODPOVĚDI: {', '.join(correct_answers)}

VYSVĚTLENÍ: {justification}

Prosím poskytni:
1. Stručné a jasné vysvětlení tématu
2. Proč je správná odpověď správná
3. Proč jsou ostatní odpovědi nesprávné
4. Praktický příklad nebo souvislost s reálným světem
5. Klíčové pojmy a definice

Odpověď piš v češtině, buď přátelský a srozumitelný pro studenty. Měj na paměti, že toto je pro vzdělávací účely."""

    try:
        # Call OpenAI API
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'system',
                    'content': 'Jsi odborný lektor financí a finančních trhů. Pomáháš studentům pochopit složité finanční koncepty způsobem, který je srozumitelný a praktický.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'max_tokens': 1000,
            'temperature': 0.7
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content']
        else:
            return f"Error: API call failed with status {response.status_code}: {response.text}"
            
    except requests.exceptions.RequestException as e:
        return f"Error: Network request failed: {str(e)}"
    except Exception as e:
        return f"Error: Unexpected error: {str(e)}"

def main():
    """Main function to handle command line input and output."""
    try:
        # Read question data from stdin
        question_data = json.loads(sys.stdin.read())
        
        # Call ChatGPT API
        explanation = call_chatgpt_api(question_data)
        
        # Output the result
        print(explanation)
        
    except json.JSONDecodeError:
        print("Error: Invalid JSON input")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 