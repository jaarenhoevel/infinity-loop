import * as Shapes from "./Shapes.js";
import { shuffle } from "./Helpers.js";

export class Grid {
    /**
     * 
     * @param {Number} x 
     * @param {Number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.shapes = Shapes;

        this.grid = new Array(x);
        for (let i = 0; i < x; i ++) {
            this.grid[i] = new Array(y);
            for (let j = 0; j < y; j ++) {
                this.grid[i][j] = null;
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
        return this.grid[x][y];   
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

            let shapeConnections = this.getShape(...shapePosition).getConnections();

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

            if (rotation !== -1) return new shape(rotation);
        }

        return null;
    }

    /**
     * Fills grid slot with fitting shape
     * @param {Number} x 
     * @param {Number} y 
     * @returns successful
     */
    fill(x, y) {
        const shape = this.getFittingShape(this.getBorderConnections(x, y));

        if (shape === null) {
            return false;
        }

        this.grid[x][y] = shape;

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
                const neededConnections = this.mirrorConnections(donorShape.getConnections(), direction);
                const rotation = Object.getPrototypeOf(donorShape).constructor.getFittingRotation(neededConnections);

                if (rotation === -1) {
                    success = false;
                    continue;
                }

                this.grid[direction === 0 ? this.x - (i + 1) : i][direction === 0 ? j : this.y - (j + 1)] = new donorShape.constructor(rotation);
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
                if (this.getShape(i, j) instanceof this.shapes.End) startPoints.push([i, j]); 
            }
        }

        shuffle(startPoints);

        const traversed = [];

        /**
         * Checks if a point is already traversed
         * @param {Number} x 
         * @param {Number} y 
         * @returns traversed
         */
        function isTraversed(x, y) {
            for (let index in traversed) {
                if (traversed[index][0] === x && traversed[index][1] === y) return true;
            }
            return false;
        }

        /**
         * Get not yet traversed elements
         * @returns First non traversed shape or null when all traversed
         */
        const getNotTraversed = () => {
            for (let i = 0; i < this.x; i ++) {
                for (let j = 0; j < this.y; j ++) {
                     if (!isTraversed(i, j)) return [i, j];
                }
            }
            
            return null;
        }

        /**
         * Describes path
         */
        class PathEntry {
            constructor(point) {
                this.point = point;
                this.next = [];
            }

            addNext(next) {
                this.next.push(next);
            }
        }

        /**
         * Recursive function traversing
         * @param {PathEntry} pathEntry 
         * @param {Array} point 
         */
        const traverse = (pathEntry, point) => {
            traversed.push(point);
            
            const connections = this.getShape(...point).getConnections();

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