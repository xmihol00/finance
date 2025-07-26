document.addEventListener('DOMContentLoaded', function() {
    const questionsContainer = document.getElementById('questions-container');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const sortWrongBtn = document.getElementById('sort-wrong-btn');
    const answeredCountEl = document.getElementById('answered-count');
    
    // User dropdown functionality
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuToggle.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }
    
    let sortedQuestions = [];
    
    // Initialize
    initializeQuestions();
    
    // Event listeners
    shuffleBtn.addEventListener('click', function() {
        shuffleQuestions();
        renderQuestions();
    });
    
    sortWrongBtn.addEventListener('click', function() {
        sortByWrongAnswers();
        renderQuestions();
    });
    
    // Functions
    function initializeQuestions() {
        if (practiceMode === 'knowledge') {
            sortedQuestions = prioritizeQuestions(allQuestions);
        } else {
            // For skills mode, flatten all questions from case studies
            sortedQuestions = [];
            allSkills.forEach(skillCase => {
                skillCase.questions.forEach(question => {
                    sortedQuestions.push(question);
                });
            });
            sortedQuestions = prioritizeQuestions(sortedQuestions);
        }
        renderQuestions();
        updateStats();
    }
    
    function prioritizeQuestions(questions) {
        // Clone questions to avoid modifying the original
        const questionsCopy = JSON.parse(JSON.stringify(questions));
        
        // Calculate priority score for each question
        questionsCopy.forEach(question => {
            let priorityScore = 10; // Base score
            
            // Get user's answer history for this question
            const answerHistory = userAnswers[question.id];
            
            if (!answerHistory) {
                // Questions with no answers get highest priority
                priorityScore = 100;
            } else {
                const correct = answerHistory.correct || 0;
                const incorrect = answerHistory.incorrect || 0;
                const total = correct + incorrect;
                
                if (total > 0) {
                    // Questions with more wrong answers get higher priority
                    const errorRate = incorrect / total;
                    priorityScore = 50 + (errorRate * 50);
                    
                    // Gradually decrease priority for frequently answered questions
                    priorityScore -= Math.min(total * 2, 30);
                }
            }
            
            question.priorityScore = priorityScore;
        });
        
        // Sort by priority score (highest first)
        return questionsCopy.sort((a, b) => b.priorityScore - a.priorityScore);
    }
    
    function shuffleQuestions() {
        if (practiceMode === 'knowledge') {
            // Create a weighted array for shuffling knowledge questions
            const weightedQuestions = [];
            
            allQuestions.forEach(question => {
                const answerHistory = userAnswers[question.id] || { correct: 0, incorrect: 0 };
                const correct = answerHistory.correct || 0;
                const incorrect = answerHistory.incorrect || 0;
                
                // Calculate weight: base weight + incorrect answers - correct answers
                // This gives higher weight to questions with more wrong answers
                let weight = 10; // Base weight for questions with no history
                weight += incorrect * 5; // Each incorrect answer adds 5 to weight
                weight -= correct * 2; // Each correct answer subtracts 2 from weight
                weight = Math.max(1, weight); // Ensure minimum weight of 1
                
                // Add question multiple times based on weight (higher weight = more copies)
                for (let i = 0; i < weight; i++) {
                    weightedQuestions.push(question);
                }
            });
            
            // Shuffle the weighted array
            for (let i = weightedQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [weightedQuestions[i], weightedQuestions[j]] = [weightedQuestions[j], weightedQuestions[i]];
            }
            
            // Remove duplicates while preserving order (questions with higher weight appear first)
            const seen = new Set();
            sortedQuestions = weightedQuestions.filter(question => {
                if (seen.has(question.id)) {
                    return false;
                }
                seen.add(question.id);
                return true;
            });
        } else {
            // For skills mode, shuffle the case studies
            sortedQuestions = [];
            const shuffledSkills = [...allSkills].sort(() => Math.random() - 0.5);
            shuffledSkills.forEach(skillCase => {
                skillCase.questions.forEach(question => {
                    sortedQuestions.push(question);
                });
            });
        }
    }
    
    function sortByWrongAnswers() {
        if (practiceMode === 'knowledge') {
            // Sort knowledge questions by number of wrong answers (descending)
            sortedQuestions = allQuestions.slice().sort((a, b) => {
                const aHistory = userAnswers[a.id] || { correct: 0, incorrect: 0 };
                const bHistory = userAnswers[b.id] || { correct: 0, incorrect: 0 };
                
                const aWrong = aHistory.incorrect || 0;
                const bWrong = bHistory.incorrect || 0;
                
                // First sort by wrong answers (descending)
                if (aWrong !== bWrong) {
                    return bWrong - aWrong;
                }
                
                // If wrong answers are equal, sort by correct answers (ascending)
                const aCorrect = aHistory.correct || 0;
                const bCorrect = bHistory.correct || 0;
                return aCorrect - bCorrect;
            });
        } else {
            // For skills mode, sort case studies by wrong answers
            sortedQuestions = [];
            const sortedSkills = [...allSkills].sort((a, b) => {
                let aWrong = 0;
                let bWrong = 0;
                
                a.questions.forEach(q => {
                    const history = userAnswers[q.id] || { correct: 0, incorrect: 0 };
                    aWrong += history.incorrect || 0;
                });
                
                b.questions.forEach(q => {
                    const history = userAnswers[q.id] || { correct: 0, incorrect: 0 };
                    bWrong += history.incorrect || 0;
                });
                
                return bWrong - aWrong;
            });
            
            sortedSkills.forEach(skillCase => {
                skillCase.questions.forEach(question => {
                    sortedQuestions.push(question);
                });
            });
        }
    }
    
    function renderQuestions() {
        questionsContainer.innerHTML = '';
        
        if (practiceMode === 'knowledge') {
            // Render standalone questions for knowledge mode
            sortedQuestions.forEach(question => {
                renderSingleQuestion(question, questionsContainer);
            });
        } else {
            // Render case studies (skills) for skills mode
            allSkills.forEach(skillCase => {
                const caseDiv = document.createElement('div');
                caseDiv.className = 'case-study';
                caseDiv.innerHTML = `
                    <div class="case-description">
                        <strong>Případová studie:</strong> ${skillCase.case_description}
                    </div>
                `;
                // Render each question in the case
                skillCase.questions.forEach(question => {
                    renderSingleQuestion(question, caseDiv, skillCase.case_id);
                });
                questionsContainer.appendChild(caseDiv);
            });
        }
    }

    function renderSingleQuestion(question, parent, caseId) {
        const answerHistory = userAnswers[question.id] || { correct: 0, incorrect: 0 };
        const totalAnswers = answerHistory.correct + answerHistory.incorrect;
        const correctPercentage = totalAnswers > 0 
            ? Math.round((answerHistory.correct / totalAnswers) * 100) 
            : 0;
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-card';
        questionElement.dataset.id = question.id;
        if (caseId) questionElement.dataset.caseId = caseId;
        
        // Add status class based on answer history
        if (totalAnswers === 0) {
            questionElement.classList.add('new');
        } else if (answerHistory.correct > answerHistory.incorrect) {
            questionElement.classList.add('mostly-correct');
        } else {
            questionElement.classList.add('needs-practice');
        }
        
        // Determine if this is a multiple choice question
        const correctAnswers = question.answers.filter(answer => answer.correct);
        const isMultipleChoice = correctAnswers.length > 1;
        
        // Generate answer options HTML
        const answersHtml = question.answers.map((answer, index) => {
            const inputType = isMultipleChoice ? 'checkbox' : 'radio';
            const name = isMultipleChoice ? `question-${question.id}` : `question-${question.id}`;
            const value = answer.id;
            
            return `
                <div class="answer-option">
                    <input type="${inputType}" 
                           id="answer-${question.id}-${answer.id}" 
                           name="${name}" 
                           value="${value}"
                           class="answer-input">
                    <label class="answer-label">
                        ${answer.text}
                    </label>
                </div>
            `;
        }).join('');
        
        questionElement.innerHTML = `
            <div class="question-header">
                <div class="question-id">#${question.id} <span class="question-type">${isMultipleChoice ? 'Více možností' : 'Jedna možnost'}</span></div>
                <div class="question-stats">
                    <span class="correct-count">${answerHistory.correct}</span> / 
                    <span class="incorrect-count">${answerHistory.incorrect}</span>
                    ${totalAnswers > 0 ? `<span class="percentage">(${correctPercentage}% správně)</span>` : ''}
                </div>
            </div>
            <div class="question-content">
                <div class="question-text">${question.text}</div>
                <div class="answers-container">
                    ${answersHtml}
                </div>
                <div class="question-justification hidden">${question.justification}</div>
            </div>
                            <div class="question-actions">
                    <button class="btn submit-answer-btn">Odeslat odpověď</button>
                    <div class="result-feedback hidden">
                        <div class="result-message"></div>
                        <div class="feedback-buttons">
                            <button class="btn show-justification-btn">Zobrazit vysvětlení</button>
                            <button class="btn try-again-btn">Zkusit znovu</button>
                        </div>
                        <div class="notes-section hidden">
                            <div class="notes-header">
                                <h4>Poznámky a tipy od ostatních studentů</h4>
                                <button class="btn btn-small add-note-btn">Přidat poznámku</button>
                            </div>
                            <div class="add-note-form hidden">
                                <textarea class="note-textarea" placeholder="Napište svou poznámku nebo tip k této otázce..."></textarea>
                                <div class="note-form-buttons">
                                    <button class="btn btn-small save-note-btn">Uložit poznámku</button>
                                    <button class="btn btn-small cancel-note-btn">Zrušit</button>
                                </div>
                            </div>
                            <div class="notes-list">
                                <!-- Notes will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
        `;
        parent.appendChild(questionElement);
        // ... rest of the event listeners and logic for a single question ...
        // (Copy the event listeners and logic from the previous renderQuestions implementation)
        // ...
        // Add event listeners for answer selection
        const answerOptions = questionElement.querySelectorAll('.answer-option');
        answerOptions.forEach(option => {
            const input = option.querySelector('.answer-input');
            const label = option.querySelector('.answer-label');
            
            // Add visual feedback when option is clicked
            option.addEventListener('click', function(e) {
                // Don't toggle if clicking directly on the input
                if (e.target === input) {
                    return;
                }
                
                // For radio buttons, just check the clicked one
                if (input.type === 'radio') {
                    input.checked = true;
                    // Remove .selected from all options for this question
                    answerOptions.forEach(opt => opt.classList.remove('selected'));
                    updateOptionStyle(option, true);
                } else {
                    // For checkboxes, toggle the state
                    input.checked = !input.checked;
                    updateOptionStyle(option, input.checked);
                }
            });
            
            // Update style when input changes
            input.addEventListener('change', function() {
                if (input.type === 'radio') {
                    // Remove .selected from all options for this question
                    answerOptions.forEach(opt => opt.classList.remove('selected'));
                    updateOptionStyle(option, this.checked);
                } else {
                    updateOptionStyle(option, this.checked);
                }
            });
            
            // Initial style update
            updateOptionStyle(option, input.checked);
        });
        
        // Add event listeners
        const submitBtn = questionElement.querySelector('.submit-answer-btn');
        const resultFeedback = questionElement.querySelector('.result-feedback');
        const resultMessage = questionElement.querySelector('.result-message');
        const showJustificationBtn = questionElement.querySelector('.show-justification-btn');
        const tryAgainBtn = questionElement.querySelector('.try-again-btn');
        const justification = questionElement.querySelector('.question-justification');
        
        submitBtn.addEventListener('click', function() {
            const selectedAnswers = getSelectedAnswers(questionElement, question.id);
            
            if (selectedAnswers.length === 0) {
                alert('Prosím vyberte alespoň jednu odpověď.');
                return;
            }
            
            // Check if answer is correct
            const correctAnswerIds = question.answers
                .filter(answer => answer.correct)
                .map(answer => answer.id.toString());
            
            const isCorrect = arraysEqual(selectedAnswers.sort(), correctAnswerIds.sort());
            
            // Show result feedback
            resultFeedback.classList.remove('hidden');
            submitBtn.classList.add('hidden');
            
            if (isCorrect) {
                const correctMessages = [
                    'Well done! 💥',
                    'BINGO! 🎯',
                    'Jasně že jo! 🧠',
                    'Ano! Ano! Ano! 🚀',
                    'Šampion! 🏆',
                    'Výborně! 👍',
                    'BOOM! Další bod! ⭐',
                    'Perfektní! 🔥',
                    'Finanční guru! 💰',
                    'První pokus! 🎊',
                    'Příliš dobrý! 😎',
                    'Další v kapse! 🎯',
                    'Absolutní legenda! 👑',
                    'Banger! 💥',
                    'Máš to v krvi! 💪',
                    'JASNĚ! To není fér! 😤',
                    'Bestie! 🦁',
                    'Přestaň být tak dobrý! 😅',
                    'Příliš silný! 💪',
                    'To není fér! 😤',
                    'Příliš dobrý! Stop it! 😅',
                    'Mamka bude pyšná! 😍',
                    'Send it! 💥',
                    'Next level! 🚀',
                    'Yeah, Boyyy! 👑',
                    'Trapný, zase dobře. 🙌'
                ];
                const randomCorrect = correctMessages[Math.floor(Math.random() * correctMessages.length)];
                resultMessage.textContent = randomCorrect;
                resultMessage.className = 'result-message correct';
            } else {
                const incorrectMessages = [
                    'Špatně! 💥',
                    'NOPE! 🙈',
                    'Ooops! 😬',
                    'Hmm... Ne tak docela! 🤔',
                    'Špatně! Zkus to znovu! 😅',
                    'Asi budeš chudák! 😭',
                    'Nope! To není ono! 🙈',
                    'Špatně, again and again! 🔄',
                    'Ooops! Špatná odpověď! 😬',
                    'Hmm... Zkus to znovu! 🤷‍♂️',
                    'Nope! Další pokus! 🎯',
                    'Špatně! Ale učíš se! 📚',
                    'Nesprávně! Zkus to znovu! 🔄',
                    'Hmm... To není ono! 🤨',
                    'Well, ani toto nevyšlo! 🤷‍♂️',
                    'Špatně! Ale nevzdávej se! 🚀',
                    'Next try? 🎯',
                    'Jako takhle fakt ne... 👇',
                    'Tak pro změnu zase špatně! 😅',
                    'Už ze sebou něco začni dělat! 🤦‍♂️',
                    'Taky ne... 😭',
                    'Rodiče tě nepochválí! 👎',
                    'To nemá cenu! 🤦‍♂️',
                    'Vůbec ne... 😭',
                    'Netipuj! 🎯',
                    'Zaber ale trošku... 😥'
                ];
                const randomIncorrect = incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
                resultMessage.textContent = randomIncorrect;
                resultMessage.className = 'result-message incorrect';
                
                // Show correct answers
                showCorrectAnswers(questionElement, question);
            }
            
            // Show notes section for all answers (correct and incorrect)
            showNotesSection(questionElement, question.id);
            
            // Submit answer to server
            submitAnswer(question.id, isCorrect, questionElement);
        });
        
        showJustificationBtn.addEventListener('click', function() {
            justification.classList.remove('hidden');
            showJustificationBtn.classList.add('hidden');
        });

        tryAgainBtn.addEventListener('click', function() {
            // Reset form
            const inputs = questionElement.querySelectorAll('input[type="checkbox"], input[type="radio"]');
            inputs.forEach(input => input.checked = false);
            
            // Reset answer styling
            const answerOptions = questionElement.querySelectorAll('.answer-option');
            answerOptions.forEach(option => {
                option.style.borderColor = '';
                option.style.backgroundColor = '';
                option.style.color = '';
                option.classList.remove('selected');
            });
            
            // Hide feedback and show submit button again
            const resultFeedback = questionElement.querySelector('.result-feedback');
            const submitBtn = questionElement.querySelector('.submit-answer-btn');
            const justification = questionElement.querySelector('.question-justification');
            const showJustificationBtn = questionElement.querySelector('.show-justification-btn');
            const notesSection = questionElement.querySelector('.notes-section');
            
            resultFeedback.classList.add('hidden');
            submitBtn.classList.remove('hidden');
            justification.classList.add('hidden');
            showJustificationBtn.classList.remove('hidden');
            notesSection.classList.add('hidden');
        });
        
        // Notes functionality
        const addNoteBtn = questionElement.querySelector('.add-note-btn');
        const addNoteForm = questionElement.querySelector('.add-note-form');
        const noteTextarea = questionElement.querySelector('.note-textarea');
        const saveNoteBtn = questionElement.querySelector('.save-note-btn');
        const cancelNoteBtn = questionElement.querySelector('.cancel-note-btn');
        
        addNoteBtn.addEventListener('click', function() {
            addNoteForm.classList.remove('hidden');
            addNoteBtn.classList.add('hidden');
            noteTextarea.focus();
        });
        
        cancelNoteBtn.addEventListener('click', function() {
            addNoteForm.classList.add('hidden');
            addNoteBtn.classList.remove('hidden');
            noteTextarea.value = '';
        });
        
        saveNoteBtn.addEventListener('click', function() {
            const noteText = noteTextarea.value.trim();
            if (noteText) {
                addNote(question.id, noteText, questionElement);
            }
        });
    }

    function getSelectedAnswers(questionElement, questionId) {
        const selectedInputs = questionElement.querySelectorAll(`input[name="question-${questionId}"]:checked`);
        return Array.from(selectedInputs).map(input => input.value);
    }
    
    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    function submitAnswer(questionId, isCorrect, questionElement) {
        // Send answer to the server
        fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questionId: questionId,
                correct: isCorrect,
                questionSet: questionSet,
                practiceMode: practiceMode
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update local user answers
                if (!userAnswers[questionId]) {
                    userAnswers[questionId] = { correct: 0, incorrect: 0 };
                }
                
                if (isCorrect) {
                    userAnswers[questionId].correct = data.data.correct;
                } else {
                    userAnswers[questionId].incorrect = data.data.incorrect;
                }
                
                // Update the UI
                const correctCount = questionElement.querySelector('.correct-count');
                const incorrectCount = questionElement.querySelector('.incorrect-count');
                const percentageEl = questionElement.querySelector('.percentage');
                
                correctCount.textContent = data.data.correct;
                incorrectCount.textContent = data.data.incorrect;
                
                const total = data.data.correct + data.data.incorrect;
                const percentage = Math.round((data.data.correct / total) * 100);
                
                if (percentageEl) {
                    percentageEl.textContent = `(${percentage}% správně)`;
                } else {
                    const statsDiv = questionElement.querySelector('.question-stats');
                    const percentSpan = document.createElement('span');
                    percentSpan.className = 'percentage';
                    percentSpan.textContent = `(${percentage}% správně)`;
                    statsDiv.appendChild(percentSpan);
                }
                
                // Update question card class based on new stats
                questionElement.classList.remove('new', 'mostly-correct', 'needs-practice');
                if (data.data.correct > data.data.incorrect) {
                    questionElement.classList.add('mostly-correct');
                } else {
                    questionElement.classList.add('needs-practice');
                }
                
                // Update global stats
                updateStats();
            } else {
                console.error('Server error:', data.error);
                alert('Chyba při ukládání odpovědi. Zkuste to znovu.');
            }
        })
        .catch(error => {
            console.error('Error submitting answer:', error);
            alert('Chyba při komunikaci se serverem. Zkuste to znovu.');
        });
    }
    
    function updateStats() {
        // Count questions that have been answered at least once
        let answeredCount = 0;
        for (const questionId in userAnswers) {
            if (userAnswers[questionId].correct + userAnswers[questionId].incorrect > 0) {
                answeredCount++;
            }
        }
        
        answeredCountEl.textContent = answeredCount;
    }

    function updateOptionStyle(option, isChecked) {
        if (isChecked) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    }
    
    function showCorrectAnswers(questionElement, question) {
        const answerOptions = questionElement.querySelectorAll('.answer-option');
        
        answerOptions.forEach(option => {
            const input = option.querySelector('.answer-input');
            const answerId = parseInt(input.value);
            const isCorrectAnswer = question.answers.find(a => a.id === answerId)?.correct;
            
            if (isCorrectAnswer) {
                option.style.borderColor = '#27ae60';
                option.style.backgroundColor = '#d4edda';
                option.style.color = '#155724';
            } else if (input.checked) {
                // User selected wrong answer
                option.style.borderColor = '#e74c3c';
                option.style.backgroundColor = '#f8d7da';
                option.style.color = '#721c24';
            }
        });
    }
    
    function showNotesSection(questionElement, questionId) {
        const notesSection = questionElement.querySelector('.notes-section');
        notesSection.classList.remove('hidden');
        loadNotes(questionId, questionElement);
    }
    
    function loadNotes(questionId, questionElement) {
        const notesList = questionElement.querySelector('.notes-list');
        
        fetch(`notes_api.php?questionId=${questionId}&questionSet=${questionSet}&practiceMode=${practiceMode}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderNotes(data.data, notesList);
                } else {
                    console.error('Error loading notes:', data.error);
                }
            })
            .catch(error => {
                console.error('Error loading notes:', error);
            });
    }
    
    function renderNotes(notes, notesList) {
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="no-notes">Zatím nejsou žádné poznámky nebo tipy k této otázce.</p>';
            return;
        }
        
        notesList.innerHTML = notes.map(note => `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-header">
                    <span class="note-author">${note.author}</span>
                    <span class="note-date">${formatDate(note.timestamp)}</span>
                </div>
                <div class="note-text">${note.text.replace(/\n/g, '<br>')}</div>
                <div class="note-actions">
                    <button class="like-btn ${note.likedBy.includes(currentUser) ? 'liked' : ''}" data-note-id="${note.id}">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
                            <path d="M8 4a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/>
                        </svg>
                        <span class="like-count">${note.likes}</span>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for like buttons
        notesList.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const noteId = this.dataset.noteId;
                likeNote(noteId, this);
            });
        });
    }
    
    function addNote(questionId, noteText, questionElement) {
        fetch('notes_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questionId: questionId,
                questionSet: questionSet,
                practiceMode: practiceMode,
                noteText: noteText
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset form
                const addNoteForm = questionElement.querySelector('.add-note-form');
                const addNoteBtn = questionElement.querySelector('.add-note-btn');
                const noteTextarea = questionElement.querySelector('.note-textarea');
                
                addNoteForm.classList.add('hidden');
                addNoteBtn.classList.remove('hidden');
                noteTextarea.value = '';
                
                // Reload notes
                loadNotes(questionId, questionElement);
            } else {
                alert('Chyba při ukládání poznámky: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error adding note:', error);
            alert('Chyba při ukládání poznámky. Zkuste to znovu.');
        });
    }
    
    function likeNote(noteId, likeBtn) {
        fetch('notes_api.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                noteId: noteId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const likeCount = likeBtn.querySelector('.like-count');
                likeCount.textContent = data.data.likes;
                
                if (data.data.likedBy.includes(currentUser)) {
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                }
            } else {
                console.error('Error liking note:', data.error);
            }
        })
        .catch(error => {
            console.error('Error liking note:', error);
        });
    }
    
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});
