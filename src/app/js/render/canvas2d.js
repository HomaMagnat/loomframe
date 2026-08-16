export class Canvas2D {
    constructor(loomframe) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = loomframe.project.width * 2;
        this.canvas.height = loomframe.project.height * 2;
    }
}