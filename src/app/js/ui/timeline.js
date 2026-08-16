export class Timeline {
    constructor(loomframe, ui) {
        this.loomframe = loomframe;
        this.ui = ui;

        this.color = this.ui.color;

        this.timeline = document.getElementById('timeline');
        this.timelinectx = this.timeline.getContext('2d');

        this.uixoffset = 1;  //timeline ui x offset STATIC CONST UI
        this.uiyoffset = 29; //timeline ui y offset STATIC CONST UI

        this.ystep = 26; //layer y height size STATIC CONST UI

        this.tlscrollx = 0; //pos TEMP DYNAMIC
        this.tlscrollheight = 10; //STATIC CONST UI

        this.isxscroll = false; //EVENT DATA TEMP DYNAMIC
        this.scrollstartx = 0; //EVENT DATA TEMP DYNAMIC

        //SCROLL X, SCROLL Y, PLAYHEAD, FRAMES

        this.timeline.addEventListener('click', this.timelineclick);
        this.timeline.addEventListener('dblclick', this.timelinedblclick);
        this.timeline.addEventListener('contextmenu', this.timelinecontextmenu);
        this.timeline.addEventListener('mousedown', this.tlmousedown);
        this.timeline.addEventListener('wheel', this.timelinescroll);

        window.addEventListener('resize', () => this.timelineresize());

        this.timelineresize();

        requestAnimationFrame(this.timelineloop);
    }

    timelineloop = () => {
        this.timelinectx.clearRect(0, 0, this.timeline.width, this.timeline.height);

        for(const layer of this.loomframe.project.layers) { //every layer
            this.timelinectx.fillStyle = layer.color;
            this.timelinectx.globalAlpha = 0.5;

            for(const frame in layer.frames) { //every frame
                if(layer.frames.hasOwnProperty(frame)) {
                    let xcell = this.uixoffset + parseInt(frame) * this.loomframe.project.editor.framewidth - this.tlscrollx;               //static x start + cell x margin - scroll x offset
                    let ycell = this.uiyoffset + parseInt(layer) * this.ystep - this.ui.projectlayers.scrollTop; //static y start + cell y margin - scroll y offset
                    let wcell = this.loomframe.project.editor.framewidth;               //cell width
                    let hcell = this.ystep;                                             //cell height

                    this.timelinectx.fillRect(xcell, ycell, wcell, hcell);
                }
            }

            let xline = this.uixoffset;                                         //static x start
            let yline = this.uiyoffset + parseInt(layer) * this.ystep - this.ui.projectlayers.scrollTop; //static y start + layer y margin - scroll y offset
            let wline = this.timeline.width;                                    //full width
            let hline = this.ystep;                                             //layer height

            this.timelinectx.fillRect(xline, yline, wline, hline);
        }

        //marks
        this.timelinectx.globalAlpha = 1;

        this.timelinectx.fillStyle = this.color.darkbg;
        this.timelinectx.fillRect(0, 0, this.timeline.width, this.uiyoffset);

        this.timelinectx.fillStyle = 'white';
        this.timelinectx.font = '10px system-ui';
        this.timelinectx.textAlign = 'center';
        this.timelinectx.textBaseline = 'middle';

        for(let i = 0; i <= this.loomframe.project.editor.virtualframes; i++) {
            let xmark = this.uixoffset + ((i) * this.loomframe.project.editor.framewidth) - this.tlscrollx;
            let ymark = this.uiyoffset;
            let wmark = 1;
            let hmark = this.timeline.height;

            this.timelinectx.fillRect(xmark, ymark, wmark, hmark);
            this.timelinectx.fillText(i, xmark-this.loomframe.project.editor.framewidth+5, ymark-5);
            this.timelinectx.fillText(Math.floor((i*1000)/this.loomframe.project.fps), xmark+5, ymark-15);
        }

        //timeline scroll x
        let scrolldata = this.tlscrolldata();

        if (scrolldata.maxProjectWidth > scrolldata.visibleWidth) {
            this.timelinectx.fillStyle = 'blue';
            this.timelinectx.fillRect(this.uixoffset, this.timeline.height - this.tlscrollheight, scrolldata.visibleWidth, this.tlscrollheight);

            this.timelinectx.fillStyle = 'red';
            this.timelinectx.fillRect(scrolldata.thumbX, this.timeline.height - this.tlscrollheight + 2, scrolldata.thumbWidth, this.tlscrollheight - 4);
        }

        //STATIC UI DESIGN BORDER
        this.timelinectx.fillStyle = this.color.border;
        this.timelinectx.fillRect(0, 0, 1, this.timeline.height);

        this.timelinectx.fillStyle = this.color.border;
        this.timelinectx.fillRect(0, this.uiyoffset-1, this.timeline.width, 1);

        requestAnimationFrame(this.timelineloop);
    }

    timelineresize() {
        const container = document.querySelector('.tlcontent');
        const rect = container.getBoundingClientRect();

        this.timeline.width = rect.width;
        this.timeline.height = rect.height;

        //scroll x
        let scrolldata = this.tlscrolldata();

        const maxThumbX = scrolldata.visibleWidth - scrolldata.thumbWidth;
        if(scrolldata.thumbX < 0) {
            scrolldata.thumbX = 0;
            this.tlscrollx = Math.floor((scrolldata.thumbX / maxThumbX) * scrolldata.maxScrollX);
        }
        if(scrolldata.thumbX > maxThumbX) {
            scrolldata.thumbX = maxThumbX;
            this.tlscrollx = Math.floor((scrolldata.thumbX / maxThumbX) * scrolldata.maxScrollX);
        }

        this.ui.yscrollsync();
    }

    timelinescroll = (e) => {
        this.ui.projectlayers.scrollTop += e.deltaY * 0.5;
        //this.ui.projectlayers.scrollTo({ top: this.ui.projectlayers.scrollTop + e.deltaY, behavior: 'smooth' });

        this.ui.yscrollsync();
    }

    getcursordata(e) {
        if(e.offsetX >= 0 && e.offsetX <= this.timeline.width && e.offsetY >= 0 && e.offsetY <= this.uiyoffset) {
            console.log('hit!');
            return;
        }

        if(e.offsetX >= 0 && e.offsetX <= this.timeline.width && e.offsetY >= this.timeline.height - this.tlscrollheight && e.offsetY <= this.timeline.height) {
            console.log('hit!');
            return;
        }
        //проверка на область без ползунков и т.д.

        return {
            frameid: Math.floor((e.offsetX - this.uixoffset + this.tlscrollx) / this.loomframe.project.editor.framewidth) + 1,
            layerindex: Math.floor((e.offsetY - this.uiyoffset + this.ui.projectlayers.scrollTop) / this.ystep)
        };
    }

    timelineclick = (e) => {
        let cursordata = this.getcursordata(e);

        console.log(cursordata.frameid);
        console.log(cursordata.layerindex);
    }

    timelinedblclick = (e) => {
        let cursordata = this.getcursordata(e);

        console.log(cursordata.frameid);
        console.log(cursordata.layerindex);
    }

    timelinecontextmenu = (e) => {
        let cursordata = this.getcursordata(e);

        console.log(cursordata.frameid);
        console.log(cursordata.layerindex);
    }

    tlmousedown = (e) => {
        let scrolldata = this.tlscrolldata();

        if(e.offsetX >= scrolldata.thumbX && e.offsetX <= scrolldata.thumbX + scrolldata.thumbWidth && e.offsetY >= this.timeline.height - this.tlscrollheight && e.offsetY <= this.timeline.height) {
            this.isxscroll = true;
            this.scrollstartx = e.offsetX - scrolldata.thumbX;

            window.addEventListener('mousemove', this.tlmousemove);
            window.addEventListener('mouseup', this.tlmouseup);
        }
    }

    tlmousemove = (e) => {
        if(!this.isxscroll) return;

        const canvasRect = this.timeline.getBoundingClientRect();
        const mouseXInCanvas = e.clientX - canvasRect.left;

        let scrolldata = this.tlscrolldata();

        scrolldata.thumbX = mouseXInCanvas - this.uixoffset - this.scrollstartx;

        const maxThumbX = scrolldata.visibleWidth - scrolldata.thumbWidth;
        if(scrolldata.thumbX < 0) scrolldata.thumbX = 0;
        if(scrolldata.thumbX > maxThumbX) scrolldata.thumbX = maxThumbX;

        this.tlscrollx = Math.floor((scrolldata.thumbX / maxThumbX) * scrolldata.maxScrollX);
    }

    tlmouseup = () => {
        this.isxscroll = false;

        window.removeEventListener('mousemove', this.tlmousemove);
        window.removeEventListener('mouseup', this.tlmouseup);
    }

    tlscrolldata() {
        let sdata = {};
        sdata.visibleWidth = this.timeline.width - this.uixoffset;
        sdata.maxProjectWidth = this.loomframe.project.editor.virtualframes * this.loomframe.project.editor.framewidth;
        sdata.maxScrollX = sdata.maxProjectWidth - sdata.visibleWidth;

        sdata.thumbWidth = (sdata.visibleWidth / sdata.maxProjectWidth) * sdata.visibleWidth;
        if(sdata.thumbWidth < 30) sdata.thumbWidth = 30;

        sdata.thumbX = this.uixoffset + (this.tlscrollx / sdata.maxScrollX) * (sdata.visibleWidth - sdata.thumbWidth);
        return sdata;
    }
}