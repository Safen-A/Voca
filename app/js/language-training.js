let currentEnglishWord = ""; // Variable for storing the current English word
let currentWordPairs = [];
let currentWordIndex = 0;
let results = [];

function saveResult(germanWord, userInput, isCorrect) {
    results.push({germanWord, userInput, isCorrect});
}

function sendResultsToMain() {
    window.electronAPI.invoke('send-results', results);
}

function getTenWordPairs(title) {
    if (wordPairs[title] && wordPairs[title].length >= 2) {
        return wordPairs[title].slice(0, 2);
    } else {
        console.error("Not enough word pairs for", title);
        return [];
    }
}

window.electronAPI.onReceiveWordPairs((wordPairs) => {
    console.log("Received word pairs:", wordPairs); // For debugging
    currentWordPairs = wordPairs;
    currentWordIndex = 0;
    displayNextWord();
});

window.electronAPI.onSetDarkMode((darkModeEnabled) => {
    document.body.classList.toggle("dark-mode", darkModeEnabled);
});

function displayNextWord() {
    if (currentWordIndex < currentWordPairs.length) {
        document.getElementById('germanWord').textContent = currentWordPairs[currentWordIndex].germanWord;
        resetInputField();
    } else {
        sendResultsToMain();
        window.location.href = 'main.html';
    }
}

document.getElementById('englishInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        const isCorrect = checkTranslation(this.value, currentWordPairs[currentWordIndex].englishWord);
        displayResult(isCorrect);
        currentWordIndex++;
        setTimeout(displayNextWord, 1000); // Short delay before displaying the next word
    }
});

function checkTranslation(userInput, correctTranslation) {
    return userInput.trim().toLowerCase() === correctTranslation.toLowerCase();
}

function displayResult(isCorrect) {
    const inputField = document.getElementById('englishInput');
    const correctWordDisplay = document.getElementById('correctEnglishWord');
    const germanWord = document.getElementById('germanWord').textContent;
    const correctEnglishWord = currentWordPairs[currentWordIndex].englishWord;
    const userInput = inputField.value;
    saveResult(germanWord, userInput, isCorrect);
    inputField.classList.remove('correct', 'incorrect');

    if (isCorrect) {
        inputField.classList.add('correct');
        correctWordDisplay.style.display = 'none';
    } else {
        inputField.classList.add('incorrect');
        correctWordDisplay.textContent = correctEnglishWord;
        correctWordDisplay.style.display = 'block';
        setTimeout(function () {
            inputField.classList.remove('incorrect');
            correctWordDisplay.style.display = 'none';
        }, 1000);
    }
}

function resetInputField() {
    const inputField = document.getElementById('englishInput');
    inputField.value = '';
    inputField.classList.remove('correct', 'incorrect');
}

window.electronAPI.onReceiveWordPair((germanWord, englishWord) => {
    document.getElementById('germanWord').textContent = germanWord;
    // Here you could also save or process the English word
});
