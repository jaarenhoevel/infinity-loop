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
        this.animationProgress = [0, 0, 0, 0];
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
     * @param {Object} settings 
     */
    draw(context, settings) {
        throw new Error("Must be initialized!");
    }

    static setLineMode(context, settings) {
        context.strokeStyle = "black";
        context.lineWidth = settings.lineWidth;
        context.globalCompositeOperation = "source-over";
    }

    static setPaddingLineMode(context, settings) {
        context.strokeStyle = "black";
        context.lineWidth = settings.paddingLineWidth;
        context.globalCompositeOperation = "destination-out";
    }
}

class Empty extends Shape {
    static connections = [0, 0, 0, 0];
    static weight = 0.6;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Empty.connections;
        this.weight = Empty.weight;
    }

    draw() {
        // Nothing to draw
    }
}

class End extends Shape {
    static connections = [1, 0, 0, 0];
    static weight = 0.6;
    
    constructor(rotation) {
        super(rotation);

        this.connections = End.connections;
        this.weight = End.weight;
    }

    draw(context, settings) {
        Shape.setLineMode(context, settings);

        context.beginPath();
        context.arc(settings.shapeSize / 2, settings.shapeSize / 2, settings.shapeSize / 5, 0, 2 * Math.PI);
        context.stroke();

        context.beginPath();
        context.moveTo(settings.shapeSize / 2, 0);
        context.lineTo(settings.shapeSize / 2, ((settings.shapeSize / 2) - (settings.shapeSize / 4)) * this.animationProgress[0]);
        context.stroke();
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

    draw(context, settings) {
        Shape.setLineMode(context, settings);

        context.beginPath();
        context.arc(settings.shapeSize, 0, settings.shapeSize / 2, Math.PI - (this.animationProgress[0] * 0.5 * Math.PI), Math.PI);
        context.stroke();

        context.beginPath();
        context.arc(settings.shapeSize, 0, settings.shapeSize / 2, 0.5 * Math.PI, 0.5 * Math.PI + (this.animationProgress[1] * 0.5 * Math.PI));
        context.stroke();
    }
}

class Straight extends Shape {
    static connections = [1, 0, 1, 0];
    static weight = 0.7;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Straight.connections;
        this.weight = Straight.weight;
    }

    draw(context, settings) {
        Shape.setLineMode(context, settings);

        context.beginPath();
        context.moveTo(settings.shapeSize / 2, 0);
        context.lineTo(settings.shapeSize / 2, settings.shapeSize * this.animationProgress[0]);

        context.moveTo(settings.shapeSize / 2, settings.shapeSize);
        context.lineTo(settings.shapeSize / 2, settings.shapeSize - (settings.shapeSize * this.animationProgress[2]));

        context.stroke();
    }
}

class Branch extends Shape {
    static connections = [1, 1, 1, 0];
    static weight = 0.5;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Branch.connections;
        this.weight = Branch.weight;
    }

    draw(context, settings) {
        if (Math.max(...this.animationProgress) === 0) return;

        Shape.setLineMode(context, settings);
        context.beginPath();
        context.arc(settings.shapeSize, 0, settings.shapeSize / 2, 0.5 * Math.PI, Math.PI);
        context.stroke();

        Shape.setPaddingLineMode(context, settings);
        context.beginPath();
        context.arc(settings.shapeSize, settings.shapeSize, settings.shapeSize / 2, Math.PI, 1.5 * Math.PI);
        context.stroke();
        Shape.setLineMode(context, settings);
        context.beginPath();
        context.arc(settings.shapeSize, settings.shapeSize, settings.shapeSize / 2, Math.PI, 1.5 * Math.PI);
        context.stroke();  
    }
}

class Cross extends Shape {
    static connections = [1, 1, 1, 1];
    static weight = 0;
    
    constructor(rotation) {
        super(rotation);

        this.connections = Cross.connections;
        this.weight = Cross.weight;
    }

    draw(context, settings) {
        if (Math.max(...this.animationProgress) === 0) return;

        // TOP RIGHT (FIRST HALF)
        Shape.setLineMode(context, settings);
        context.beginPath();
        context.arc(0, 0, settings.shapeSize / 2, 0, 0.25 * Math.PI);
        context.stroke();

        // BOTTOM RIGHT
        Shape.setPaddingLineMode(context, settings);
        context.beginPath();
        context.arc(settings.shapeSize, 0, settings.shapeSize / 2, 0.5 * Math.PI, Math.PI);
        context.stroke();

        Shape.setLineMode(context, settings);
        context.beginPath();
        context.arc(settings.shapeSize, 0, settings.shapeSize / 2, 0.5 * Math.PI, Math.PI);
        context.stroke();

        // BOTTOM LEFT
        Shape.setPaddingLineMode(context, settings);
        context.beginPath();
        context.arc(settings.shapeSize, settings.shapeSize, settings.shapeSize / 2, Math.PI, 1.5 * Math.PI);
        context.stroke();

        Shape.setLineMode(context, settings);
        context.beginPath();
        context.arc(settings.shapeSize, settings.shapeSize, settings.shapeSize / 2, Math.PI, 1.5 * Math.PI);
        context.stroke();

        // TOP LEFT
        Shape.setPaddingLineMode(context, settings);
        context.beginPath();
        context.arc(0, settings.shapeSize, settings.shapeSize / 2, 1.5 * Math.PI, 2 * Math.PI);
        context.stroke();

        Shape.setLineMode(context, settings);
        context.beginPath();
        context.arc(0, settings.shapeSize, settings.shapeSize / 2, 1.5 * Math.PI, 2 * Math.PI);
        context.stroke();

        // TOP RIGHT (SECOND HALF)
        Shape.setPaddingLineMode(context, settings);
        context.beginPath();
        context.arc(0, 0, settings.shapeSize / 2, 0.25 * Math.PI, 0.5 * Math.PI);
        context.stroke();

        Shape.setLineMode(context, settings);
        context.beginPath();
        context.arc(0, 0, settings.shapeSize / 2, 0.25 * Math.PI, 0.5 * Math.PI);
        context.stroke();     
    }
}

export {Empty, End, Curve, Straight, Branch, Cross};