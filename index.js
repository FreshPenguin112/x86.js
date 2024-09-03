const fs = require('fs');

// Basic RISC-V Emulator
function createRiscVEmulator() {
    const memory = new Uint8Array(1024 * 1024); // 1MB memory
    const registers = new Uint32Array(32); // 32 general-purpose registers
    let pc = 0; // Program counter

    function loadMemory(address, data) {
        memory.set(data, address);
    }

    function getMemory() {
        return memory;
    }

    function getRegisters() {
        return registers;
    }

    function run() {
        while (true) {
            const instruction = memory[pc] | (memory[pc + 1] << 8) | (memory[pc + 2] << 16) | (memory[pc + 3] << 24);
            const opcode = instruction & 0x7F;
            const rd = (instruction >> 7) & 0x1F;
            const rs1 = (instruction >> 15) & 0x1F;
            const rs2 = (instruction >> 20) & 0x1F;
            const imm = (instruction >> 25) & 0x7F;

            switch (opcode) {
                case 0x03: // LOAD
                    registers[rd] = memory[registers[rs1] + imm];
                    break;
                case 0x13: // ADDI
                    registers[rd] = registers[rs1] + imm;
                    break;
                case 0x6F: // JAL
                    registers[rd] = pc + 4;
                    pc += imm;
                    break;
                case 0x67: // JALR
                    registers[rd] = pc + 4;
                    pc = (registers[rs1] + imm) & ~1;
                    break;
                case 0x73: // ECALL (Syscall)
                    const syscall = registers[17];
                    switch (syscall) {
                        case 64: // SYS_write
                            const fd = registers[10];
                            const addr = registers[11];
                            const len = registers[12];
                            console.log(Buffer.from(memory.slice(addr, addr + len)).toString());
                            break;
                        case 93: // SYS_exit
                            return;
                    }
                    break;
                default:
                    console.error(`Unknown opcode: ${opcode}`);
                    return;
            }

            pc += 4; // Move to the next instruction
        }
    }

    return {
        loadMemory,
        getMemory,
        getRegisters,
        run,
        set pc(value) { pc = value; },
    };
}

// ELF Parsing and Loading
function parseElfHeader(buffer) {
    const e_phoff = buffer.readUInt32LE(0x20);
    const e_phentsize = buffer.readUInt16LE(0x36);
    const e_phnum = buffer.readUInt16LE(0x38);
    return { e_phoff, e_phentsize, e_phnum };
}

function parseProgramHeaders(buffer, e_phoff, e_phnum, e_phentsize) {
    const headers = [];
    for (let i = 0; i < e_phnum; i++) {
        const offset = e_phoff + i * e_phentsize;
        const p_type = buffer.readUInt32LE(offset);
        const p_offset = buffer.readUInt32LE(offset + 0x04);
        const p_vaddr = buffer.readUInt32LE(offset + 0x08);
        const p_filesz = buffer.readUInt32LE(offset + 0x20);
        const p_memsz = buffer.readUInt32LE(offset + 0x24);

        if (p_type === 1) { // PT_LOAD
            headers.push({ p_offset, p_vaddr, p_filesz, p_memsz });
        }
    }
    return headers;
}

function loadElfBinary(emulator, binaryData) {
    const buffer = Buffer.from(binaryData);
    const { e_phoff, e_phentsize, e_phnum } = parseElfHeader(buffer);
    const programHeaders = parseProgramHeaders(buffer, e_phoff, e_phnum, e_phentsize);

    programHeaders.forEach(({ p_offset, p_vaddr, p_filesz, p_memsz }) => {
        const segment = buffer.slice(p_offset, p_offset + p_filesz);
        emulator.loadMemory(p_vaddr, segment);
    });

    return programHeaders[0].p_vaddr; // Return the entry point
}

function loadAndRunElfBinary(binaryPath) {
    const binaryData = fs.readFileSync(binaryPath);
    const emulator = createRiscVEmulator();
    const entryPoint = loadElfBinary(emulator, binaryData);
    emulator.pc = entryPoint; // Set PC to the entry point of the ELF binary
    emulator.run();

    console.log('Registers:', emulator.getRegisters());
    console.log('Memory:', emulator.getMemory().slice(0, 64)); // Print first 64 bytes of memory
}

// Command-line Interface
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
