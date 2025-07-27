# 🤖 GPT Functionality Re-Enable Guide

This guide explains how to re-enable the GPT functionality when you have OpenAI API quota available.

## 📋 **Current Status**

✅ **GPT functionality is currently DISABLED**  
✅ **All files are preserved and ready for re-enabling**  
✅ **No data loss - everything is just commented out**

## 🔧 **Files Modified for Disabling**

The following files were modified to disable GPT functionality:

1. **`server/js/script.js`** - GPT button and event listeners commented out
2. **All other files remain unchanged** - Python scripts, PHP API, etc. are intact

## 🚀 **How to Re-Enable GPT Functionality**

### Step 1: Uncomment the GPT Button

**File**: `server/js/script.js`  
**Location**: Around line 365-370

**Find this code:**
```javascript
<div class="notes-buttons">
    <button class="btn btn-small add-note-btn">Přidat poznámku</button>
    <!-- GPT button temporarily disabled
    <button class="btn btn-small ask-gpt-btn">🤖 Zeptat se GPT</button>
    -->
</div>
```

**Change it to:**
```javascript
<div class="notes-buttons">
    <button class="btn btn-small add-note-btn">Přidat poznámku</button>
    <button class="btn btn-small ask-gpt-btn">🤖 Zeptat se GPT</button>
</div>
```

### Step 2: Uncomment the GPT Event Listener

**File**: `server/js/script.js`  
**Location**: Around line 570-590

**Find this code:**
```javascript
// Notes functionality
const addNoteBtn = questionElement.querySelector('.add-note-btn');
// const askGptBtn = questionElement.querySelector('.ask-gpt-btn'); // GPT temporarily disabled
const addNoteForm = questionElement.querySelector('.add-note-form');
// ... other variables

// GPT functionality temporarily disabled
/*
askGptBtn.addEventListener('click', function() {
    // Disable button and show loading state
    askGptBtn.disabled = true;
    askGptBtn.textContent = '🤖 Načítám...';
    
    askGpt(question.id, questionElement, askGptBtn);
});
*/
```

**Change it to:**
```javascript
// Notes functionality
const addNoteBtn = questionElement.querySelector('.add-note-btn');
const askGptBtn = questionElement.querySelector('.ask-gpt-btn');
const addNoteForm = questionElement.querySelector('.add-note-form');
// ... other variables

askGptBtn.addEventListener('click', function() {
    // Disable button and show loading state
    askGptBtn.disabled = true;
    askGptBtn.textContent = '🤖 Načítám...';
    
    askGpt(question.id, questionElement, askGptBtn);
});
```

### Step 3: Uncomment the askGpt Function

**File**: `server/js/script.js`  
**Location**: Around line 820-860

**Find this code:**
```javascript
// GPT functionality temporarily disabled
/*
function askGpt(questionId, questionElement, gptBtn) {
    // ... function code ...
}
*/
```

**Change it to:**
```javascript
function askGpt(questionId, questionElement, gptBtn) {
    // ... function code ...
}
```

## 🔑 **API Key Setup (if needed)**

If you need to set up the API key again:

### Option 1: Use the setup script
```bash
cd server
./setup_api_key.sh
```

### Option 2: Manual setup
```bash
export OPENAI_API_KEY='your-api-key-here'
echo "export OPENAI_API_KEY='your-api-key-here'" >> ~/.bashrc
source ~/.bashrc
```

## 🧪 **Testing After Re-Enabling**

### 1. Test the Setup
```bash
cd server
php test_gpt_setup.php
```

### 2. Test with Real Question
```bash
php test_real_question.php
```

### 3. Test Web Interface
- Open `test_gpt_web.html` in your browser
- Click "Test GPT Request" button

### 4. Test in Main Application
- Go to `questions.php`
- Answer a question
- Look for "🤖 Zeptat se GPT" button in notes section
- Click the button to test

## ✅ **Verification Checklist**

After re-enabling, verify:

- [ ] GPT button appears in notes section after answering questions
- [ ] Button shows loading state when clicked
- [ ] API calls work without quota errors
- [ ] GPT responses are saved as notes
- [ ] GPT notes have special styling (blue border)

## 🚨 **Common Issues & Solutions**

### Issue: "GPT button not visible"
**Solution**: Make sure you've answered a question first - the notes section only appears after submitting an answer.

### Issue: "API quota exceeded"
**Solution**: Check your OpenAI account billing and quota status.

### Issue: "Python script not found"
**Solution**: Run the installation script:
```bash
cd server
./install_gpt.sh
```

### Issue: "API key not set"
**Solution**: Set the environment variable:
```bash
export OPENAI_API_KEY='your-api-key-here'
```

## 📁 **Files That Remain Unchanged**

These files are still fully functional and don't need modification:

- `gpt_explainer.py` - Python script for ChatGPT API
- `requirements.txt` - Python dependencies
- `notes_api.php` - PHP API with GPT handling
- `install_gpt.sh` - Installation script
- `setup_api_key.sh` - API key setup script
- `test_*.php` - Test scripts
- `GPT_README.md` - Original documentation

## 🎯 **Quick Re-Enable Command**

If you want to quickly re-enable everything, you can use these search and replace commands:

```bash
cd server
sed -i 's/<!-- GPT button temporarily disabled/<!-- GPT button temporarily disabled (ENABLED)/g' js/script.js
sed -i 's/<!-- GPT button temporarily disabled (ENABLED)/<!-- GPT button temporarily disabled/g' js/script.js
sed -i 's/<!-- GPT button temporarily disabled (ENABLED)/<!-- GPT button temporarily disabled/g' js/script.js
```

## 📞 **Support**

If you encounter any issues:

1. Check the `GPT_README.md` file for detailed documentation
2. Run the test scripts to verify setup
3. Check browser console for JavaScript errors
4. Verify API key is set correctly

---

**Note**: The GPT functionality is designed to be easily re-enabled. All the infrastructure is in place - you just need to uncomment the code sections above! 🚀 