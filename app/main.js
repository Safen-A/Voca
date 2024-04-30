const {app, BrowserWindow, ipcMain, dialog} = require('electron');

const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

function getResourcePath() {
    const appImagePath = getAppImagePath(); 

    if (appImagePath) {
        const appImageDir = path.dirname(appImagePath);
        resourcePath = path.join(appImageDir, 'resources');

        return resourcePath;
    }
    return '';
}

function getAppImagePath() {
    if (process.platform === 'linux') {
        if (process.env.APPIMAGE) {
            return process.env.APPIMAGE;
        } else {
            return app.getPath('exe');
        }
    } else {
        return '';
    }
}

let wordPairs = {};

let appData = {
    cardstacks: [],
    darkMode: false
};

let resourcePath = "";


app.disableHardwareAcceleration();


function createWindow() { // Create the browser window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // and load the main.html of the app.
    win.loadFile('main.html');
}

app.whenReady().then(() => {
    createWindow();
    loadCSVFilesFromResources();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
            loadCSVFilesFromResources();
        }
    });
});

function loadCSVFilesFromResources() {
    const resourcesPath = getResourcePath();
    fs.readdir(resourcesPath, (err, files) => {
        if (err) {
            console.error('Fehler beim Lesen des Resources-Ordners:', err);
            return;
        }
        files.forEach(file => {
            if (file.endsWith('.csv')) {
                const filePath = path.join(resourcesPath, file);
                readCSVFile(filePath);
                console.log("FILEPATH :", filePath);

            }
        });
    });
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


ipcMain.on('handle-click', () => {
    openFileDialog();
});

ipcMain.on('set-dark-mode', (event, value) => {
    appData.darkMode = value;
});


ipcMain.handle('get-app-data', () => {
    return appData;
});

ipcMain.handle('send-results', (event, results) => {
    console.log("Erhaltene Ergebnisse:", results);
    results.forEach(result => {
        updateWordPairStatus(result.germanWord, result.isCorrect);
    });
    updateStatusCounts()
    console.log("Aktualisierte appData.cardstacks:");
    appData.cardstacks.forEach(stack => {
        console.log(`Cardstack ${
            stack.title
        }:`, stack.triples);
    });
    const cardstack = appData.cardstacks.find(stack => stack.title === currentCardstackTitle);

    if (cardstack) {
        writeCardstackToCSV(cardstack);
    } else {
        console.error(`Kein Cardstack gefunden mit dem Titel: ${currentCardstackTitle}`);
    }
    // Resetting the current cardstack title
    currentCardstackTitle = "";
});

ipcMain.on('open-language-training', (event, title) => {
    const win = BrowserWindow.getFocusedWindow();
    win.loadFile('language-training.html').then(() => {
        const wordPairs = getTenWordPairs(title);
        win.webContents.send('receive-word-pairs', wordPairs);
        win.webContents.send('set-dark-mode', appData.darkMode);
        console.log('Darkmode is:', appData.darkMode);
        currentCardstackTitle = title
    });
});


function writeCardstackToCSV(cardstack) {
    const csvData = Papa.unparse({
        fields: [
            'german', 'english', 'status'
        ],
        data: cardstack.triples.map(triple => [triple.germanWord, triple.englishWord, triple.status])
    });
    const csvFilePath = path.join(resourcePath, `${
        cardstack.title
    }.csv`);
    console.log("csvwritePath: ", csvFilePath)
    fs.writeFile(csvFilePath, csvData, 'utf8', (err) => {
        if (err) {
            console.error('Fehler beim Schreiben der CSV-Datei:', err);
        } else {
            console.log(`CSV-Datei für ${
                cardstack.title
            } erfolgreich aktualisiert.`);
        }
    });
}


function updateWordPairStatus(germanWord, isCorrect) {
    appData.cardstacks.forEach(stack => {
        if (stack.title === currentCardstackTitle) {
            stack.triples.forEach(triple => {
                if (triple.germanWord === germanWord) {
                    if (isCorrect) {
                        triple.status = 'green'; // Correct -> Green
                    } else {
                        if (triple.status === 'green') {
                            triple.status = 'orange'; // Green and False -> Orange
                        } else {
                            triple.status = 'red'; // Red or orange and false -> red
                        }
                    }
                }
            });
        }
    });
}


function getTenWordPairs(title) {
    const cardstack = appData.cardstacks.find(stack => stack.title === title);

    if (! cardstack || cardstack.triples.length === 0) {
        console.error("Keine Wortpaare verfügbar für", title);
        return [];
    }


    const redPairs = shuffleArray(cardstack.triples.filter(triple => triple.status === 'red'));
    const orangePairs = shuffleArray(cardstack.triples.filter(triple => triple.status === 'orange'));
    const greenPairs = shuffleArray(cardstack.triples.filter(triple => triple.status === 'green'));


    const extractedPairs = [];

    // Extract word pairs, starting with the red ones
    while (extractedPairs.length < 10) {
        if (redPairs.length > 0 && extractedPairs.length < 7) { // At least 7 red, if available
            extractedPairs.push(redPairs.shift());
        } else if (orangePairs.length > 0) {
            extractedPairs.push(orangePairs.shift());
        } else if (greenPairs.length > 0) {
            extractedPairs.push(greenPairs.shift());
        } else { // If there are no other word pairs in the desired colors
            break;
        }
    }

    // Returning the extracted pairs as objects
    return extractedPairs.map(triple => {
        return {germanWord: triple.germanWord, englishWord: triple.englishWord};
    });
}

function shuffleArray(array) {
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;

    // As long as there are still elements to be mixed
    while (0 !== currentIndex) { // Select a remaining element
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


function openFileDialog() {
    const win = BrowserWindow.getFocusedWindow();
    dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
            {
                name: 'CSV-Dateien',
                extensions: ['csv']
            }
        ]
    }).then(result => {
        if (!result.canceled) {
            console.log('Ausgewählte Datei:', result.filePaths[0]);
            readCSVFile(result.filePaths[0]);
        }
    }).catch(err => {
        console.log(err);
    });
}


function updateStatusCounts() {
    appData.cardstacks.forEach(cardstack => {
        const statusCounts = {
            red: cardstack.triples.filter(triple => triple.status === 'red').length,
            orange: cardstack.triples.filter(triple => triple.status === 'orange').length,
            green: cardstack.triples.filter(triple => triple.status === 'green').length
        };

        // Update the statusCounts for the current cardstack
        cardstack.status = statusCounts;
    });
}


function getFileNameWithoutExtension(filePath) {
    const fileNameWithExtension = path.basename(filePath);
    const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.');
    return fileName;
}

function readCSVFile(filePath) {
    const title = getFileNameWithoutExtension(filePath);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err.message);
            return;
        }
        Papa.parse(data, {
            complete: (results) => {
                const data = results.data;

                // Extract german english tupel
                const germanEnglishPairs = data.map(row => [row.german, row.english]);

                // Counting the number of status values
                const statusCounts = {
                    red: data.filter(row => row.status === 'red').length,
                    orange: data.filter(row => row.status === 'orange').length,
                    green: data.filter(row => row.status === 'green').length
                };

                const germanEnglishStatusTriples = data.map(row => {
                    return {germanWord: row.german, englishWord: row.english, status: row.status};
                });

                const newCardstack = {
                    title: title,
                    pairs: germanEnglishPairs,
                    status: statusCounts,
                    triples: germanEnglishStatusTriples
                };

                appData.cardstacks.push(newCardstack);

                addCard(title, statusCounts.red, statusCounts.orange, statusCounts.green);

                wordPairs[title] = data.map(row => {
                    return {germanWord: row.german, englishWord: row.english};
                });
            },
            header: true
        });
    });
}

function addCard(title, red, orange, green) {
    const win = BrowserWindow.getFocusedWindow();
    win.webContents.send('add-card', {title, red, orange, green});
}
