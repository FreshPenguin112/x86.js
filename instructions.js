// instructions.js

function mov(cpu, dest, src) {
    if (typeof src === 'number') {
        if (dest.startsWith('[')) {
            // Memory write
            const address = parseInt(dest.slice(1, -1), 16);
            cpu.memory[address] = src;
        } else {
            cpu.registers[dest] = src;
        }
    } else {
        if (src.startsWith('[')) {
            // Memory read
            const address = parseInt(src.slice(1, -1), 16);
            cpu.registers[dest] = cpu.memory[address];
        } else {
            cpu.registers[dest] = cpu.registers[src];
        }
    }
}

function add(cpu, dest, src) {
    const result = cpu.registers[dest] + (typeof src === 'number' ? src : cpu.registers[src]);
    cpu.registers[dest] = result;
    cpu.flags.zero = (result === 0);
    cpu.flags.sign = (result < 0);
    // Add logic for carry and overflow
}

function sub(cpu, dest, src) {
    const result = cpu.registers[dest] - (typeof src === 'number' ? src : cpu.registers[src]);
    cpu.registers[dest] = result;
    cpu.flags.zero = (result === 0);
    cpu.flags.sign = (result < 0);
    // Add logic for carry and overflow
}

function mul(cpu, dest, src) {
    const result = cpu.registers[dest] * (typeof src === 'number' ? src : cpu.registers[src]);
    cpu.registers[dest] = result;
    cpu.flags.zero = (result === 0);
    cpu.flags.sign = (result < 0);
    // Add logic for carry and overflow
}

function jmp(cpu, address) {
    cpu.ip = address;
}

module.exports = { mov, add, sub, mul, jmp };