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
     */
    constructor(x, y, shapes) {
        this.x = x;
        this.y = y;
        this.shapes = shapes;

        this.grid = new Array(x);
        for (let i = 0; i < x; i ++) {
            this.grid[i] = new Array(y);
            for (let j = 0; j < y; j ++) {
                this.grid[i][j] = [null, 0, [0, 0, 0, 0]];
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
     * Get shape progress at position
     * @param {Number} x 
     * @param {Number} y 
     * @returns {Array} progress
     */
    getShapeProgress(x, y) {
        if (this.isOutOfBounds()) return [-1, -1, -1, -1]; 
        return this.grid[x][y][2];  
    }

    /**
     * Set shape progress
     * @param {Number} x 
     * @param {Number} y 
     * @param {Array} progress 
     * @returns success
     */
    setShapeProgress(x, y, progress) {
        if (this.isOutOfBounds()) return false;
        this.grid[x][y][2] = progress;
        
        return true;
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
     * @param {Number} direction 0: horizontal; 1: vertical
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

    /**
     * Returns array of possible paths. Ensures every shape is part of one path
     * @returns {Array} paths
     */
    getPaths() {
        // Collect all possible starting points
        const startPoints = [];

        for (let i = 0; i < this.x; i ++) {
            for (let j = 0; j < this.y; j ++) {
                if (this.grid[i][j][0].name === "end") startPoints.push([i, j]); 
            }
        }

        shuffle(startPoints);

        const traversed = [];

        function isTraversed(x, y) {
            for (let index in traversed) {
                if (traversed[index][0] === x && traversed[index][1] === y) return true;
            }
            return false;
        }

        const getNotTraversed = () => {
            for (let i = 0; i < this.x; i ++) {
                for (let j = 0; j < this.y; j ++) {
                     if (!isTraversed(i, j)) return [i, j];
                }
            }
            
            return null;
        }

        class PathEntry {
            constructor(point) {
                this.point = point;
                this.next = [];
            }

            addNext(next) {
                this.next.push(next);
            }
        }

        const traverse = (pathEntry, point) => {
            traversed.push(point);
            
            const connections = this.getShape(...point).getRotatedConnections(this.getShapeRotation(...point));

            const nextCandidates = [];

            if (connections[0] === 1) nextCandidates.push([point[0], point[1] - 1]);
            if (connections[1] === 1) nextCandidates.push([point[0] + 1, point[1]]);
            if (connections[2] === 1) nextCandidates.push([point[0], point[1] + 1]);
            if (connections[3] === 1) nextCandidates.push([point[0] - 1, point[1]]);

            for (let index in nextCandidates) {
                if (isTraversed(...nextCandidates[index])) continue;

                const path = new PathEntry(nextCandidates[index]);
                pathEntry.addNext(path);

                traverse(path, nextCandidates[index]);
            }

        }

        const paths = [];

        // Traverse any end point
        startPoints.forEach(point => {
            if (isTraversed(...point)) return;
            
            const path = new PathEntry(point);
            traverse(path, point);

            paths.push(path);
        });


        // Check if there are shapes not connected to any end point
        for (let point; point = getNotTraversed(); point !== null) {
            const path = new PathEntry(point);
            traverse(path, point);

            paths.push(path);
        }

        return paths;
    }
}

class ShapeFactory {
    /**
     * Draws shapes
     * @param {Number} shapeSize size of shapes in px 
     * @param {Number} lineWidth width of lines as percentage
     * @param {Number} padding width of padding line as percentage
     */
    constructor(shapeSize, lineWidth = 0.15, padding = 0.25) {
        this.shapeSize = shapeSize;
        this.lineWidth = lineWidth * shapeSize;
        this.padding = padding * shapeSize;

        console.log(`Line width: ${this.lineWidth}px.`);
    }

    /**
     * Sets up context for normal line
     * @param {context} ctx 
     */
    setLineMode(ctx) {
        ctx.lineWidth = this.lineWidth;
        ctx.globalCompositeOperation = "source-over"; 
    }

    /**
     * Sets up context for padding line
     * @param {context} ctx 
     */
    setPaddingMode(ctx) {
        ctx.lineWidth = this.padding;
        ctx.globalCompositeOperation = "destination-out";     
    }

    /**
     * Draws shape at context
     * @param {context} ctx 
     * @param {Shape} shape shape to draw
     * @param {Array} progress progress of animation; value for each side 0..1
     */
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
                if (Math.max(...progress) === 0) break;

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
                if (Math.max(...progress) === 0) break;
                
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

                break;
            }
        }    
    }
}

class GridCanvas {
    /**
     * Draws gernerated grid on canvas
     * @param {canvas} canvas 
     * @param {Grid} grid 
     */
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

    /**
     * Draws a checkboard pattern
     */
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

    /**
     * Draws a shape at specified location
     * @param {Shape} shape 
     * @param {Number} rotation 0...4
     * @param {Number} x 
     * @param {Number} y 
     * @param {Array} progress
     */
    drawShape(shape, rotation, x, y, progress = [1, 1, 1, 1]) {
        this.context.save();
        this.context.translate((x * this.shapeSize) + this.shapeSize / 2, (y * this.shapeSize ) + this.shapeSize / 2);
        this.context.rotate(Math.PI / 2 * rotation);
        this.context.translate(this.shapeSize / 2 * -1, this.shapeSize / 2 * -1);
        
        this.shapeFactory.drawShape(this.context, shape, progress);

        this.context.restore();
    }

    /**
     * Draws all shapes on canvas
     * @param {boolean} clear clear canvas before drawing
     */
    drawAllShapes(clear = true) {
        if (clear) this.clearCanvas();
        
        for (let i = 0; i < this.grid.x; i ++) {
            for (let j = 0; j < this.grid.y; j ++) {
                this.drawShape(this.grid.getShape(i, j), this.grid.getShapeRotation(i, j), i, j, this.grid.getShapeProgress(i, j));
            }
        }
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    startAnimation(stepTime = 20) {
        const paths = this.grid.getPaths();  
        // console.log(paths);

        const animate = (pathElement) => {
            // console.log(`Current path element: [${pathElement.point[0]}][${pathElement.point[1]}]`);

            this.grid.setShapeProgress(...pathElement.point, [1, 1, 1, 1]) // set progress to finished
            this.drawAllShapes();

            pathElement.next.forEach(nextPathElement => {
                setTimeout(() => {
                    animate(nextPathElement);
                }, stepTime);
            })
        }

        paths.forEach(animate);
    }
}

const shapes = {};

shapes["end"]       = new Shape("end", [1, 0, 0, 0], 0)
shapes["straight"]  = new Shape("straight", [1, 0, 1, 0], 0.4);
shapes["curve"]     = new Shape("curve", [1, 1, 0, 0], 0.4);
shapes["cross"]     = new Shape("cross", [1, 1, 1, 1], 0.4);
shapes["branch"]    = new Shape("branch", [1, 1, 1, 0], 0.4);
shapes["empty"]     = new Shape("empty", [0, 0, 0, 0], 0.4);

const grid = new Grid(12, 10, shapes);
console.log(grid.fillAll());
// console.log(grid.mirror(0));
// console.log(grid.mirror(1));

const gridCanvas = new GridCanvas(document.getElementById("grid-canvas"), grid);

// gridCanvas.drawGridLines();
gridCanvas.drawAllShapes();
gridCanvas.startAnimation();