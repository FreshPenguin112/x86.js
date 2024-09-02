// main.js
const fs = require('fs');
const path = require('path');
const CPU = require('./cpu');
const decode = require('./decoder');

const cpu = new CPU();

const program = process.argv[2] ? fs.readFileSync(path.join(__dirname, process.argv[2])).toString() : `
    MOV eax, 0x5
    MOV ebx, 0x3
    ADD eax, ebx
    SUB eax, 0x1
    MUL eax, 0x2
    MOV [0x300], eax
    JMP 0x0
`;

const instructions = program.split('\n').map(line => line.trim()).filter(line => line);

function execute(cpu) {
    while (cpu.ip < instructions.length) {
        const instruction = instructions[cpu.ip];
        decode(cpu, instruction);
        cpu.ip++;
    }
    console.log(cpu.registers);
    console.log(cpu.memory.slice(0, 0x310)); // Print the first 0x310 bytes of memory
}

execute(cpu);