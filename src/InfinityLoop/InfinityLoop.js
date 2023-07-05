import { Grid } from "./modules/Grid.js";

export class InfinityLoop {
    /**
     * Draws gernerated grid on canvas
     * @param {canvas} canvas 
     * @param {Grid} grid 
     */
    constructor(canvas, x, y, lineWidth, paddingLineWidth) {
        this.canvas = canvas;
        this.grid = new Grid(x, y);

        this.context = canvas.getContext("2d");

        this.drawSettings = {
            lineWidth,
            paddingLineWidth,
            shapeSize: canvas.width / x
        }

        console.log(`Shape size: ${this.drawSettings.shapeSize}px.`);
    }

    /**
     * Draws a checkboard pattern
     */
    drawGridLines() {
        for (var x = this.drawSettings.shapeSize; x < this.canvas.width; x += this.drawSettings.shapeSize) {
            this.context.moveTo(0.5 + x, 0);
            this.context.lineTo(0.5 + x, this.canvas.height + 0);
        }
    
        for (var x = this.drawSettings.shapeSize; x < this.canvas.height; x += this.drawSettings.shapeSize) {
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
    drawShape(shape, x, y) {
        this.context.save();
        this.context.translate((x * this.drawSettings.shapeSize) + this.drawSettings.shapeSize / 2, (y * this.drawSettings.shapeSize ) + this.drawSettings.shapeSize / 2);
        this.context.rotate(Math.PI / 2 * shape.rotation);
        this.context.translate(this.drawSettings.shapeSize / 2 * -1, this.drawSettings.shapeSize / 2 * -1);
        
        shape.draw();

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
                this.drawShape(this.grid.getShape(i, j), i, j);
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

            this.grid.getShape(...pathElement.point).progress = [1, 1, 1, 1]; // set progress to finished
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