class LogoInterpreter {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.turtle = document.getElementById('turtle');
        this.output = document.getElementById('output');
        
        // Turtle state
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.angle = 0; // 0 degrees = pointing up
        this.penDown = true;
        this.penColor = '#00ff00';
        this.turtleVisible = true;
        
        // DOS Logo color palette (16 colors)
        this.colors = [
            '#000000', '#0000aa', '#00aa00', '#00aaaa',
            '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
            '#555555', '#5555ff', '#55ff55', '#55ffff',
            '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
        ];
        
        // SVG path for download
        this.svgPaths = [];
        
        this.init();
    }
    
    init() {
        this.updateTurtlePosition();
        this.clearCanvas();
        this.setupEventListeners();
        this.log('Logo interpreter ready. Enter commands above.');
    }
    
    setupEventListeners() {
        document.getElementById('runButton').addEventListener('click', () => {
            const commands = document.getElementById('commandInput').value;
            this.executeCommands(commands);
        });
        
        document.getElementById('clearButton').addEventListener('click', () => {
            this.clearScreen();
        });
        
        document.getElementById('homeButton').addEventListener('click', () => {
            this.home();
        });
        
        document.getElementById('downloadPNG').addEventListener('click', () => {
            this.downloadPNG();
        });
        
        document.getElementById('downloadSVG').addEventListener('click', () => {
            this.downloadSVG();
        });
        
        // Allow Enter to run commands (Ctrl+Enter for new line)
        document.getElementById('commandInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.ctrlKey) {
                e.preventDefault();
                document.getElementById('runButton').click();
            }
        });
    }
    
    log(message) {
        this.output.textContent += message + '\n';
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.svgPaths = [];
    }
    
    updateTurtlePosition() {
        this.turtle.style.left = (this.x - 10) + 'px';
        this.turtle.style.top = (this.y - 10) + 'px';
        this.turtle.style.transform = `rotate(${this.angle}deg)`;
        this.turtle.style.display = this.turtleVisible ? 'block' : 'none';
    }
    
    executeCommands(commandString) {
        try {
            const commands = this.parseCommands(commandString);
            this.runCommands(commands);
        } catch (error) {
            this.log('Error: ' + error.message);
        }
    }
    
    parseCommands(commandString) {
        // Clean up the command string
        commandString = commandString.toUpperCase().trim();
        
        // Handle REPEAT commands
        commandString = this.expandRepeats(commandString);
        
        // Split into individual commands
        const tokens = commandString.split(/\s+/);
        const commands = [];
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (this.isCommand(token)) {
                const command = { name: token };
                
                // Check if command needs a parameter
                if (this.needsParameter(token) && i + 1 < tokens.length) {
                    const param = parseFloat(tokens[i + 1]);
                    if (!isNaN(param)) {
                        command.param = param;
                        i++; // Skip the parameter token
                    }
                }
                
                commands.push(command);
            }
        }
        
        return commands;
    }
    
    expandRepeats(commandString) {
        const repeatRegex = /REPEAT\s+(\d+)\s*\[([^\]]+)\]/g;
        
        return commandString.replace(repeatRegex, (match, count, commands) => {
            const repeatCount = parseInt(count);
            let expanded = '';
            
            for (let i = 0; i < repeatCount; i++) {
                expanded += commands + ' ';
            }
            
            return expanded;
        });
    }
    
    isCommand(token) {
        const commands = [
            'FORWARD', 'FD', 'BACK', 'BK', 'RIGHT', 'RT', 'LEFT', 'LT',
            'PENUP', 'PU', 'PENDOWN', 'PD', 'HOME', 'CLEARSCREEN', 'CS',
            'HIDETURTLE', 'HT', 'SHOWTURTLE', 'ST', 'SETPENCOLOR'
        ];
        return commands.includes(token);
    }
    
    needsParameter(command) {
        const paramCommands = [
            'FORWARD', 'FD', 'BACK', 'BK', 'RIGHT', 'RT', 'LEFT', 'LT', 'SETPENCOLOR'
        ];
        return paramCommands.includes(command);
    }
    
    runCommands(commands) {
        commands.forEach(command => {
            this.executeCommand(command);
        });
    }
    
    executeCommand(command) {
        const { name, param } = command;
        
        switch (name) {
            case 'FORWARD':
            case 'FD':
                this.forward(param || 0);
                break;
            case 'BACK':
            case 'BK':
                this.forward(-(param || 0));
                break;
            case 'RIGHT':
            case 'RT':
                this.right(param || 0);
                break;
            case 'LEFT':
            case 'LT':
                this.left(param || 0);
                break;
            case 'PENUP':
            case 'PU':
                this.penUp();
                break;
            case 'PENDOWN':
            case 'PD':
                this.penDown();
                break;
            case 'HOME':
                this.home();
                break;
            case 'CLEARSCREEN':
            case 'CS':
                this.clearScreen();
                break;
            case 'HIDETURTLE':
            case 'HT':
                this.hideTurtle();
                break;
            case 'SHOWTURTLE':
            case 'ST':
                this.showTurtle();
                break;
            case 'SETPENCOLOR':
                this.setPenColor(param || 0);
                break;
            default:
                this.log(`Unknown command: ${name}`);
        }
    }
    
    forward(distance) {
        const oldX = this.x;
        const oldY = this.y;
        
        // Convert angle to radians (Logo 0° = up, clockwise)
        const radians = (this.angle - 90) * Math.PI / 180;
        
        this.x += distance * Math.cos(radians);
        this.y += distance * Math.sin(radians);
        
        // Keep turtle within canvas bounds
        this.x = Math.max(0, Math.min(this.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas.height, this.y));
        
        if (this.penDown) {
            this.drawLine(oldX, oldY, this.x, this.y);
        }
        
        this.updateTurtlePosition();
        this.log(`FORWARD ${distance}`);
    }
    
    right(degrees) {
        this.angle = (this.angle + degrees) % 360;
        this.updateTurtlePosition();
        this.log(`RIGHT ${degrees}`);
    }
    
    left(degrees) {
        this.angle = (this.angle - degrees + 360) % 360;
        this.updateTurtlePosition();
        this.log(`LEFT ${degrees}`);
    }
    
    penUp() {
        this.penDown = false;
        this.log('PENUP');
    }
    
    penDown() {
        this.penDown = true;
        this.log('PENDOWN');
    }
    
    home() {
        const oldX = this.x;
        const oldY = this.y;
        
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.angle = 0;
        
        if (this.penDown) {
            this.drawLine(oldX, oldY, this.x, this.y);
        }
        
        this.updateTurtlePosition();
        this.log('HOME');
    }
    
    clearScreen() {
        this.clearCanvas();
        this.log('CLEARSCREEN');
    }
    
    hideTurtle() {
        this.turtleVisible = false;
        this.updateTurtlePosition();
        this.log('HIDETURTLE');
    }
    
    showTurtle() {
        this.turtleVisible = true;
        this.updateTurtlePosition();
        this.log('SHOWTURTLE');
    }
    
    setPenColor(colorIndex) {
        const index = Math.floor(colorIndex) % this.colors.length;
        this.penColor = this.colors[index];
        this.log(`SETPENCOLOR ${colorIndex}`);
    }
    
    drawLine(x1, y1, x2, y2) {
        this.ctx.strokeStyle = this.penColor;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        // Store for SVG export
        this.svgPaths.push({
            x1, y1, x2, y2,
            color: this.penColor
        });
    }
    
    downloadPNG() {
        const link = document.createElement('a');
        link.download = 'logo-drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
        this.log('Downloaded PNG image');
    }
    
    downloadSVG() {
        const svg = this.generateSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = 'logo-drawing.svg';
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        this.log('Downloaded SVG image');
    }
    
    generateSVG() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#000000"/>`;
        
        this.svgPaths.forEach(path => {
            svg += `
<line x1="${path.x1}" y1="${path.y1}" x2="${path.x2}" y2="${path.y2}" 
      stroke="${path.color}" stroke-width="2" stroke-linecap="round"/>`;
        });
        
        svg += '\n</svg>';
        return svg;
    }
}

// Initialize the Logo interpreter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LogoInterpreter();
});