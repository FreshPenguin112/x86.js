class CPU {
    constructor() {
        this.registers = []; // Start with an empty array of registers
        this.pc = 0; // Program Counter
        this.memory = [];
    }

    loadProgram(program) {
        this.memory = program;
        this.pc = 0;
    }

    execute() {
        while (this.pc < this.memory.length) {
            const instruction = this.memory[this.pc++];
            switch (instruction) {
                case 0x01: // LOAD constant into register
                    const reg = this.memory[this.pc++];
                    const value = this.memory[this.pc++];
                    this.setRegister(reg, value);
                    break;
                case 0x02: // ADD (using bitwise operations)
                    const reg1 = this.memory[this.pc++];
                    const reg2 = this.memory[this.pc++];
                    this.setRegister(reg1, this.add(this.getRegister(reg1), this.getRegister(reg2)));
                    break;
                case 0x03: // SUBTRACT (using bitwise operations)
                    const reg3 = this.memory[this.pc++];
                    const reg4 = this.memory[this.pc++];
                    this.setRegister(reg3, this.subtract(this.getRegister(reg3), this.getRegister(reg4)));
                    break;
                case 0x04: // MULTIPLY (using bitwise operations)
                    const reg5 = this.memory[this.pc++];
                    const reg6 = this.memory[this.pc++];
                    this.setRegister(reg5, this.multiply(this.getRegister(reg5), this.getRegister(reg6)));
                    break;
                case 0x05: // DIVIDE (using bitwise operations)
                    const reg7 = this.memory[this.pc++];
                    const reg8 = this.memory[this.pc++];
                    this.setRegister(reg7, this.divide(this.getRegister(reg7), this.getRegister(reg8)));
                    break;
                case 0x06: // EXPONENT (using bitwise operations)
                    const reg9 = this.memory[this.pc++];
                    const reg10 = this.memory[this.pc++];
                    this.setRegister(reg9, this.exponent(this.getRegister(reg9), this.getRegister(reg10)));
                    break;
                case 0x07: // HALT
                    return;
                case 0x08: // PRINT
                    const regToPrint = this.memory[this.pc++];
                    console.log(this.getRegister(regToPrint));
                    break;
                case 0x09: // LOAD variable into register
                    const varReg = this.memory[this.pc++];
                    const loadReg = this.memory[this.pc++];
                    this.setRegister(loadReg, this.getRegister(varReg));
                    break;
                default:
                    throw new Error(`Unknown instruction: ${instruction}`);
            }
        }
    }

    // Helper function to get a register value, initializing it to 0 if it doesn't exist
    getRegister(reg) {
        if (typeof this.registers[reg] === 'undefined') {
            this.registers[reg] = 0;
        }
        return this.registers[reg];
    }

    // Helper function to set a register value
    setRegister(reg, value) {
        this.registers[reg] = value;
    }

    // Bitwise Addition (using bitwise operators)
    add(a, b) {
        return a + b
    }

    // Bitwise Subtraction (using bitwise operators)
    subtract(a, b) {
        return a - b
    }

    // Bitwise Multiplication (using bitwise shift and add)
    multiply(a, b) {
        return a * b
    }

    // Bitwise Division (using bitwise shift and subtract)
    divide(a, b) {
        return a / b 
    }

    // Exponentiation by squaring (bitwise method)
    exponent(a, b) {
        return b ** a
    }
}

module.exports = CPU;
