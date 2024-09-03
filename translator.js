class Translator {
    constructor() {
        this.varMap = new Map(); // To store variable names and their corresponding registers
        this.registerCounter = -1; // To assign registers to variables
        this.program = []; // The resulting program in machine code
    }

    translate(jsCode) {
        const lines = jsCode.split(';').map(line => line.trim()).filter(line => line);

        lines.forEach(line => {
            this.parseLine(line);
        });

        // Add HALT at the end of the program
        this.program.push(0x07);

        return this.program;
    }

    parseLine(line) {
        if (line.startsWith('let ')) {
            this.handleVariableDeclaration(line);
        } else if (line.includes('=')) {
            this.handleAssignment(line);
        } else if (line.startsWith('console.log')) {
            this.handleConsoleLog(line);
        } else {
            throw new Error(`Unsupported JS code: ${line}`);
        }
    }

    handleVariableDeclaration(line) {
        const match = line.match(/let (\w+) \= (.+)/);
        if (match) {
            const variableName = match[1];
            const expression = match[2];
            this.varMap.set(variableName, this.registerCounter);
            this.registerCounter++;
            this.handleExpression(expression, variableName);
        } else {
            throw new Error(`Invalid variable declaration: ${line}`);
        }
    }

    handleAssignment(line) {
        const [variable, expression] = line.split('=').map(part => part.trim());
        this.handleExpression(expression, variable);
    }

    handleExpression(expression, variable) {
        // Evaluate the expression with proper precedence
        const resultRegister = this.evaluateExpression(expression);
        this.varMap.set(variable, resultRegister);
    }

    evaluateExpression(expression) {
        // Parse and evaluate the expression respecting PEMDAS
        const tokens = this.tokenizeExpression(expression);
        const outputQueue = [];
        const operatorStack = [];

        const precedence = {
            '^': 4,
            '**': 4,
            '*': 3,
            '/': 3,
            '+': 2,
            '-': 2
        };

        const associativity = {
            '^': 'Right',
            '**': 'Right',
            '*': 'Left',
            '/': 'Left',
            '+': 'Left',
            '-': 'Left'
        };

        for (let token of tokens) {
            if (!isNaN(token)) {
                // Token is a number, push to output queue
                outputQueue.push(token);
            } else if (this.varMap.has(token)) {
                // Token is a variable, push to output queue
                outputQueue.push(this.varMap.get(token));
            } else if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.pop(); // Pop the '('
            } else {
                // Operator token
                while (operatorStack.length && precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]) {
                    if (associativity[token] === 'Left' && precedence[operatorStack[operatorStack.length - 1]] === precedence[token]) {
                        outputQueue.push(operatorStack.pop());
                    } else {
                        break;
                    }
                }
                operatorStack.push(token);
            }
        }

        while (operatorStack.length) {
            outputQueue.push(operatorStack.pop());
        }

        // Evaluate the output queue (Reverse Polish Notation)
        const evalStack = [];
        outputQueue.forEach(token => {
            if (!isNaN(token)) {
                // Token is a number, load it into a register
                const register = this.registerCounter++;
                this.program.push(0x01, register, parseInt(token, 10));
                evalStack.push(register);
            } else if (typeof token === 'number') {
                // Token is a variable/register, push to stack
                evalStack.push(token);
            } else {
                // Token is an operator
                const rightRegister = evalStack.pop();
                const leftRegister = evalStack.pop();
                let instruction = null;
                if (token === '+') instruction = 0x02; // ADD
                else if (token === '-') instruction = 0x03; // SUBTRACT
                else if (token === '*') instruction = 0x04; // MULTIPLY
                else if (token === '/') instruction = 0x05; // DIVIDE
                else if (token === '**' || token === '^') instruction = 0x06; // EXPONENT

                if (instruction) {
                    this.program.push(instruction, leftRegister, rightRegister);
                    evalStack.push(leftRegister); // The result is stored in the left register
                } else {
                    throw new Error(`Unsupported operator: ${token}`);
                }
            }
        });

        // The final result should be in the last register in the stack
        return evalStack.pop();
    }

    tokenizeExpression(expression) {
        // This method tokenizes the expression, taking into account parentheses and operators
        const regex = /([0-9]+|\+|\-|\*{1,2}|\/)/g;
        return expression.match(regex);
    }

    handleConsoleLog(line) {
        const match = line.match(/console\.log\((\s*\w+\s*)\)/);
        if (match) {
            const variable = match[1].trim(); // Trim any surrounding whitespace
            if (this.varMap.has(variable)) {
                const register = this.varMap.get(variable);
                this.program.push(0x08, register); // PRINT instruction
            } else {
                throw new Error(`Undefined variable: ${variable}`);
            }
        } else {
            throw new Error(`Invalid console.log statement: ${line}`);
        }
    }
}

module.exports = Translator;
