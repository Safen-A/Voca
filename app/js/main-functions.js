document.addEventListener('DOMContentLoaded', () => { // Initialization and event listener setup
    initializeAddCardButton();
    initializeModeSwitch();
    setupCardAddedListener();
    loadAppData();
});

function initializeAddCardButton() {
    const addButton = document.getElementById('add-card-button');
    if (addButton) {
        addButton.addEventListener('click', () => window.electronAPI.handleClick());
    } else {
        console.log('Button not found');
    }
}

function initializeModeSwitch() {
    const modeSwitch = document.getElementById('mode-switch');
    modeSwitch.addEventListener('change', (event) => {
        const darkModeEnabled = event.target.checked;
        document.body.classList.toggle("dark-mode", darkModeEnabled);
        window.electronAPI.setDarkMode(darkModeEnabled);
    });
}

function setupCardAddedListener() {
    window.electronAPI.onCardAdded((data) => {
        createCardElement(data.title, data.red, data.orange, data.green);
    });
}

function loadAppData() {
    window.electronAPI.invoke('get-app-data').then(data => {
        data.cardstacks.forEach(stack => {
            createCardElement(stack.title, stack.status.red, stack.status.orange, stack.status.green);
        });
        if (data.darkMode) {
            document.body.classList.add("dark-mode");
            document.getElementById('mode-switch').checked = true;
        }
    });
}


function createCardElement(title, red, orange, green) {
    const cardContainer = document.querySelector('.cards');
    const addButtonContainer = document.getElementById('add-card-button').parentNode;

    const newCardStackElement = document.createElement('div');
    newCardStackElement.setAttribute('data-title', title);
    newCardStackElement.className = 'card';
    newCardStackElement.innerHTML = `
<div class="card-content">
    <div class="flex-container">
        <div class="text-container">
            <p class="title is-5">${title}</p>
        </div>
        <div class="circle-container">
            <div class="circle-line">
                <div class="circle red"></div>
                <span class="circle-number">${red}</span>
            </div>
            <div class="circle-line">
                <div class="circle orange"></div>
                <span the "circle-number">${orange}</span>
            </div>
            <div class="circle-line">
                <div class="circle green"></div>
                <span class="circle-number">${green}</span>
            </div>
        </div>
    </div>
</div>
`;

    cardContainer.insertBefore(newCardStackElement, addButtonContainer);

    newCardStackElement.addEventListener('click', () => {
        window.electronAPI.openLanguageTraining(title);
    });

}
