import { UI } from './ui/ui.js';
import { Renderer } from './render/renderer.js';

export class Loomframe {
    constructor() {
        this.project = {
            width: 1920,
            height: 1080,
            fps: 24,
            editor: {
                x: 0,
                y: 0,
                zoom: 100,
                rotate: 0,
                leftbox: 100,
                rightbox: 300,
                topbox: 100,
                bottombox: 200,
                framewidth: 20,
                virtualframes: 0,
                thislayer: 0,
                thisframe: 0,
                thistool: 0
            },
            camera: {
                x: 0,
                y: 0,
                /*width,
                height,
                scalex,
                scaley,
                zoom,
                rotate*/
            },
            layers: [
                /*{
                    name: 'Слой 1', //first edit setting
                    type: 'vector', //first setting
                    color: '#0418ca', //first edit setting

                    visible: true, //straight setting
                    opacity: 100, //edit setting
                    blendmode: 'normal', //edit setting

                    frames: {  //only timeline
                        1: {
                            objects: {
                                1: {
                                    type: 'path',
                                    style: {},
                                    transform: {},
                                    points: []
                                }
                            }
                        },
                    }
                }*/
            ]
        };

        this.ui = new UI(this);
        this.renderer = new Renderer(this);

        this.playhead = 1;
        this.endhead = 1;
        this.cyclemode = false;

        if(this.project.editor.virtualframes == 0) {
            this.project.editor.virtualframes = this.project.fps * 10; //fps * 10s OR timeline width / frame width
        }
    }

    addlayer(name, type, color) {
        const newlayer = {
            name: name,
            type: type,
            color: color,
            visible: true,
            opacity: 100,
            blendmode: 'normal',
            frames: {}
        };

        let targetindex = this.project.layers.length;

        this.execute({
            type: 'addlayer',
            do: () => {
                this.project.layers.push(newlayer);
                this.setlayer(targetindex);
                this.ui.renderlayers();
            },
            undo: () => {
                this.project.layers.splice(targetindex, 1); 
                this.setlayer(Math.max(0, targetindex - 1));
                this.ui.renderlayers();
            }
        });
    }

    setlayer(layerid) {
        this.project.editor.thislayer = layerid;

        this.ui.renderlayers();
    }

    layervisible(layerid) {
        this.project.layers[layerid].visible = !this.project.layers[layerid].visible;

        this.ui.renderlayers();
    }

    addframe(layerid, frameid) { //key, index

    }
}

let loomframe = new Loomframe();
console.log(loomframe);