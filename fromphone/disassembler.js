// disassembler.js

const opcodes = {
    0x01: 'load',        // Load a value into a register
    0x02: 'add',         // Add values of two registers
    0x03: 'subtract',    // Subtract values of two registers
    0x04: 'multiply',    // Multiply values of two registers
    0x05: 'divide',      // Divide values of two registers
    0x06: 'exponent',// Raise value in a register to the power of another register
    0x07: 'halt',        // Stop execution
    0x08: 'print',       // Output the value of a register
};

function disassemble(program) {
    const instructions = [];
    for (let i = 0; i < program.length; i++) {
        const opcode = program[i];
        if (opcodes[opcode]) {
            const instruction = opcodes[opcode];
            let args = [];

            // Handle arguments if there are any
            if (instruction === 'load' || instruction === 'add' || instruction === 'subtract' ||
                instruction === 'multiply' || instruction === 'divide' || instruction === 'exponent' ||
                instruction === 'print') {

                // Collect arguments
                args.push(program[++i]); // Register or Value
                if (instruction !== 'print') {
                    args.push(program[++i]); // Register or Value
                }
            }

            // Create descriptive messages
            let message;
            switch (instruction) {
                case 'load':
                    message = `Load the value ${args[1]} into register ${args[0]}.`;
                    break;
                case 'add':
                    message = `Add the value in register ${args[1]} to the value in register ${args[0]} and store the result in register ${args[0]}.`;
                    break;
                case 'subtract':
                    message = `Subtract the value in register ${args[1]} from the value in register ${args[0]} and store the result in register ${args[0]}.`;
                    break;
                case 'multiply':
                    message = `Multiply the value in register ${args[1]} by the value in register ${args[0]} and store the result in register ${args[0]}.`;
                    break;
                case 'divide':
                    message = `Divide the value in register ${args[0]} by the value in register ${args[1]} and store the result in register ${args[0]}.`;
                    break;
                case 'exponent':
                    message = `Raise the value in register ${args[0]} to the power of the value in register ${args[1]} and store the result in register ${args[0]}.`;
                    break;
                case 'print':
                    message = `Print the value in register ${args[0]}.`;
                    break;
                case 'halt':
                    message = `End of program.`;
                    break;
                default:
                    message = `Unknown instruction ${instruction}.`;
            }

            instructions.push(message);
        } else {
            throw new Error(`Unknown opcode: ${opcode}`);
        }
    }
    return instructions.join('\n');
}

// Read input from stdin
process.stdin.setEncoding('utf8');
console.log('Please paste the program array and press Enter:');

process.stdin.on('data', (input) => {
    try {
        // Remove any extraneous whitespace and parse the input
        const cleanedInput = input.trim().replace(/[\s\n]+/g, ' ');
        const program = JSON.parse(cleanedInput);

        if (!Array.isArray(program) || !program.every(Number.isInteger)) {
            throw new Error('Input must be an array of numbers.');
        }

        // Disassemble the program and output the result
        const disassembledCode = disassemble(program);
        console.log('\nDisassembled Instructions:\n');
        console.log(disassembledCode);
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit();
    }
});
