document.addEventListener('DOMContentLoaded', function() {
    const questionsContainer = document.getElementById('questions-container');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const sortWrongBtn = document.getElementById('sort-wrong-btn');
    const showMarkedBtn = document.getElementById('show-marked-btn');
    const answeredCountEl = document.getElementById('answered-count');
    const correctCountEl = document.getElementById('correct-count');
    const incorrectCountEl = document.getElementById('incorrect-count');
    const successRateEl = document.getElementById('success-rate');
    
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
    let sortedCaseStudies = [];
    let showOnlyMarked = false;
    let noteCounts = {};
    
    // Load note counts first, then initialize questions
    loadNoteCounts().then(() => {
        // Initialize questions after note counts are loaded
        initializeQuestions();
        
        // Update show marked button text if there are marked questions
        if (markedQuestions.length > 0) {
            showMarkedBtn.textContent = `Zobrazit označené (${markedQuestions.length})`;
        }
    });
    
    // Event listeners
    shuffleBtn.addEventListener('click', function() {
        shuffleQuestions();
        renderQuestions();
    });
    
    sortWrongBtn.addEventListener('click', function() {
        sortByWrongAnswers();
        renderQuestions();
    });
    
    showMarkedBtn.addEventListener('click', function() {
        showOnlyMarked = !showOnlyMarked;
        if (showOnlyMarked) {
            showMarkedBtn.textContent = `Zobrazit všechny (${markedQuestions.length} označených)`;
        } else {
            showMarkedBtn.textContent = 'Zobrazit označené';
        }
        renderQuestions();
    });
    
    // Functions
    function initializeQuestions() {
        if (practiceMode === 'knowledge') {
            sortedQuestions = prioritizeQuestions(allQuestions);
        } else {
            // For skills mode, prioritize case studies
            sortedCaseStudies = prioritizeCaseStudies(allSkills);
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
    
    function prioritizeCaseStudies(caseStudies) {
        // Clone case studies to avoid modifying the original
        const caseStudiesCopy = JSON.parse(JSON.stringify(caseStudies));
        
        // Calculate priority score for each case study
        caseStudiesCopy.forEach(caseStudy => {
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let totalAnswers = 0;
            
            // Calculate total answers for this case study
            caseStudy.questions.forEach(question => {
                const answerHistory = userAnswers[question.id] || { correct: 0, incorrect: 0 };
                totalCorrect += answerHistory.correct || 0;
                totalIncorrect += answerHistory.incorrect || 0;
                totalAnswers += (answerHistory.correct || 0) + (answerHistory.incorrect || 0);
            });
            
            let priorityScore = 10; // Base score
            
            if (totalAnswers === 0) {
                // Case studies with no answers get highest priority
                priorityScore = 100;
            } else {
                // Case studies with more wrong answers get higher priority
                const errorRate = totalIncorrect / totalAnswers;
                priorityScore = 50 + (errorRate * 50);
                
                // Gradually decrease priority for frequently answered case studies
                priorityScore -= Math.min(totalAnswers, 30);
            }
            
            caseStudy.priorityScore = priorityScore;
        });
        
        // Sort by priority score (highest first)
        return caseStudiesCopy.sort((a, b) => b.priorityScore - a.priorityScore);
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
            // For skills mode, create a weighted array for shuffling case studies
            const weightedCaseStudies = [];
            
            allSkills.forEach(skillCase => {
                let totalCorrect = 0;
                let totalIncorrect = 0;
                
                // Calculate total correct/incorrect answers for this case study
                skillCase.questions.forEach(question => {
                    const answerHistory = userAnswers[question.id] || { correct: 0, incorrect: 0 };
                    totalCorrect += answerHistory.correct || 0;
                    totalIncorrect += answerHistory.incorrect || 0;
                });
                
                // Calculate weight: base weight + incorrect answers - correct answers
                // This gives higher weight to case studies with more wrong answers
                let weight = 10; // Base weight for case studies with no history
                weight += totalIncorrect * 5; // Each incorrect answer adds 5 to weight
                weight -= totalCorrect * 2; // Each correct answer subtracts 2 from weight
                weight = Math.max(1, weight); // Ensure minimum weight of 1
                
                // Add case study multiple times based on weight (higher weight = more copies)
                for (let i = 0; i < weight; i++) {
                    weightedCaseStudies.push(skillCase);
                }
            });
            
            // Shuffle the weighted array
            for (let i = weightedCaseStudies.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [weightedCaseStudies[i], weightedCaseStudies[j]] = [weightedCaseStudies[j], weightedCaseStudies[i]];
            }
            
            // Remove duplicates while preserving order (case studies with higher weight appear first)
            const seen = new Set();
            sortedCaseStudies = weightedCaseStudies.filter(caseStudy => {
                if (seen.has(caseStudy.case_id)) {
                    return false;
                }
                seen.add(caseStudy.case_id);
                return true;
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
            // For skills mode, sort case studies by total wrong answers
            sortedCaseStudies = [...allSkills].sort((a, b) => {
                let aTotalWrong = 0;
                let aTotalCorrect = 0;
                let bTotalWrong = 0;
                let bTotalCorrect = 0;
                
                // Calculate total wrong/correct answers for case study A
                a.questions.forEach(question => {
                    const history = userAnswers[question.id] || { correct: 0, incorrect: 0 };
                    aTotalWrong += history.incorrect || 0;
                    aTotalCorrect += history.correct || 0;
                });
                
                // Calculate total wrong/correct answers for case study B
                b.questions.forEach(question => {
                    const history = userAnswers[question.id] || { correct: 0, incorrect: 0 };
                    bTotalWrong += history.incorrect || 0;
                    bTotalCorrect += history.correct || 0;
                });
                
                // First sort by total wrong answers (descending)
                if (aTotalWrong !== bTotalWrong) {
                    return bTotalWrong - aTotalWrong;
                }
                
                // If total wrong answers are equal, sort by total correct answers (ascending)
                return aTotalCorrect - bTotalCorrect;
            });
        }
    }
    
    function renderQuestions() {
        questionsContainer.innerHTML = '';
        
        if (practiceMode === 'knowledge') {
            // Filter questions if showOnlyMarked is true
            const questionsToRender = showOnlyMarked 
                ? sortedQuestions.filter(question => markedQuestions.includes(question.id))
                : sortedQuestions;
            
            // Render standalone questions for knowledge mode
            questionsToRender.forEach(question => {
                renderSingleQuestion(question, questionsContainer);
            });
        } else {
            // Filter case studies if showOnlyMarked is true
            const caseStudiesToRender = showOnlyMarked 
                ? sortedCaseStudies.filter(skillCase => 
                    skillCase.questions.some(question => markedQuestions.includes(question.id))
                )
                : sortedCaseStudies;
            
            // Render case studies (skills) for skills mode
            caseStudiesToRender.forEach(skillCase => {
                const caseDiv = document.createElement('div');
                caseDiv.className = 'case-study';
                caseDiv.innerHTML = `
                    <div class="case-description">
                        <strong>Případová studie:</strong> ${skillCase.case_description}
                    </div>
                `;
                // Render each question in the case (filter if needed)
                const questionsToRender = showOnlyMarked 
                    ? skillCase.questions.filter(question => markedQuestions.includes(question.id))
                    : skillCase.questions;
                questionsToRender.forEach(question => {
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
                <div class="action-buttons">
                    <button class="btn btn-small submit-answer-btn">Odeslat odpověď</button>
                    <div class="notes-buttons">
                        <button class="btn btn-small show-notes-btn">Zobrazit poznámky</button>
                        <button class="btn btn-small copy-gpt-prompt-btn">Zkopírovat GPT prompt</button>
                        <button class="btn btn-small mark-question-btn ${markedQuestions.includes(question.id) ? 'marked' : ''}">
                            ${markedQuestions.includes(question.id) ? '✓ Označeno' : 'Označit otázku'}
                        </button>
                    </div>
                </div>
                <div class="result-feedback hidden">
                    <div class="result-message"></div>
                    <div class="feedback-buttons">
                        <button class="btn btn-small show-justification-btn">Zobrazit vysvětlení</button>
                        <button class="btn btn-small try-again-btn">Zkusit znovu</button>
                    </div>
                </div>
                <div class="notes-section hidden">
                    <div class="notes-header">
                        <h4>Poznámky a tipy od ostatních studentů</h4>
                        <div class="notes-buttons">
                            <button class="btn btn-small add-note-btn">Přidat poznámku</button>
                            <!-- GPT button temporarily disabled
                            <button class="btn btn-small ask-gpt-btn">🤖 Zeptat se GPT</button>
                            -->
                        </div>
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
        `;
        parent.appendChild(questionElement);
        
        // Update note button text with count if available
        const notesBtn = questionElement.querySelector('.show-notes-btn');
        // Try both string and number keys for question ID
        const noteCount = noteCounts[question.id] || noteCounts[question.id.toString()] || 0;
        notesBtn.textContent = `Zobrazit poznámky (${noteCount})`;
        
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
        // const askGptBtn = questionElement.querySelector('.ask-gpt-btn'); // GPT temporarily disabled
        const addNoteForm = questionElement.querySelector('.add-note-form');
        const noteTextarea = questionElement.querySelector('.note-textarea');
        const saveNoteBtn = questionElement.querySelector('.save-note-btn');
        const cancelNoteBtn = questionElement.querySelector('.cancel-note-btn');
        
        addNoteBtn.addEventListener('click', function() {
            addNoteForm.classList.remove('hidden');
            addNoteBtn.classList.add('hidden');
            noteTextarea.focus();
        });
        
        // GPT functionality temporarily disabled
        /*
        askGptBtn.addEventListener('click', function() {
            // Disable button and show loading state
            askGptBtn.disabled = true;
            askGptBtn.textContent = '🤖 Načítám...';
            
            askGpt(question.id, questionElement, askGptBtn);
        });
        */
        
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
        
        // New notes and GPT prompt functionality
        const showNotesBtn = questionElement.querySelector('.show-notes-btn');
        const copyGptPromptBtn = questionElement.querySelector('.copy-gpt-prompt-btn');
        
        showNotesBtn.addEventListener('click', function() {
            const notesSection = questionElement.querySelector('.notes-section');
            if (notesSection.classList.contains('hidden')) {
                notesSection.classList.remove('hidden');
                const noteCount = noteCounts[question.id] || noteCounts[question.id.toString()] || 0;
                showNotesBtn.textContent = `Skrýt poznámky (${noteCount})`;
                loadNotes(question.id, questionElement);
            } else {
                notesSection.classList.add('hidden');
                const noteCount = noteCounts[question.id] || noteCounts[question.id.toString()] || 0;
                showNotesBtn.textContent = `Zobrazit poznámky (${noteCount})`;
            }
        });
        
        copyGptPromptBtn.addEventListener('click', function() {
            const prompt = generateGptPrompt(question);
            
            // Create or find the prompt display section
            let promptDisplay = questionElement.querySelector('.gpt-prompt-display');
            if (!promptDisplay) {
                promptDisplay = document.createElement('div');
                promptDisplay.className = 'gpt-prompt-display';
                questionElement.appendChild(promptDisplay);
            }
            
            // Display the prompt content
            promptDisplay.innerHTML = `
                <div class="prompt-header">
                    <h4>🤖 GPT Prompt</h4>
                    <button class="btn btn-small close-prompt-btn">✕</button>
                </div>
                <div class="prompt-content">
                    <pre>${prompt}</pre>
                </div>
                <div class="prompt-footer">
                    <span class="copy-status">✅ Zkopírováno do schránky!</span>
                </div>
            `;
            
            // Add event listener for close button
            const closeBtn = promptDisplay.querySelector('.close-prompt-btn');
            closeBtn.addEventListener('click', function() {
                promptDisplay.remove();
            });
            
            // Copy to clipboard
            navigator.clipboard.writeText(prompt).then(function() {
                // Success - status is already shown in the prompt display
            }).catch(function(err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = prompt;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                // Update status to show it was copied via fallback
                const statusEl = promptDisplay.querySelector('.copy-status');
                statusEl.textContent = '✅ Zkopírováno do schránky! (starší prohlížeč)';
            });
            
            // Scroll to the prompt display
            promptDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        
        // Mark question functionality
        const markQuestionBtn = questionElement.querySelector('.mark-question-btn');
        markQuestionBtn.addEventListener('click', function() {
            toggleMarkQuestion(question.id, questionElement, markQuestionBtn);
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
                
                // Check if authentication failed
                if (data.redirect) {
                    alert('Vaše přihlášení vypršelo. Budete přesměrováni na přihlašovací stránku.');
                    window.location.href = data.redirect;
                    return;
                }
                
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
        let totalCorrect = 0;
        let totalIncorrect = 0;
        
        for (const questionId in userAnswers) {
            const correct = userAnswers[questionId].correct || 0;
            const incorrect = userAnswers[questionId].incorrect || 0;
            
            if (correct + incorrect > 0) {
                answeredCount++;
                totalCorrect += correct;
                totalIncorrect += incorrect;
            }
        }
        
        // Calculate success rate
        const totalAnswers = totalCorrect + totalIncorrect;
        const successRate = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
        
        // Update the display
        answeredCountEl.textContent = answeredCount;
        correctCountEl.textContent = totalCorrect;
        incorrectCountEl.textContent = totalIncorrect;
        successRateEl.textContent = successRate + '%';
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
                    
                    // Update note count
                    const noteCount = data.data.length;
                    noteCounts[questionId] = noteCount;
                    
                    // Update button text
                    const btn = questionElement.querySelector('.show-notes-btn');
                    if (btn) {
                        if (noteCount > 0) {
                            btn.textContent = `Zobrazit poznámky (${noteCount})`;
                        }
                    }
                } else {
                    console.error('Error loading notes:', data.error);
                    
                    // Check if authentication failed
                    if (data.redirect) {
                        alert('Vaše přihlášení vypršelo. Budete přesměrováni na přihlašovací stránku.');
                        window.location.href = data.redirect;
                        return;
                    }
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
            <div class="note-item" data-note-id="${note.id}" ${note.isGptNote ? 'data-gpt-note="true"' : ''}>
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
                
                // Update note count
                updateNoteCount(questionId, 1);
            } else {
                // Check if authentication failed
                if (data.redirect) {
                    alert('Vaše přihlášení vypršelo. Budete přesměrováni na přihlašovací stránku.');
                    window.location.href = data.redirect;
                    return;
                }
                
                alert('Chyba při ukládání poznámky: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error adding note:', error);
            alert('Chyba při ukládání poznámky. Zkuste to znovu.');
        });
    }
    
    // GPT functionality temporarily disabled
    /*
    function askGpt(questionId, questionElement, gptBtn) {
        fetch('notes_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'ask_gpt',
                questionId: questionId,
                questionSet: questionSet,
                practiceMode: practiceMode
            })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button
            gptBtn.disabled = false;
            gptBtn.textContent = '🤖 Zeptat se GPT';
            
            if (data.success) {
                // Reload notes to show the new GPT note
                loadNotes(questionId, questionElement);
            } else {
                alert('Chyba při získávání odpovědi od GPT: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error asking GPT:', error);
            alert('Chyba při komunikaci s GPT. Zkuste to znovu.');
            
            // Reset button
            gptBtn.disabled = false;
            gptBtn.textContent = '🤖 Zeptat se GPT';
        });
    }
    */
    
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
                
                // Check if authentication failed
                if (data.redirect) {
                    alert('Vaše přihlášení vypršelo. Budete přesměrováni na přihlašovací stránku.');
                    window.location.href = data.redirect;
                    return;
                }
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
    
    function generateGptPrompt(question) {
        // Extract correct answers
        const correctAnswers = question.answers
            .filter(answer => answer.correct)
            .map(answer => answer.text);
        
        // Extract incorrect answers
        const incorrectAnswers = question.answers
            .filter(answer => !answer.correct)
            .map(answer => answer.text);
        
        // Build the prompt (same as in gpt_explainer.py)
        const prompt = `Jsi odborný lektor financí a finančních trhů. Prosím vysvětli následující otázku z finanční oblasti:

OTÁZKA: ${question.text}

SPRÁVNÉ ODPOVĚDI: ${correctAnswers.join(', ')}

NESPRÁVNÉ ODPOVĚDI: ${incorrectAnswers.join(', ')}

VYSVĚTLENÍ: ${question.justification}

Prosím poskytni:
1. Stručné a jasné vysvětlení tématu
2. Proč je správná odpověď správná
3. Proč jsou ostatní odpovědi nesprávné
4. Praktický příklad nebo souvislost s reálným světem
5. Klíčové pojmy a definice

Odpověď piš v češtině, buď přátelský a srozumitelný pro studenty. Měj na paměti, že toto je pro vzdělávací účely.`;
        
        return prompt;
    }
    
    function toggleMarkQuestion(questionId, questionElement, markBtn) {
        fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'toggle_mark',
                questionId: questionId,
                questionSet: questionSet,
                practiceMode: practiceMode
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const isMarked = data.data.isMarked;
                
                // Update button text and class
                if (isMarked) {
                    markBtn.textContent = '✓ Označeno';
                    markBtn.classList.add('marked');
                    // Add to marked questions array
                    if (!markedQuestions.includes(questionId)) {
                        markedQuestions.push(questionId);
                    }
                } else {
                    markBtn.textContent = 'Označit otázku';
                    markBtn.classList.remove('marked');
                    // Remove from marked questions array
                    const index = markedQuestions.indexOf(questionId);
                    if (index > -1) {
                        markedQuestions.splice(index, 1);
                    }
                }
                
                // Update the filter button text if we're currently showing marked questions
                if (showOnlyMarked) {
                    showMarkedBtn.textContent = `Zobrazit všechny (${markedQuestions.length} označených)`;
                }
            } else {
                console.error('Server error:', data.error);
                
                // Check if authentication failed
                if (data.redirect) {
                    alert('Vaše přihlášení vypršelo. Budete přesměrováni na přihlašovací stránku.');
                    window.location.href = data.redirect;
                    return;
                }
                
                alert('Chyba při označování otázky. Zkuste to znovu.');
            }
        })
        .catch(error => {
            console.error('Error marking question:', error);
            alert('Chyba při komunikaci se serverem. Zkuste to znovu.');
        });
    }
    
    function loadNoteCounts() {
        // Fetch all note counts in a single request
        return fetch(`notes_api.php?action=bulk_counts&questionSet=${questionSet}&practiceMode=${practiceMode}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store the note counts
                    noteCounts = data.data;
                    
                    // Ensure all questions have a count (even if 0)
                    if (practiceMode === 'knowledge') {
                        allQuestions.forEach(question => {
                            if (!(question.id in noteCounts)) {
                                noteCounts[question.id] = 0;
                            }
                        });
                    } else {
                        allSkills.forEach(skillCase => {
                            skillCase.questions.forEach(question => {
                                if (!(question.id in noteCounts)) {
                                    noteCounts[question.id] = 0;
                                }
                            });
                        });
                    }
                    
                    console.log('Note counts stored:', noteCounts); // Debug log
                } else {
                    console.error('Error loading note counts:', data.error);
                    noteCounts = {};
                }
            })
            .catch(error => {
                console.error('Error loading note counts:', error);
                noteCounts = {};
            });
    }
    
    function updateNoteButtonCounts() {
        // This function is now only used for updating existing buttons when counts change
        document.querySelectorAll('.show-notes-btn').forEach(btn => {
            const questionElement = btn.closest('.question-card');
            const questionId = questionElement.dataset.id;
            const count = noteCounts[questionId] || noteCounts[questionId.toString()] || 0;
            
            btn.textContent = `Zobrazit poznámky (${count})`;
        });
    }
    
    function updateNoteCount(questionId, increment) {
        if (!noteCounts[questionId]) {
            noteCounts[questionId] = 0;
        }
        noteCounts[questionId] += increment;
        
        // Update the specific button
        const questionElement = document.querySelector(`[data-id="${questionId}"]`);
        if (questionElement) {
            const btn = questionElement.querySelector('.show-notes-btn');
            if (btn) {
                const count = noteCounts[questionId];
                btn.textContent = `Zobrazit poznámky (${count})`;
            }
        }
    }
});
