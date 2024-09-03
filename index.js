const fs = require('fs');

const MEMORY_SIZE = 1024;
const REGISTERS_COUNT = 32;

function createRiscVEmulator() {
    const memory = new Uint8Array(MEMORY_SIZE);
    const registers = new Uint32Array(REGISTERS_COUNT);
    let pc = 0;
    let halt = false;

    function loadMemory(address, data) {
        if (address + data.length > MEMORY_SIZE) {
            throw new Error('Memory overflow');
        }
        memory.set(data, address);
    }

    function executeInstruction(instruction) {
        const opcode = instruction & 0x7F;
        const rd = (instruction >> 7) & 0x1F;
        const funct3 = (instruction >> 12) & 0x7;
        const rs1 = (instruction >> 15) & 0x1F;
        const rs2 = (instruction >> 20) & 0x1F;
        const imm = (instruction >> 20) & 0xFFF;
        const immI = (instruction >> 20) & 0xFFF;
        const immS = ((instruction >> 25) & 0x7F) | ((instruction >> 7) & 0x1F) << 5;
        const immB = ((instruction >> 31) << 12) | ((instruction >> 7) & 0x1E) << 4 | ((instruction >> 25) & 0x3F) << 6;
        const immU = instruction >> 12;
        const immJ = ((instruction >> 31) << 19) | ((instruction >> 12) & 0xFF) << 11 | ((instruction >> 20) & 0x1E) << 1 | ((instruction >> 21) & 0x3FF);

        switch (opcode) {
            case 0x33: // R-type
                switch (funct3) {
                    case 0x0:
                        registers[rd] = registers[rs1] + registers[rs2];
                        break;
                    case 0x1:
                        registers[rd] = registers[rs1] - registers[rs2];
                        break;
                    case 0x2:
                        registers[rd] = registers[rs1] * registers[rs2];
                        break;
                    case 0x3:
                        registers[rd] = Math.floor(registers[rs1] / registers[rs2]);
                        break;
                    case 0x7:
                        registers[rd] = registers[rs1] & registers[rs2];
                        break;
                    case 0x6:
                        registers[rd] = registers[rs1] | registers[rs2];
                        break;
                    default:
                        throw new Error(`Unknown R-type funct3 ${funct3}`);
                }
                break;
            case 0x13: // I-type
                switch (funct3) {
                    case 0x0:
                        registers[rd] = registers[rs1] + immI;
                        break;
                    case 0x2:
                        registers[rd] = memory[registers[rs1] + immI];
                        break;
                    case 0x6:
                        registers[rd] = registers[rs1] | immI;
                        break;
                    default:
                        throw new Error(`Unknown I-type funct3 ${funct3}`);
                }
                break;
            case 0x23: // S-type
                if (funct3 === 0x2) {
                    memory[registers[rs1] + immS] = registers[rs2] & 0xFF;
                    memory[registers[rs1] + immS + 1] = (registers[rs2] >> 8) & 0xFF;
                    memory[registers[rs1] + immS + 2] = (registers[rs2] >> 16) & 0xFF;
                    memory[registers[rs1] + immS + 3] = (registers[rs2] >> 24) & 0xFF;
                } else {
                    throw new Error(`Unknown S-type funct3 ${funct3}`);
                }
                break;
            case 0x63: // B-type
                switch (funct3) {
                    case 0x0:
                        if (registers[rs1] === registers[rs2]) {
                            pc += immB;
                        }
                        break;
                    default:
                        throw new Error(`Unknown B-type funct3 ${funct3}`);
                }
                break;
            case 0x37: // U-type (LUI)
                registers[rd] = immU << 12;
                break;
            case 0x6F: // J-type (JAL)
                registers[rd] = pc + 4;
                pc += immJ;
                break;
            case 0x73: // System
                if (funct3 === 0x0) {
                    halt = true;
                } else {
                    throw new Error(`Unknown system funct3 ${funct3}`);
                }
                break;
            default:
                throw new Error(`Unknown opcode ${opcode}`);
        }
    }

    function run() {
        while (pc < MEMORY_SIZE && !halt) {
            const instruction = memory[pc] | (memory[pc + 1] << 8) | (memory[pc + 2] << 16) | (memory[pc + 3] << 24);
            executeInstruction(instruction);
            pc += 4;
        }
    }

    return {
        loadMemory,
        run,
        getRegisters: () => registers,
        getMemory: () => memory
    };
}

// Convert assembly code to machine code
function assemble(assemblyCode) {
    const lines = assemblyCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const program = [];
    const opcodeMap = {
        'add': 0x33,
        'sub': 0x33,
        'mul': 0x33,
        'div': 0x33,
        'lw': 0x03,
        'sw': 0x23,
        'beq': 0x63,
        'addi': 0x13,
        'lui': 0x37,
        'jal': 0x6F,
        'print': 0x73
    };

    lines.forEach(line => {
        const [opcode, ...operands] = line.split(' ');
        const opcodeValue = opcodeMap[opcode];
        if (opcodeValue === undefined) throw new Error(`Unknown opcode ${opcode}`);

        switch (opcode) {
            case 'addi':
                const [reg, imm] = operands[0].split(',').map(Number);
                program.push(opcodeValue, reg, imm);
                break;
            case 'lw':
                const [reg1, address] = operands[0].split(',').map(Number);
                program.push(opcodeValue, reg1, address);
                break;
            case 'sw':
                const [reg2, address2] = operands[0].split(',').map(Number);
                program.push(opcodeValue, reg2, address2);
                break;
            case 'beq':
                const [regA, regB, offset] = operands.map(Number);
                program.push(opcodeValue, regA, regB, offset);
                break;
            case 'lui':
                const [regL, immL] = operands[0].split(',').map(Number);
                program.push(opcodeValue, regL, immL);
                break;
            case 'jal':
                const [regJ, offsetJ] = operands.map(Number);
                program.push(opcodeValue, regJ, offsetJ);
                break;
            case 'print':
                const [regPrint] = operands.map(Number);
                program.push(opcodeValue, regPrint);
                break;
            default:
                if (opcode === 'add' || opcode === 'sub' || opcode === 'mul' || opcode === 'div') {
                    const [rd, rs1, rs2] = operands.map(Number);
                    program.push(opcodeValue, rd, rs1, rs2);
                } else {
                    throw new Error(`Unknown opcode ${opcode}`);
                }
        }
    });

    return new Uint8Array(program);
}

// Read a binary file and execute it
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Usage: node index.js <binary-file>');
    process.exit(1);
}

const binaryFilePath = args[0];
if (!fs.existsSync(binaryFilePath)) {
    console.error(`File not found: ${binaryFilePath}`);
    process.exit(1);
}

const binaryCode = fs.readFileSync(binaryFilePath);
const emulator = createRiscVEmulator();
emulator.loadMemory(0, new Uint8Array(binaryCode));
emulator.run();

console.log('Registers:', emulator.getRegisters());
console.log('Memory:', emulator.getMemory());
