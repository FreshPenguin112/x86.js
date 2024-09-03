const fs = require('fs');

// Constants for ELF parsing
const ELF_MAGIC = [0x7F, 'E'.charCodeAt(0), 'L'.charCodeAt(0), 'F'.charCodeAt(0)];
const MEMORY_SIZE = 1024 * 1024; // 1 MB
const REGISTERS_COUNT = 32;
const ELF_HEADER_SIZE = 64;
const PROGRAM_HEADER_SIZE = 56;
const PROGRAM_HEADER_OFFSET = 0x20;
const OPCODES = {
    R: 0x33,
    I: 0x13,
    S: 0x23,
    B: 0x63,
    U: 0x37,
    J: 0x6F,
    SYSTEM: 0x73
};

// Helper function to read a 32-bit little-endian integer
function readUInt32LE(buffer, offset) {
    return buffer.readUInt32LE(offset);
}

// Helper function to read a 16-bit little-endian integer
function readUInt16LE(buffer, offset) {
    return buffer.readUInt16LE(offset);
}

// Create a RISC-V CPU emulator
function createRiscVEmulator() {
    const memory = new Uint8Array(MEMORY_SIZE);
    const registers = new Uint32Array(REGISTERS_COUNT);
    let pc = 0; // Program Counter
    let halt = false; // Flag to stop execution

    function loadMemory(address, data) {
        if (address + data.length > MEMORY_SIZE) {
            throw new Error('Memory overflow');
        }
        memory.set(data, address);
    }

    function getRegisterValue(register) {
        return registers[register] >>> 0;
    }

    function signExtend(value, bits) {
        const signBit = 1 << (bits - 1);
        return (value & (signBit - 1)) - (value & signBit);
    }

    function executeInstruction(instruction) {
        const opcode = instruction & 0x7F;
        const rd = (instruction >> 7) & 0x1F;
        const funct3 = (instruction >> 12) & 0x7;
        const rs1 = (instruction >> 15) & 0x1F;
        const rs2 = (instruction >> 20) & 0x1F;
        const imm = signExtend((instruction >> 20), 12);

        switch (opcode) {
            case OPCODES.R: // R-type instructions
                switch (funct3) {
                    case 0x0: // ADD, SUB
                        if ((instruction >> 30) & 0x1) {
                            registers[rd] = getRegisterValue(rs1) - getRegisterValue(rs2);
                        } else {
                            registers[rd] = getRegisterValue(rs1) + getRegisterValue(rs2);
                        }
                        break;
                    case 0x1: // SLL (Shift Left Logical)
                        registers[rd] = getRegisterValue(rs1) << (getRegisterValue(rs2) & 0x1F);
                        break;
                    case 0x2: // SLT (Set Less Than)
                        registers[rd] = getRegisterValue(rs1) < getRegisterValue(rs2) ? 1 : 0;
                        break;
                    case 0x4: // XOR (Exclusive OR)
                        registers[rd] = getRegisterValue(rs1) ^ getRegisterValue(rs2);
                        break;
                    case 0x5: // SRL (Shift Right Logical)
                        registers[rd] = getRegisterValue(rs1) >>> (getRegisterValue(rs2) & 0x1F);
                        break;
                    case 0x6: // OR (Logical OR)
                        registers[rd] = getRegisterValue(rs1) | getRegisterValue(rs2);
                        break;
                    case 0x7: // AND (Logical AND)
                        registers[rd] = getRegisterValue(rs1) & getRegisterValue(rs2);
                        break;
                    default:
                        throw new Error(`Unknown R-type funct3 ${funct3}`);
                }
                break;
            case OPCODES.I: // I-type instructions
                switch (funct3) {
                    case 0x0: // ADDI (Add Immediate)
                        registers[rd] = getRegisterValue(rs1) + imm;
                        break;
                    case 0x1: // SLLI (Shift Left Logical Immediate)
                        registers[rd] = getRegisterValue(rs1) << (imm & 0x1F);
                        break;
                    case 0x2: // SLTI (Set Less Than Immediate)
                        registers[rd] = getRegisterValue(rs1) < imm ? 1 : 0;
                        break;
                    case 0x4: // XORI (Exclusive OR Immediate)
                        registers[rd] = getRegisterValue(rs1) ^ imm;
                        break;
                    case 0x5: // SRLI (Shift Right Logical Immediate)
                        registers[rd] = getRegisterValue(rs1) >>> (imm & 0x1F);
                        break;
                    case 0x6: // ORI (Logical OR Immediate)
                        registers[rd] = getRegisterValue(rs1) | imm;
                        break;
                    case 0x7: // ANDI (Logical AND Immediate)
                        registers[rd] = getRegisterValue(rs1) & imm;
                        break;
                    default:
                        throw new Error(`Unknown I-type funct3 ${funct3}`);
                }
                break;
            case OPCODES.S: // S-type instructions
                switch (funct3) {
                    case 0x2: // SW (Store Word)
                        const storeAddress = getRegisterValue(rs1) + imm;
                        memory[storeAddress] = getRegisterValue(rs2) & 0xFF;
                        memory[storeAddress + 1] = (getRegisterValue(rs2) >> 8) & 0xFF;
                        memory[storeAddress + 2] = (getRegisterValue(rs2) >> 16) & 0xFF;
                        memory[storeAddress + 3] = (getRegisterValue(rs2) >> 24) & 0xFF;
                        break;
                    default:
                        throw new Error(`Unknown S-type funct3 ${funct3}`);
                }
                break;
            case OPCODES.B: // B-type instructions
                switch (funct3) {
                    case 0x0: // BEQ (Branch if Equal)
                        if (getRegisterValue(rs1) === getRegisterValue(rs2)) {
                            pc += imm;
                        }
                        break;
                    case 0x1: // BNE (Branch if Not Equal)
                        if (getRegisterValue(rs1) !== getRegisterValue(rs2)) {
                            pc += imm;
                        }
                        break;
                    default:
                        throw new Error(`Unknown B-type funct3 ${funct3}`);
                }
                break;
            case OPCODES.U: // U-type instructions
                switch (funct3) {
                    case 0x0: // LUI (Load Upper Immediate)
                        registers[rd] = imm << 12;
                        break;
                    default:
                        throw new Error(`Unknown U-type funct3 ${funct3}`);
                }
                break;
            case OPCODES.J: // J-type instructions
                switch (funct3) {
                    case 0x0: // JAL (Jump and Link)
                        registers[rd] = pc + 4;
                        pc += imm;
                        break;
                    default:
                        throw new Error(`Unknown J-type funct3 ${funct3}`);
                }
                break;
            case OPCODES.SYSTEM: // SYSTEM instructions
                switch (funct3) {
                    case 0x0: // ECALL (Environment Call)
                        halt = true;
                        break;
                    default:
                        throw new Error(`Unknown SYSTEM funct3 ${funct3}`);
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

// Parse ELF header
function parseElfHeader(buffer) {
    const magic = buffer.slice(0, 4);
    if (!magic.every((val, idx) => val === ELF_MAGIC[idx])) {
        throw new Error('Invalid ELF file');
    }

    const entry = readUInt32LE(buffer, 0x18);
    const phOffset = readUInt32LE(buffer, 0x1C);
    const phNum = readUInt16LE(buffer, 0x2A);
    const phSize = readUInt16LE(buffer, 0x2E);

    return { entry, phOffset, phNum, phSize };
}

// Parse program headers
function parseProgramHeaders(buffer, phOffset, phNum, phSize) {
    const programHeaders = [];
    for (let i = 0; i < phNum; i++) {
        const offset = phOffset + i * phSize;
        const type = readUInt32LE(buffer, offset);
        const pOffset = readUInt32LE(buffer, offset + 0x04);
        const pVAddr = readUInt32LE(buffer, offset + 0x08);
        const pFilesz = readUInt32LE(buffer, offset + 0x20);
        const pMemsz = readUInt32LE(buffer, offset + 0x24);

        if (type === 1) { // PT_LOAD
            programHeaders.push({
                pOffset, pVAddr, pFilesz, pMemsz
            });
        }
    }
    return programHeaders;
}

// Load ELF binary into emulator memory
function loadElfBinary(emulator, binaryData) {
    const buffer = Buffer.from(binaryData);
    const { entry, phOffset, phNum, phSize } = parseElfHeader(buffer);
    const programHeaders = parseProgramHeaders(buffer, phOffset, phNum, phSize);

    programHeaders.forEach(({ pOffset, pVAddr, pFilesz, pMemsz }) => {
        const segment = buffer.slice(pOffset, pOffset + pFilesz);
        emulator.loadMemory(pVAddr, segment);
    });

    return entry;
}

// Main function to load and run RISC-V ELF binary
function loadAndRunElfBinary(binaryPath) {
    const binaryData = fs.readFileSync(binaryPath);
    const emulator = createRiscVEmulator();
    const entryPoint = loadElfBinary(emulator, binaryData);
    emulator.pc = entryPoint; // Set PC to the entry point of the ELF binary
    emulator.run();

    console.log('Registers:', emulator.getRegisters());
    console.log('Memory:', emulator.getMemory().slice(0, 64)); // Print first 64 bytes of memory
}

// Get the binary file path from command line arguments
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

loadAndRunElfBinary(binaryFilePath);
