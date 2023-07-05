import { shuffle } from "./Helpers.js";

class Shape {
    static connections = [0, 0, 0, 0];
    static weight = 0;
    
    /**
     * Shape
     * @param {Number} rotation
     */
    constructor(rotation) {
        if (this.constructor === Shape) {
            throw new Error("Can't instantiate abstract class!");
        }
        
        this.rotation = rotation;
        this.animationProgress = 0;
        this.animationDirections = [0, 0, 0, 0];
    }

    /**
     * Returns rotation in which it will fit with given connection
     * @param {Array} connections connection points
     */
    static getFittingRotation(connections) {
        let rotations = [0, 1, 2, 3];
        shuffle(rotations);

        for (let i in rotations) {
            const rotation = rotations[i];
            if (this.connections.every((connection, side) => (connection === connections[(side + rotation) % 4] || connections[(side + rotation) % 4] === -1))) return rotation;
        }

        return -1;
    }

    getConnections() {
        const connections = [];
        for (let i = 0; i < 4; i ++) {
            connections[(i + this.rotation) % 4] = this.connections[i];
        }    

        return connections;
    }

    /**
     * Draw shape on canvas
     * @param {context} context 
     */
    draw(context) {
        throw new Error("Must be initialized!");
    }
}

class Empty extends Shape {
    static connections = [0, 0, 0, 0];
    static weight = 0.25;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Empty.connections;
        this.weight = Empty.weight;
    }
}

class End extends Shape {
    static connections = [1, 0, 0, 0];
    static weight = 0.25;
    
    constructor(rotation) {
        super(rotation);

        this.connections = End.connections;
        this.weight = End.weight;
    }
}

class Curve extends Shape {
    static connections = [1, 1, 0, 0];
    static weight = 0.4;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Curve.connections;
        this.weight = Curve.weight;
    }
}

class Straight extends Shape {
    static connections = [1, 0, 1, 0];
    static weight = 0.4;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Straight.connections;
        this.weight = Straight.weight;
    }
}

class Branch extends Shape {
    static connections = [1, 1, 1, 0];
    static weight = 0.4;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Branch.connections;
        this.weight = Branch.weight;
    }
}

class Cross extends Shape {
    static connections = [1, 1, 1, 1];
    static weight = 0.4;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Cross.connections;
        this.weight = Cross.weight;
    }
}

export {End, Curve, Straight, Branch, Cross};