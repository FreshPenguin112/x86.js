const fs = require('fs');

const MEMORY_SIZE = 10 * 1024 * 1024; // 10 MB
const memory = Buffer.alloc(MEMORY_SIZE);
const registers = {
    rax: 0, rcx: 0, rdx: 0, rbx: 0, rsp: MEMORY_SIZE - 8, rbp: 0, rsi: 0, rdi: 0,
    r8: 0, r9: 0, r10: 0, r11: 0, r12: 0, r13: 0, r14: 0, r15: 0, rip: 0, rflags: 0
};

// ELF Parsing
function readELF(filename) {
    const buffer = fs.readFileSync(filename);

    // ELF Header
    const e_ident = buffer.slice(0, 16);
    const e_entry = buffer.readUInt32LE(24);
    const e_shoff = buffer.readUInt32LE(32);
    const e_shentsize = buffer.readUInt16LE(46);
    const e_shnum = buffer.readUInt16LE(48);

    // Section Headers
    const sections = [];
    for (let i = 0; i < e_shnum; i++) {
        const offset = e_shoff + i * e_shentsize;
        const sh_offset = buffer.readUInt32LE(offset + 16);
        const sh_size = buffer.readUInt32LE(offset + 20);

        sections.push({ sh_offset, sh_size });
    }

    // Load sections into memory
    sections.forEach(section => {
        if (section.sh_offset > 0 && section.sh_size > 0) {
            buffer.copy(memory, section.sh_offset, section.sh_offset, section.sh_offset + section.sh_size);
        }
    });

    return { entryPoint: e_entry };
}

// Instruction Decoding
function decodeInstruction(ip) {
    const opcode = memory[ip];
    switch (opcode) {
        case 0xB8: // MOV r/m32, imm32
            const reg = (memory[ip + 1] & 0xF8) >> 3;
            const imm = memory.readUInt32LE(ip + 2);
            registers[`r${reg}`] = imm;
            return ip + 6;
        case 0x48: // REX prefix
            return ip + 1;
        case 0xC3: // RET
            const retAddress = memory.readUInt32LE(registers.rsp);
            registers.rsp += 8;
            return retAddress;
        case 0x90: // NOP
            return ip + 1;
        case 0x01: // add r/m32, r32
            // For simplicity, handle a specific example
            const reg1 = (memory[ip + 1] & 0xF8) >> 3;
            const reg2 = (memory[ip + 1] & 0x07);
            registers[`r${reg1}`] += registers[`r${reg2}`];
            return ip + 2;
        default:
            throw new Error(`Unknown opcode ${opcode.toString(16)} at address ${ip.toString(16)}`);
    }
}

// Execute
function execute() {
    let ip = registers.rip;

    while (true) {
        try {
            ip = decodeInstruction(ip);
            if (ip === undefined || ip >= MEMORY_SIZE) break;
            registers.rip = ip;
        } catch (err) {
            console.error(`Error executing instruction at ${registers.rip.toString(16)}: ${err.message}`);
            break;
        }
    }
}

// Main
function main() {
    if (process.argv.length < 3) {
        console.error('Usage: node emulator.js <ELF file>');
        process.exit(1);
    }

    const filename = process.argv[2];
    const { entryPoint } = readELF(filename);

    registers.rip = entryPoint;
    execute();

    console.log('Execution completed.');
    console.log('Registers:', registers);
}

main();
