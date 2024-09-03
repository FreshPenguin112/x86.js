const fs = require('fs');
const path = require('path');
const Translator = require('./translator');
const CPU = require('./cpu');

// Function to process the JavaScript code and execute it
function processCode(jsCode, debug) {
    // Translate JavaScript code to machine code
    const translator = new Translator();
    const machineCode = translator.translate(jsCode);

    // Initialize CPU and load the program
    const cpu = new CPU();
    cpu.loadProgram(machineCode);

    // Execute the program
    cpu.execute();

    // Debug information
    if (debug === "--debug" || debug === "-d") {
        console.log("\ndebug info:");
        console.log("registers: ", JSON.stringify(cpu.registers));
        console.log("program: ", JSON.stringify(machineCode));
        console.log("var map: ", JSON.stringify(Object.fromEntries(translator.varMap)));
    }
}

// Check if the input is coming from stdin (piped input)
if (process.stdin.isTTY) {
    // Get the file path from command-line arguments
    const [,, programPath, debug] = process.argv;

    if (!programPath) {
        console.error('Please provide the path to the program file.');
        process.exit(1);
    }

    // Read the program file
    const jsCode = fs.readFileSync(path.resolve(__dirname, programPath), 'utf8');
    processCode(jsCode, debug);

} else {
    // If input is piped, read from stdin
    let jsCode = '';

    process.stdin.on('data', chunk => {
        jsCode += chunk;
    });

    process.stdin.on('end', () => {
        // Get the debug flag from command-line arguments
        const [,, debug] = process.argv;
        processCode(jsCode, debug);
    });
}
