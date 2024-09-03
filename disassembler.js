// disassembler.js

const opcodes = {
    0x01: 'LOAD',        // Load a value into a register
    0x02: 'ADD',         // Add values of two registers
    0x03: 'SUBTRACT',    // Subtract values of two registers
    0x04: 'MULTIPLY',    // Multiply values of two registers
    0x05: 'DIVIDE',      // Divide values of two registers
    0x06: 'EXPONENTIATE',// Raise value in a register to the power of another register
    0x07: 'HALT',        // Stop execution
    0x08: 'PRINT',       // Output the value of a register
};

function disassemble(program) {
    const instructions = [];
    for (let i = 0; i < program.length; i++) {
        const opcode = program[i];
        if (opcodes[opcode]) {
            const instruction = opcodes[opcode];
            let args = [];

            // Handle arguments if there are any
            if (instruction === 'LOAD' || instruction === 'ADD' || instruction === 'SUBTRACT' ||
                instruction === 'MULTIPLY' || instruction === 'DIVIDE' || instruction === 'EXPONENTIATE' ||
                instruction === 'PRINT') {

                // Collect arguments
                args.push(program[++i]); // Register or Value
                if (instruction !== 'PRINT') {
                    args.push(program[++i]); // Register or Value
                }
            }

            // Create descriptive messages
            let message;
            switch (instruction) {
                case 'LOAD':
                    message = `Load the value ${args[1]} into register ${args[0]}.`;
                    break;
                case 'ADD':
                    message = `Add the value in register ${args[1]} to the value in register ${args[0]} and store the result in register ${args[0]}.`;
                    break;
                case 'SUBTRACT':
                    message = `Subtract the value in register ${args[1]} from the value in register ${args[0]} and store the result in register ${args[0]}.`;
                    break;
                case 'MULTIPLY':
                    message = `Multiply the value in register ${args[1]} by the value in register ${args[0]} and store the result in register ${args[0]}.`;
                    break;
                case 'DIVIDE':
                    message = `Divide the value in register ${args[0]} by the value in register ${args[1]} and store the result in register ${args[0]}.`;
                    break;
                case 'EXPONENTIATE':
                    message = `Raise the value in register ${args[0]} to the power of the value in register ${args[1]} and store the result in register ${args[0]}.`;
                    break;
                case 'PRINT':
                    message = `Print the value in register ${args[0]}.`;
                    break;
                case 'HALT':
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
