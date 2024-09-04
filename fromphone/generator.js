// code_generator.js

const CPU = require('./cpu'); // Adjust the path if needed
const fs = require("fs");
const path = require("path");
const [, , programPath] = process.argv;
const opcodes = {
    'load': 0x01,
    'add': 0x02,
    'subtract': 0x03,
    'multiply': 0x04,
    'divide': 0x05,
    'exponent': 0x06,
    'halt': 0x07,
    'print': 0x08,
};

function generateMachineCode(instructions) {
    const program = [];
    const lines = instructions.split(';').map(line => line.trim()).filter(line => line);

    lines.forEach(line => {
        const [instruction, ...args] = line.split(/\s+/);
        const opcode = opcodes[instruction.toLowerCase()];

        if (opcode === undefined) {
            throw new Error(`Unknown instruction: ${instruction}`);
        }

        program.push(opcode);

        args.forEach(arg => {
            // Remove any commas or extra spaces from arguments
            const cleanedArg = arg.replace(/,/g, '').trim();
            const value = Number(cleanedArg);
            if (isNaN(value)) {
                throw new Error(`Invalid argument: ${arg}`);
            }
            program.push(value);
        });
    });

    return program;
}

function runMachineCode(program) {
    const cpu = new CPU(); // Create a new CPU instance
    cpu.loadProgram(program); // Load the program into the CPU
    cpu.execute(); // Execute the program
}

if (!!programPath) {
    let input = fs.readFileSync(path.resolve(__dirname, programPath), 'utf8');
    try {
        // Clean input
        const cleanedInput = input.trim();
        if (cleanedInput) {
            const program = generateMachineCode(cleanedInput);
            console.log('Generated Machine Code:\n' + JSON.stringify(program));
            runMachineCode(program);
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit();
    }
}
// Read input from stdin
process.stdin.setEncoding('utf8');
console.log('Please paste the text instructions and press Enter:');
process.stdin.on('data', (input) => {
    try {
        // Clean input
        const cleanedInput = input.trim();
        if (cleanedInput) {
            const program = generateMachineCode(cleanedInput);
            console.log('\nGenerated Machine Code:\n', JSON.stringify(program));
            runMachineCode(program);
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit();
    }
});
