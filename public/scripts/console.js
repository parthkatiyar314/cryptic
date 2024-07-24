const lightBlue = "\x1b[94m";
const reset = "\x1b[0m";

var asciiArt = `
        ███╗   ███╗██╗     ███████╗ ██████╗ 
        ████╗ ████║██║     ██╔════╝██╔════╝ 
        ██╔████╔██║██║     ███████╗██║     
        ██║╚██╔╝██║██║     ╚════██║██║     
        ██║ ╚═╝ ██║███████╗███████║╚██████╗
        ╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝
        `;

function customConsoleLog(message, style) {
    console.log(`%c${message}`, style);
}

function disableConsoleMethods() {
    console.log = function () { };
    console.warn = function () { };
    console.error = function () { };
}

function logMessages() {
    customConsoleLog(
        "You finally entered the console😈!",
        "color: red; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 0px rgba(0,0,0,0.3);"
    );

    customConsoleLog(
        asciiArt,
        "color: rgb(31, 146, 146); font-size: 14px;"
    );

    customConsoleLog(
        "Have a great day!",
        "color: green; font-size: 18px; font-style: italic; background-color: yellow; padding: 2px 4px;"
    );
}

// Call logMessages every 2 seconds
setInterval(logMessages, 2000);
