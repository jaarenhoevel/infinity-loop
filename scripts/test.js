/**
 * Shuffles an array
 * @param {Array} array 
 * @returns {Array} shuffled array
 */
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
  
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

class Shape {
    /**
     * Shape
     * @param {String} name
     * @param {Array} connections connection points: north, east, south, west
     * @param {Number} weight weight for random creation
     */
    constructor(name, connections, weight) {
        this.name = name;
        this.connections = connections;
        this.weight = weight;
    }

    /**
     * Returns rotation in which it will fit with given connection
     * @param {Array} connections connection points
     */
    getFittingRotation(connections) {
        let rotations = [0, 1, 2, 3];
        shuffle(rotations);

        for (let i in rotations) {
            const rotation = rotations[i];
            if (this.connections.every((connection, side) => (connection === connections[(side + rotation) % 4] || connections[(side + rotation) % 4] === -1))) return rotation;
        }

        return -1;
    }

    getRotatedConnections(rotation) {
        const connections = [];
        for (let i = 0; i < 4; i ++) {
            connections[(i + rotation) % 4] = this.connections[i];
        }    

        return connections;
    }
}

class Grid {
    /**
     * 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Shape} shapes 
     * @param {String} defaultShape 
     */
    constructor(x, y, shapes) {
        this.x = x;
        this.y = y;
        this.shapes = shapes;

        this.grid = new Array(x);
        for (let i = 0; i < x; i ++) {
            this.grid[i] = new Array(y);
            for (let j = 0; j < y; j ++) {
                this.grid[i][j] = [null, 0];
            }
        }
    }

    /**
     * Checks if a given coordinate is on the grid
     * @param {Number} x 
     * @param {Number} y 
     * @returns coordinate is on grid
     */
    isOutOfBounds(x, y) {
        return (x < 0 || y < 0 || x >= this.x || y >= this.y);
    }

    /**
     * Get shape at position
     * @param {Number} x 
     * @param {Number} y 
     * @returns shape
     */
    getShape(x, y) {
        if (this.isOutOfBounds()) return null; 
        return this.grid[x][y][0];   
    }

    /**
     * Get shape rotation at position
     * @param {Number} x 
     * @param {Number} y 
     * @returns rotation
     */
    getShapeRotation(x, y) {
        if (this.isOutOfBounds()) return -1; 
        return this.grid[x][y][1];  
    }

    /**
     * Get connections from surrounding grid spaces
     * @param {Number} x 
     * @param {Number} y 
     * @returns connections
     */
    getBorderConnections(x, y) {
        const connections = [];

        for (let i = 0; i < 4; i ++) {
            let shapePosition;

            if (i === 0) shapePosition = [x, y - 1];
            else if (i === 1) shapePosition = [x + 1, y];
            else if (i === 2) shapePosition = [x, y + 1];
            else if (i === 3) shapePosition = [x - 1, y];

            if (this.isOutOfBounds(...shapePosition)) {
                connections[i] = 0;
                continue;
            }

            if (this.getShape(...shapePosition) === null) {
                connections[i] = -1;
                continue;
            }

            let shapeConnections = this.getShape(...shapePosition).getRotatedConnections(this.getShapeRotation(...shapePosition));

            connections[i] = shapeConnections[(i + 2) % 4];
        }

        return connections;
    }

    /**
     * Get fitting shape for given connections
     * @param {Array} connections 
     * @returns {Array} shape and rotation
     */
    getFittingShape(connections) {
        let shapeKeys = Object.keys(this.shapes);
        shapeKeys.sort((a, b) => {
            return (this.shapes[b].weight + Math.random()) - (this.shapes[a].weight + Math.random());
        });

        for (let i in shapeKeys) {
            const shapeKey = shapeKeys[i];
            const shape = this.shapes[shapeKey]
            const rotation = shape.getFittingRotation(connections);

            if (rotation !== -1) return {shape, rotation};
        }

        return {shape: null, rotation: -1};
    }

    /**
     * Fills grid slot with fitting shape
     * @param {Number} x 
     * @param {Number} y 
     * @returns successful
     */
    fill(x, y) {
        const { shape, rotation } = this.getFittingShape(this.getBorderConnections(x, y));

        if (shape === null) {
            return false;
        }

        this.grid[x][y][0] = shape;
        this.grid[x][y][1] = rotation;

        return true;
    }

    /**
     * Fills all grid slots
     * @returns successful
     */
    fillAll(onlyEmpty = false) {
        let success = true;
        
        for (let i = 0; i < this.x; i ++) {
            for (let j = 0; j < this.y; j ++) {
                if (onlyEmpty && this.getShape(i, j) !== null) continue;
                if (!this.fill(i, j)) success = false; 
            }
        }

        return success;
    }

    /**
     * Mirrors whole grid
     * @param {Number} direction 
     * @returns successful
     */
    mirror(direction = 0) {
        if (direction === 0 && this.x % 2 !== 0) return false;
        if (direction === 1 && this.y % 2 !== 0) return false;

        let success = true;
        
        for (let i = 0; i < this.x / (direction === 0 ? 2 : 1); i ++) {
            for (let j = 0; j < this.y / (direction + 1); j ++) {
                const donorShape = this.getShape(i, j);
                const neededConnections = this.mirrorConnections(donorShape.getRotatedConnections(this.getShapeRotation(i, j)), direction);
                const rotation = donorShape.getFittingRotation(neededConnections);

                if (rotation === -1) {
                    success = false;
                    continue;
                }

                this.grid[direction === 0 ? this.x - (i + 1) : i][direction === 0 ? j : this.y - (j + 1)][0] = donorShape;
                this.grid[direction === 0 ? this.x - (i + 1) : i][direction === 0 ? j : this.y - (j + 1)][1] = rotation;
            }    
        }

        return true;
    }

    /**
     * Mirrors connection points
     * @param {Array} connections 
     * @param {Number} direction 
     * @returns {Array} mirrored connections
     */
    mirrorConnections(connections, direction = 0) {
        if (direction === 0) return [connections[0], connections[3], connections[2], connections[1]];
        if (direction === 1) return [connections[2], connections[1], connections[0], connections[3]];
    }
}

class ShapeFactory {
    constructor(shapeSize, lineWidth = 0.15, padding = 0.25) {
        this.shapeSize = shapeSize;
        this.lineWidth = lineWidth * shapeSize;
        this.padding = padding * shapeSize;
    }

    setLineMode(ctx) {
        ctx.lineWidth = this.lineWidth;
        ctx.globalCompositeOperation = "source-over"; 
    }

    setPaddingMode(ctx) {
        ctx.lineWidth = this.padding;
        ctx.globalCompositeOperation = "destination-out";     
    }

    drawShape(ctx, shape, progress = [1, 1, 1, 1]) {
        switch (shape.name) {
            case "straight": {
                this.setLineMode(ctx);

                ctx.beginPath();
                ctx.moveTo(this.shapeSize / 2, 0);
                ctx.lineTo(this.shapeSize / 2, this.shapeSize * progress[0]);

                ctx.moveTo(this.shapeSize / 2, this.shapeSize);
                ctx.lineTo(this.shapeSize / 2, this.shapeSize - (this.shapeSize * progress[2]));

                ctx.stroke();
                break;
            }
            
            case "curve": {
                this.setLineMode(ctx);

                ctx.beginPath();
                ctx.arc(this.shapeSize, 0, this.shapeSize / 2, Math.PI - (progress[0] * 0.5 * Math.PI), Math.PI);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(this.shapeSize, 0, this.shapeSize / 2, 0.5 * Math.PI, 0.5 * Math.PI + (progress[1] * 0.5 * Math.PI));
                ctx.stroke();
                break;
            }
            
            case "end": {
                this.setLineMode(ctx);

                ctx.beginPath();
                ctx.arc(this.shapeSize / 2, this.shapeSize / 2, this.shapeSize / 5, 0, 2 * Math.PI);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this.shapeSize / 2, 0);
                ctx.lineTo(this.shapeSize / 2, ((this.shapeSize / 2) - (this.shapeSize / 4)) * progress[0]);
                ctx.stroke();
                break;
            }
            
            case "cross": {
                
                // TOP RIGHT (FIRST HALF)
                this.setLineMode(ctx);
                ctx.beginPath();
                ctx.arc(0, 0, this.shapeSize / 2, 0, 0.25 * Math.PI);
                ctx.stroke();

                // BOTTOM RIGHT
                this.setPaddingMode(ctx);
                ctx.beginPath();
                ctx.arc(this.shapeSize, 0, this.shapeSize / 2, 0.5 * Math.PI, Math.PI);
                ctx.stroke();
                
                this.setLineMode(ctx);
                ctx.beginPath();
                ctx.arc(this.shapeSize, 0, this.shapeSize / 2, 0.5 * Math.PI, Math.PI);
                ctx.stroke();

                // BOTTOM LEFT
                this.setPaddingMode(ctx);
                ctx.beginPath();
                ctx.arc(this.shapeSize, this.shapeSize, this.shapeSize / 2, Math.PI, 1.5 * Math.PI);
                ctx.stroke();
                
                this.setLineMode(ctx);
                ctx.beginPath();
                ctx.arc(this.shapeSize, this.shapeSize, this.shapeSize / 2, Math.PI, 1.5 * Math.PI);
                ctx.stroke();

                // TOP LEFT
                this.setPaddingMode(ctx);
                ctx.beginPath();
                ctx.arc(0, this.shapeSize, this.shapeSize / 2, 1.5 * Math.PI, 2 * Math.PI);
                ctx.stroke();
                
                this.setLineMode(ctx);
                ctx.beginPath();
                ctx.arc(0, this.shapeSize, this.shapeSize / 2, 1.5 * Math.PI, 2 * Math.PI);
                ctx.stroke();

                // TOP RIGHT (SECOND HALF)
                this.setPaddingMode(ctx);
                ctx.beginPath();
                ctx.arc(0, 0, this.shapeSize / 2, 0.25 * Math.PI, 0.5 * Math.PI);
                ctx.stroke();
                
                this.setLineMode(ctx);
                ctx.beginPath();
                ctx.arc(0, 0, this.shapeSize / 2, 0.25 * Math.PI, 0.5 * Math.PI);
                ctx.stroke();
                
                break;
            }

            case "branch": {
                this.setLineMode(ctx);
                ctx.beginPath();
                ctx.arc(this.shapeSize, 0, this.shapeSize / 2, 0.5 * Math.PI, Math.PI);
                ctx.stroke();

                this.setPaddingMode(ctx);
                ctx.beginPath();
                ctx.arc(this.shapeSize, this.shapeSize, this.shapeSize / 2, Math.PI, 1.5 * Math.PI);
                ctx.stroke();
                this.setLineMode(ctx);
                ctx.beginPath();
                ctx.arc(this.shapeSize, this.shapeSize, this.shapeSize / 2, Math.PI, 1.5 * Math.PI);
                ctx.stroke();
            }
        }    
    }
}

class GridCanvas {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.grid = grid;
        this.shapeSize = canvas.width / grid.x;

        this.context = canvas.getContext("2d");
        this.shapeFactory = new ShapeFactory(this.shapeSize);

        console.log(`Shape size: ${this.shapeSize}px.`);

        this.img = {};
        for (let shape in grid.shapes) {
            this.img[shape] = new Image();
            this.img[shape].src = `img/${shape}.png`;
        }
    }

    drawGridLines() {
        for (var x = this.shapeSize; x < this.canvas.width; x += this.shapeSize) {
            this.context.moveTo(0.5 + x, 0);
            this.context.lineTo(0.5 + x, this.canvas.height + 0);
        }
    
        for (var x = this.shapeSize; x < this.canvas.height; x += this.shapeSize) {
            this.context.moveTo(0, 0.5 + x);
            this.context.lineTo(this.canvas.width, 0.5 + x);
        }
        this.context.strokeStyle = "black";
        this.context.stroke();    
    }

    drawShape(shape, rotation, x, y) {
        this.context.save();
        this.context.translate((x * this.shapeSize) + this.shapeSize / 2, (y * this.shapeSize ) + this.shapeSize / 2);
        this.context.rotate(Math.PI / 2 * rotation);
        this.context.translate(this.shapeSize / 2 * -1, this.shapeSize / 2 * -1);
        
        this.shapeFactory.drawShape(this.context, shape);

        this.context.restore();
    }

    drawAllShapes() {
        for (let i = 0; i < this.grid.x; i ++) {
            for (let j = 0; j < this.grid.y; j ++) {
                this.drawShape(this.grid.getShape(i, j), this.grid.getShapeRotation(i, j), i, j);
            }
        }
    }
}

const shapes = {};

shapes["end"]       = new Shape("end", [1, 0, 0, 0], 0)
shapes["straight"]  = new Shape("straight", [1, 0, 1, 0], 0.4);
shapes["curve"]     = new Shape("curve", [1, 1, 0, 0], 0.4);
shapes["cross"]     = new Shape("cross", [1, 1, 1, 1], 0.4);
shapes["branch"]    = new Shape("branch", [1, 1, 1, 0], 0.4);
shapes["empty"]     = new Shape("empty", [0, 0, 0, 0], 0.4);

const grid = new Grid(16, 16, shapes);
console.log(grid.fillAll());
// console.log(grid.mirror(0));
// console.log(grid.mirror(1));

const gridCanvas = new GridCanvas(document.getElementById("grid-canvas"), grid);

// gridCanvas.drawGridLines();
gridCanvas.drawAllShapes();