class LogoInterpreter {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.turtle = document.getElementById('turtle');
        this.commandInput = document.getElementById('commandInput');
        this.output = document.getElementById('output');
        
        // Turtle state
        this.x = 600; // Center of 1200px canvas
        this.y = 450; // Center of 900px canvas
        this.heading = 0; // Degrees, 0 = up
        this.penDown = true;
        this.penColor = '#000000';
        this.penWidth = 1;
        this.turtleVisible = true;
        
        // Command history
        this.history = [];
        this.historyIndex = -1;
        
        this.initializeCanvas();
        this.updateTurtlePosition();
        this.updateInfo();
        this.setupEventListeners();
    }
    
    initializeCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.penColor;
        this.ctx.lineWidth = this.penWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    setupEventListeners() {
        this.commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.commandInput.value.trim();
                if (command) {
                    this.executeCommand(command);
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                    this.commandInput.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.commandInput.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.commandInput.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.commandInput.value = '';
                }
            }
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearScreen();
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadImage();
        });
        
        document.getElementById('downloadHistoryBtn').addEventListener('click', () => {
            this.downloadHistory();
        });
        
        document.getElementById('homeBtn').addEventListener('click', () => {
            this.home();
        });
        
        document.getElementById('guideBtn').addEventListener('click', () => {
            this.showGuide();
        });
        
        // Add event listeners for example buttons
        document.querySelectorAll('.example-btn').forEach(button => {
            button.addEventListener('click', () => {
                const command = button.getAttribute('data-command');
                const shapeName = button.textContent.toLowerCase();
                
                this.executeCommand(command);
                this.commandInput.value = command; // Show the command in input field
                
                // Track shape drawing for analytics
                if (typeof trackShapeDrawn === 'function') {
                    trackShapeDrawn(shapeName);
                }
                
                // Announce to screen readers
                this.announceToScreenReader(`Drawing ${shapeName} with command: ${command}`);
            });
        });
        
        // Add mouse tracking for canvas
        this.setupMouseTracking();
    }
    
    setupMouseTracking() {
        const mouseCoords = document.getElementById('mouseCoords');
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);
            mouseCoords.textContent = `${x}, ${y}`;
        });
        
        this.canvas.addEventListener('mouseenter', () => {
            mouseCoords.style.color = '#000080';
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            mouseCoords.textContent = '--, --';
            mouseCoords.style.color = '#808080';
        });
    }
    
    executeCommand(command) {
        this.addOutput(`? ${command}`, 'input');
        
        try {
            const result = this.parseAndExecute(command.toUpperCase());
            if (result && result.length > 0) {
                this.addOutput(result, 'output');
            }
        } catch (error) {
            this.addOutput(`Error: ${error.message}`, 'error');
        }
    }
    
    parseAndExecute(command) {
        // Handle REPEAT command
        const repeatMatch = command.match(/REPEAT\s+(\d+)\s*\[(.*)\]/);
        if (repeatMatch) {
            const count = parseInt(repeatMatch[1]);
            const commands = repeatMatch[2];
            for (let i = 0; i < count; i++) {
                this.parseAndExecute(commands);
            }
            return;
        }
        
        // Handle multiple commands separated by spaces (simple parsing)
        // Split by common command boundaries but preserve REPEAT blocks
        const commandParts = this.splitCommands(command);
        if (commandParts.length > 1) {
            commandParts.forEach(part => {
                if (part.trim()) {
                    this.parseAndExecute(part.trim());
                }
            });
            return;
        }
        
        // Split command into tokens
        const tokens = command.match(/\S+/g) || [];
        if (tokens.length === 0) return;
        
        const cmd = tokens[0];
        const args = tokens.slice(1);
        
        switch (cmd) {
            case 'FORWARD':
            case 'FD':
                this.forward(parseFloat(args[0]) || 0);
                break;
                
            case 'BACKWARD':
            case 'BK':
                this.forward(-(parseFloat(args[0]) || 0));
                break;
                
            case 'RIGHT':
            case 'RT':
                this.right(parseFloat(args[0]) || 0);
                break;
                
            case 'LEFT':
            case 'LT':
                this.left(parseFloat(args[0]) || 0);
                break;
                
            case 'PENUP':
            case 'PU':
                this.penUp();
                break;
                
            case 'PENDOWN':
            case 'PD':
                this.penDown = true;
                this.updateInfo();
                break;
                
            case 'HOME':
                this.home();
                break;
                
            case 'CLEARSCREEN':
            case 'CS':
                this.clearScreen();
                break;
                
            case 'SETPENCOLOR':
            case 'SETPC':
                this.setPenColor(args[0]);
                break;
                
            case 'SETPENWIDTH':
            case 'SETPW':
                this.setPenWidth(parseFloat(args[0]) || 1);
                break;
                
            case 'SETHEADING':
            case 'SETH':
                this.setHeading(parseFloat(args[0]) || 0);
                break;
                
            case 'SETX':
                this.setX(parseFloat(args[0]) || 0);
                break;
                
            case 'SETY':
                this.setY(parseFloat(args[0]) || 0);
                break;
                
            case 'SETXY':
                this.setXY(parseFloat(args[0]) || 0, parseFloat(args[1]) || 0);
                break;
                
            case 'XCOR':
                return `X coordinate: ${this.x}`;
                
            case 'YCOR':
                return `Y coordinate: ${this.y}`;
                
            case 'HEADING':
                return `Heading: ${this.heading}°`;
                
            case 'HIDETURTLE':
            case 'HT':
                this.hideTurtle();
                break;
                
            case 'SHOWTURTLE':
            case 'ST':
                this.showTurtle();
                break;
                
            case 'ARC':
                this.arc(parseFloat(args[0]) || 0, parseFloat(args[1]) || 0);
                break;
                
            default:
                throw new Error(`Unknown command: ${cmd}`);
        }
    }
    
    forward(distance) {
        const oldX = this.x;
        const oldY = this.y;
        
        // In Logo: 0° = North (up), 90° = East (right), 180° = South (down), 270° = West (left)
        // Convert to standard math coordinates where 0° = East, 90° = North
        const radians = (90 - this.heading) * Math.PI / 180;
        this.x += distance * Math.cos(radians);
        this.y -= distance * Math.sin(radians); // Subtract because canvas Y increases downward
        
        if (this.penDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(oldX, oldY);
            this.ctx.lineTo(this.x, this.y);
            this.ctx.stroke();
        }
        
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    right(angle) {
        this.heading = (this.heading + angle) % 360;
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    left(angle) {
        this.heading = (this.heading - angle + 360) % 360;
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    penUp() {
        this.penDown = false;
        this.updateInfo();
    }
    
    home() {
        this.x = 600;
        this.y = 450;
        this.heading = 0;
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    clearScreen() {
        // Ask user if they want to download history before clearing
        if (this.history.length > 0) {
            const shouldDownload = confirm('You have command history. Would you like to download it before clearing the screen?');
            if (shouldDownload) {
                this.downloadHistory();
            }
        }
        
        this.initializeCanvas();
        this.home();
        
        // Clear the output display but keep welcome message
        const output = document.getElementById('output');
        const welcomeText = output.querySelector('.welcome-text');
        output.innerHTML = '';
        if (welcomeText) {
            output.appendChild(welcomeText);
        }
        
        this.announceToScreenReader('Screen cleared and turtle returned home.');
    }
    
    setPenColor(color) {
        const colorMap = {
            'BLACK': '#000000',
            'WHITE': '#ffffff',
            'RED': '#ff0000',
            'GREEN': '#00ff00',
            'BLUE': '#0000ff',
            'YELLOW': '#ffff00',
            'CYAN': '#00ffff',
            'MAGENTA': '#ff00ff',
            'ORANGE': '#ffa500',
            'PURPLE': '#800080',
            'BROWN': '#a52a2a',
            'PINK': '#ffc0cb',
            'GRAY': '#808080',
            'GREY': '#808080'
        };
        
        if (color && color.startsWith('"') && color.endsWith('"')) {
            color = color.slice(1, -1);
        }
        
        this.penColor = colorMap[color.toUpperCase()] || color || '#000000';
        this.ctx.strokeStyle = this.penColor;
    }
    
    setPenWidth(width) {
        this.penWidth = Math.max(1, width);
        this.ctx.lineWidth = this.penWidth;
    }
    
    setHeading(angle) {
        this.heading = angle % 360;
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    setX(x) {
        const oldX = this.x;
        const oldY = this.y;
        this.x = x;
        
        if (this.penDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(oldX, oldY);
            this.ctx.lineTo(this.x, this.y);
            this.ctx.stroke();
        }
        
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    setY(y) {
        const oldX = this.x;
        const oldY = this.y;
        this.y = y;
        
        if (this.penDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(oldX, oldY);
            this.ctx.lineTo(this.x, this.y);
            this.ctx.stroke();
        }
        
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    setXY(x, y) {
        const oldX = this.x;
        const oldY = this.y;
        this.x = x;
        this.y = y;
        
        if (this.penDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(oldX, oldY);
            this.ctx.lineTo(this.x, this.y);
            this.ctx.stroke();
        }
        
        this.updateTurtlePosition();
        this.updateInfo();
    }
    
    updateTurtlePosition() {
        this.turtle.style.left = `${this.x - 10}px`;
        this.turtle.style.top = `${this.y - 10}px`;
        this.turtle.style.transform = `rotate(${this.heading}deg)`;
        this.turtle.style.display = this.turtleVisible ? 'block' : 'none';
    }
    
    hideTurtle() {
        this.turtleVisible = false;
        this.updateTurtlePosition();
    }
    
    showTurtle() {
        this.turtleVisible = true;
        this.updateTurtlePosition();
    }
    
    arc(angle, radius) {
        if (radius <= 0 || angle === 0) return;
        
        const startAngle = this.heading;
        const angleStep = angle > 0 ? 1 : -1;
        const totalSteps = Math.abs(angle);
        const arcLength = (Math.abs(angle) * Math.PI * radius) / 180;
        const stepDistance = arcLength / totalSteps;
        
        for (let i = 0; i < totalSteps; i++) {
            this.forward(stepDistance);
            if (angle > 0) {
                this.right(angleStep);
            } else {
                this.left(Math.abs(angleStep));
            }
        }
    }
    
    updateInfo() {
        document.getElementById('position').textContent = `${Math.round(this.x)}, ${Math.round(this.y)}`;
        document.getElementById('heading').textContent = `${Math.round(this.heading)}°`;
        document.getElementById('penStatus').textContent = this.penDown ? 'DOWN' : 'UP';
    }
    
    splitCommands(command) {
        // Simple command splitting - look for command keywords
        const commands = ['FD', 'FORWARD', 'BK', 'BACKWARD', 'RT', 'RIGHT', 'LT', 'LEFT', 
                         'PU', 'PENUP', 'PD', 'PENDOWN', 'HOME', 'CS', 'CLEARSCREEN',
                         'HT', 'HIDETURTLE', 'ST', 'SHOWTURTLE', 'ARC', 'SETXY'];
        
        // Don't split if it contains REPEAT or ARC (handle as single command)
        if (command.includes('REPEAT') || command.includes('ARC')) {
            return [command];
        }
        
        const parts = [];
        let current = '';
        const tokens = command.split(/\s+/);
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (commands.includes(token.toUpperCase()) && current.trim()) {
                parts.push(current.trim());
                current = token;
            } else {
                current += (current ? ' ' : '') + token;
            }
        }
        
        if (current.trim()) {
            parts.push(current.trim());
        }
        
        return parts.length > 1 ? parts : [command];
    }

    addOutput(text, type = 'output') {
        const div = document.createElement('div');
        div.className = `command-line ${type}`;
        div.textContent = text;
        this.output.appendChild(div);
        this.output.scrollTop = this.output.scrollHeight;
    }
    
    downloadImage() {
        const link = document.createElement('a');
        link.download = 'logo-drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    downloadHistory() {
        // Get current session info
        const sessionInfo = {
            timestamp: new Date().toISOString(),
            turtlePosition: { x: Math.round(this.x), y: Math.round(this.y) },
            turtleHeading: Math.round(this.heading),
            penStatus: this.penDown ? 'DOWN' : 'UP',
            penColor: this.penColor,
            penWidth: this.penWidth
        };
        
        // Get all command history
        const commandHistory = this.history.slice(); // Copy array
        
        // Get output content from the display
        const outputElement = document.getElementById('output');
        const outputLines = [];
        const commandLines = outputElement.querySelectorAll('.command-line');
        
        commandLines.forEach(line => {
            const type = line.classList.contains('input') ? 'INPUT' : 
                        line.classList.contains('error') ? 'ERROR' : 'OUTPUT';
            outputLines.push(`[${type}] ${line.textContent}`);
        });
        
        // Create comprehensive session log
        const sessionLog = {
            sessionInfo: sessionInfo,
            commandHistory: commandHistory,
            outputLog: outputLines,
            statistics: {
                totalCommands: commandHistory.length,
                sessionDuration: 'Current session',
                errorsCount: outputLines.filter(line => line.startsWith('[ERROR]')).length
            }
        };
        
        // Create formatted text content
        let textContent = `LOGO Programming Session History
Generated: ${new Date().toLocaleString()}
========================================

SESSION INFORMATION:
- Turtle Position: (${sessionInfo.turtlePosition.x}, ${sessionInfo.turtlePosition.y})
- Turtle Heading: ${sessionInfo.turtleHeading}°
- Pen Status: ${sessionInfo.penStatus}
- Pen Color: ${sessionInfo.penColor}
- Pen Width: ${sessionInfo.penWidth}px

STATISTICS:
- Total Commands Executed: ${sessionLog.statistics.totalCommands}
- Errors Encountered: ${sessionLog.statistics.errorsCount}

COMMAND HISTORY:
========================================
`;

        commandHistory.forEach((command, index) => {
            textContent += `${index + 1}. ${command}\n`;
        });

        textContent += `\nSESSION OUTPUT LOG:
========================================
`;

        outputLines.forEach(line => {
            textContent += `${line}\n`;
        });

        textContent += `\n========================================
End of LOGO Programming Session History
Generated by: LOGO Turtle Graphics - HK Sapientia
Website: https://logo.hksapientia.org/
`;

        // Create and download the file
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `logo-session-history-${timestamp}.txt`;
        link.href = URL.createObjectURL(blob);
        link.click();
        
        // Clean up the object URL
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
        
        // Announce to screen readers
        this.announceToScreenReader(`Session history downloaded with ${commandHistory.length} commands and ${outputLines.length} output lines.`);
        
        // Track download for analytics
        if (typeof gtag === 'function') {
            gtag('event', 'download_history', {
                'commands_count': commandHistory.length,
                'session_duration': 'current'
            });
        }
    }
    
    showGuide() {
        const modal = document.getElementById('guideModal');
        const guideContent = document.getElementById('guideContent');
        const closeBtn = document.querySelector('.close');
        
        // Load guide content
        guideContent.innerHTML = this.getGuideContent();
        
        // Show modal with accessibility
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        guideContent.focus();
        
        // Track guide opening for analytics
        if (typeof trackTutorialStart === 'function') {
            trackTutorialStart('LOGO Programming Guide');
        }
        
        // Close modal handlers
        const closeModal = () => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            document.getElementById('guideBtn').focus(); // Return focus
        };
        
        closeBtn.onclick = closeModal;
        
        window.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };
        
        // Close on Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
                closeModal();
            }
        });
    }
    
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    getGuideContent() {
        return `
            <h3>LOGO Programming Language</h3>
            <p>LOGO is one of the computer languages. LOGO is the easiest and simplest computer language. You can draw, do sums, write and can do any kind of work with it.</p>
            
            <h4>TURTLE</h4>
            <p>When we work with LOGO on the computer, a triangle is seen in the center of the screen. This triangle is known as TURTLE. The TURTLE moves all over the screen on our order. Whenever TURTLE moves on the screen, it leaves a trail.</p>
            <p>Turtle's body has two parts. The top point, which is facing the upper side of the screen, is called NOSE and the other part i.e., the bottom part is called TAIL or BACK.</p>
            
            <h4>Basic Commands</h4>
            <ul>
                <li><code>FORWARD 100</code> or <code>FD 100</code> - Move turtle forward 100 steps</li>
                <li><code>BACKWARD 50</code> or <code>BK 50</code> - Move turtle backward 50 steps</li>
                <li><code>RIGHT 90</code> or <code>RT 90</code> - Turn turtle right 90 degrees</li>
                <li><code>LEFT 45</code> or <code>LT 45</code> - Turn turtle left 45 degrees</li>
                <li><code>HOME</code> - Return turtle to center of screen</li>
                <li><code>PENUP</code> or <code>PU</code> - Lift pen (move without drawing)</li>
                <li><code>PENDOWN</code> or <code>PD</code> - Put pen down (draw while moving)</li>
                <li><code>CLEARSCREEN</code> or <code>CS</code> - Clear the screen</li>
            </ul>
            
            <h4>Drawing Shapes</h4>
            <p>You can draw various shapes using the REPEAT command:</p>
            <ul>
                <li><code>REPEAT 4 [FD 100 RT 90]</code> - Draw a square</li>
                <li><code>REPEAT 3 [FD 100 RT 120]</code> - Draw a triangle</li>
                <li><code>REPEAT 5 [FD 100 RT 72]</code> - Draw a pentagon</li>
                <li><code>REPEAT 6 [FD 100 RT 60]</code> - Draw a hexagon</li>
                <li><code>REPEAT 360 [FD 1 RT 1]</code> - Draw a circle</li>
            </ul>
            
            <h4>Color Commands</h4>
            <ul>
                <li><code>SETPENCOLOR "RED"</code> - Set pen color to red</li>
                <li><code>SETPENCOLOR "BLUE"</code> - Set pen color to blue</li>
                <li><code>SETPENCOLOR "GREEN"</code> - Set pen color to green</li>
                <li><code>SETPENWIDTH 3</code> - Set pen width to 3 pixels</li>
            </ul>
            
            <h4>Position Commands</h4>
            <ul>
                <li><code>SETXY 100 50</code> - Move turtle to coordinates (100, 50)</li>
                <li><code>SETX 100</code> - Set X coordinate to 100</li>
                <li><code>SETY 50</code> - Set Y coordinate to 50</li>
                <li><code>SETHEADING 90</code> - Set turtle heading to 90 degrees</li>
            </ul>
            
            <h4>Turtle Visibility</h4>
            <ul>
                <li><code>HIDETURTLE</code> or <code>HT</code> - Hide the turtle</li>
                <li><code>SHOWTURTLE</code> or <code>ST</code> - Show the turtle</li>
            </ul>
            
            <h4>Rules for Writing Commands</h4>
            <ul>
                <li>Write the correct spelling of the command</li>
                <li>Leave a gap between commands and numbers</li>
                <li>Press ENTER after typing each command</li>
                <li>Commands are not case-sensitive</li>
            </ul>
            
            <h4>Examples to Try</h4>
            <pre>
# Draw a house
REPEAT 4 [FD 100 RT 90]
FD 100
RT 30
FD 100
RT 120
FD 100
RT 30
FD 100

# Draw a flower
REPEAT 8 [REPEAT 10 [FD 5 RT 9] RT 45]

# Draw a spiral
REPEAT 100 [FD 2 RT 91]
            </pre>
            
            <h4>Programming Concepts</h4>
            <p><strong>Procedures:</strong> You can create your own commands using TO and END:</p>
            <pre>
TO SQUARE
REPEAT 4 [FD 50 RT 90]
END
            </pre>
            <p>Then use it by typing: <code>SQUARE</code></p>
            
            <p><strong>Parameters:</strong> Make procedures flexible with parameters:</p>
            <pre>
TO SQUARE :SIZE
REPEAT 4 [FD :SIZE RT 90]
END
            </pre>
            <p>Then use it by typing: <code>SQUARE 100</code></p>
            
            <h4>Tips for Success</h4>
            <ul>
                <li>Start with simple shapes and build complexity gradually</li>
                <li>Use the REPEAT command to avoid typing the same commands multiple times</li>
                <li>Remember that angles in a polygon always add up to 360 degrees</li>
                <li>For a regular polygon with N sides, turn 360/N degrees at each corner</li>
                <li>Use PENUP to move without drawing, PENDOWN to resume drawing</li>
                <li>Experiment with different colors and pen widths</li>
            </ul>
            
            <h4>Common Mistakes to Avoid</h4>
            <ul>
                <li>Forgetting to put spaces between commands and numbers</li>
                <li>Misspelling command names</li>
                <li>Using wrong angle calculations for polygons</li>
                <li>Forgetting to use PENDOWN after PENUP</li>
            </ul>
            
            <p><strong>Have fun exploring LOGO! The turtle is your friend and will follow all your commands precisely.</strong></p>
        `;
    }
}

// Initialize the Logo interpreter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LogoInterpreter();
});