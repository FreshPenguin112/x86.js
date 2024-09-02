// cpu.js

class CPU {
    constructor() {
        this.registers = {
            eax: 0,
            ebx: 0,
            ecx: 0,
            edx: 0,
            esi: 0,
            edi: 0,
            esp: 0,
            ebp: 0,
        };

        this.flags = {
            zero: false,
            carry: false,
            sign: false,
            overflow: false,
        };

        this.memory = new Uint8Array(1024 * 1024); // 1 MB memory
        this.ip = 0; // Instruction Pointer
    }

    handleInterrupt(interruptNumber) {
        if (interruptNumber === 0x80) {
            this.syscall();
        }
    }

    syscall() {
        console.log("System call triggered!");
        // Implement system call logic here
    }
}

module.exports = CPU;