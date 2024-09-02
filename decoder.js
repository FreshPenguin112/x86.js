// decoder.js

const { mov, add, sub, mul, jmp } = require('./instructions');

function decode(cpu, instruction) {
    const [op, ...args] = instruction.split(' ');

    switch (op.toUpperCase()) {
        case 'MOV':
            mov(cpu, args[0], args[1].startsWith('0x') ? parseInt(args[1], 16) : args[1]);
            break;
        case 'ADD':
            add(cpu, args[0], args[1].startsWith('0x') ? parseInt(args[1], 16) : args[1]);
            break;
        case 'SUB':
            sub(cpu, args[0], args[1].startsWith('0x') ? parseInt(args[1], 16) : args[1]);
            break;
        case 'MUL':
            mul(cpu, args[0], args[1].startsWith('0x') ? parseInt(args[1], 16) : args[1]);
            break;
        case 'JMP':
            jmp(cpu, parseInt(args[0], 16));
            break;
        default:
            throw new Error(`Unknown instruction: ${op}`);
    }
}

module.exports = decode;