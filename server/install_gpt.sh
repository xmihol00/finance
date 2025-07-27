#!/bin/bash

echo "Setting up GPT functionality for the finance app..."

# Check if Python 3 is installed
if ! command -v python &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "Error: pip is not installed. Please install pip first."
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Make the Python script executable
echo "Making GPT explainer script executable..."
chmod +x gpt_explainer.py

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo ""
    echo "⚠️  WARNING: OPENAI_API_KEY environment variable is not set."
    echo "To use the GPT functionality, you need to:"
    echo "1. Get an API key from https://platform.openai.com/api-keys"
    echo "2. Set the environment variable: export OPENAI_API_KEY='your-api-key-here'"
    echo "3. Or add it to your .bashrc or .profile file for persistence"
    echo ""
else
    echo "✅ OPENAI_API_KEY is set."
fi

echo ""
echo "✅ GPT functionality setup complete!"
echo ""
echo "To test the setup, you can run:"
echo "echo '{\"text\":\"test question\",\"answers\":[{\"text\":\"test answer\",\"correct\":true}]}' | python gpt_explainer.py"
echo "" 