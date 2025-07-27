# GPT Integration for Finance Learning App

This document describes the GPT (ChatGPT) integration that allows students to get AI-powered explanations for financial questions.

## Features

- **Ask GPT Button**: Students can click "🤖 Zeptat se GPT" to get AI explanations
- **Automatic Note Creation**: GPT responses are automatically saved as notes
- **Special GPT Notes**: GPT notes are marked with a robot emoji and special styling
- **Contextual Explanations**: GPT receives full question context including correct answers and justifications

## Setup Instructions

### 1. Install Python Dependencies

Run the installation script:
```bash
cd server
./install_gpt.sh
```

This will:
- Install required Python packages (`requests`)
- Make the GPT script executable
- Check for the OpenAI API key

### 2. Set Up OpenAI API Key

You need an OpenAI API key to use this functionality:

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set the environment variable:
   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```
3. For persistence, add it to your `.bashrc` or `.profile`:
   ```bash
   echo "export OPENAI_API_KEY='your-api-key-here'" >> ~/.bashrc
   source ~/.bashrc
   ```

### 3. Test the Setup

Test if everything works:
```bash
echo '{"text":"test question","answers":[{"text":"test answer","correct":true}]}' | python gpt_explainer.py
```

## How It Works

### Frontend (JavaScript)
- Users see a "🤖 Zeptat se GPT" button in the notes section
- Clicking the button sends a request to `notes_api.php` with `action: 'ask_gpt'`
- The button shows a loading state while waiting for the response
- GPT notes are automatically loaded and displayed

### Backend (PHP)
- `notes_api.php` handles the GPT request
- Loads question data from the appropriate JSON file
- Calls the Python script with question data
- Saves the GPT response as a note with special formatting

### Python Script
- `gpt_explainer.py` receives question data via stdin
- Calls OpenAI's ChatGPT API with a specialized prompt
- Returns the explanation via stdout
- Handles errors gracefully

## File Structure

```
server/
├── gpt_explainer.py          # Python script for ChatGPT API calls
├── requirements.txt          # Python dependencies
├── install_gpt.sh           # Installation script
├── notes_api.php            # Modified to handle GPT requests
├── js/script.js             # Modified to add GPT button
├── css/style.css            # Modified for button layout
└── GPT_README.md            # This documentation
```

## GPT Prompt Structure

The AI receives a structured prompt including:
- Question text
- Correct answers
- Original justification
- Instructions for educational response format

The prompt is designed to:
- Provide clear, educational explanations
- Use Czech language
- Include practical examples
- Be student-friendly with emojis
- Explain why answers are correct/incorrect

## Error Handling

- **API Key Missing**: Clear error message about missing environment variable
- **Network Issues**: Graceful handling of API call failures
- **Python Script Errors**: Proper error reporting back to the user
- **Question Not Found**: Validation of question data

## Security Considerations

- API key is stored as environment variable (not in code)
- No sensitive data is sent to GPT beyond the educational content
- All requests are validated server-side
- Rate limiting should be considered for production use

## Customization

### Modifying the GPT Prompt
Edit the `prompt` variable in `gpt_explainer.py` to change how GPT responds.

### Changing the Model
Modify the `model` parameter in the API call to use different GPT models.

### Styling GPT Notes
GPT notes have `isGptNote: true` flag and author "GPT Assistant 🤖" for special styling.

## Troubleshooting

### Common Issues

1. **"Python script not found"**
   - Make sure `gpt_explainer.py` exists and is executable
   - Run `chmod +x gpt_explainer.py`

2. **"OPENAI_API_KEY environment variable not set"**
   - Set the environment variable as described above
   - Restart your web server after setting the variable

3. **"API call failed"**
   - Check your internet connection
   - Verify your API key is valid
   - Check OpenAI API status

4. **"Question not found"**
   - Verify the question exists in the JSON files
   - Check the question ID format

### Debug Mode

To debug the Python script, you can run it directly:
```bash
cd server
python gpt_explainer.py
# Then paste JSON question data and press Ctrl+D
```

## Future Enhancements

- Add rate limiting to prevent API abuse
- Cache common GPT responses
- Add different explanation styles (simple, detailed, etc.)
- Support for multiple languages
- Integration with user learning progress 