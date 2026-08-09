export class UI {
    constructor(loomframe) {
        //STATIC DATA, DYNAMIC TEMP DATA, DYNAMIC

        this.loomframe = loomframe;

        //COLORS

        this.rootstyles = getComputedStyle(document.documentElement);
        this.color = {
            darkbg: this.rootstyles.getPropertyValue('--darkbg').trim(),
            midbg: this.rootstyles.getPropertyValue('--midbg').trim(),
            lightbg: this.rootstyles.getPropertyValue('--lightbg').trim(),
            border: this.rootstyles.getPropertyValue('--border').trim()
        };

        //RESIZE UI
        this.resizetype = null; //TEMP DYNAMIC UI

        this.LIMITS = { //STATIC CONST UI
            left:   { min: 100, max: 500 },
            right:  { min: 100, max: 500 },
            top:    { min: 50,  max: 300 },
            bottom: { min: 50,  max: 300 }
        };

        //STATIC CONST UI CACHE
        this.mainelement = document.querySelector('.main');
        this.topbox = document.querySelector('.topbox');
        this.bottombox = document.querySelector('.bottombox');
        this.leftbox = document.querySelector('.leftbox');
        this.rightbox = document.querySelector('.rightbox');

        this.resizehandle('x+', this.leftbox); //INIT BINDS UI
        this.resizehandle('x-', this.rightbox);
        this.resizehandle('y+', this.topbox);
        this.resizehandle('y-', this.bottombox);

        document.documentElement.style.setProperty('--left-w', `${loomframe.project.editor.leftbox}px`); //INIT UI BY PROJECT DATA
        document.documentElement.style.setProperty('--right-w', `${loomframe.project.editor.rightbox}px`);
        document.documentElement.style.setProperty('--top-h', `${loomframe.project.editor.topbox}px`);
        document.documentElement.style.setProperty('--bottom-h', `${loomframe.project.editor.bottombox}px`);

        //OTHER UI
        this.opensection('layers'); //INIT STATIC

        window.addEventListener('click', (e) => this.globalclick(e));

        //LAYERS UI
        this.projectlayers = document.querySelector('.projectlayers');
        this.yscroll = document.querySelector('.yscrollthumb');

        this.projectlayers.addEventListener('scroll', () => this.yscrollsync());
        this.yscroll.addEventListener('mousedown', this.yscrolldown);

        //TIMELINE UI
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
        this.timeline.addEventListener('mousedown', this.tlmousedown);
        this.timeline.addEventListener('wheel', this.timelinescroll);

        window.addEventListener('resize', () => this.timelineresize());

        this.timelineresize();

        requestAnimationFrame(this.timelineloop);
    }



    //TIMELINE UI
    timelineloop = () => {
        this.timelinectx.clearRect(0, 0, this.timeline.width, this.timeline.height);

        let ylayer = 0;

        for(const layer of this.loomframe.project.layers) { //every layer
            let xframe = 0;

            this.timelinectx.fillStyle = layer.color;
            this.timelinectx.globalAlpha = 0.5;

            for(const frame in layer.frames) { //every frame
                if(layer.frames.hasOwnProperty(frame)) {

                    let xcell = this.uixoffset + xframe - this.tlscrollx;               //static x start + cell x margin - scroll x offset
                    let ycell = this.uiyoffset + ylayer - this.projectlayers.scrollTop; //static y start + cell y margin - scroll y offset
                    let wcell = this.loomframe.project.editor.framewidth;               //cell width
                    let hcell = this.ystep;                                             //cell height

                    this.timelinectx.fillRect(xcell, ycell, wcell, hcell);

                    xframe += this.loomframe.project.editor.framewidth;
                }
            }

            let xline = this.uixoffset;                                         //static x start
            let yline = this.uiyoffset + ylayer - this.projectlayers.scrollTop; //static y start + layer y margin - scroll y offset
            let wline = this.timeline.width;                                    //full width
            let hline = this.ystep;                                             //layer height

            this.timelinectx.fillRect(xline, yline, wline, hline);

            ylayer += this.ystep;
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

            //this.timelinectx.fillRect(xmark, ymark, wmark, hmark);
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

        this.yscrollsync();
    }

    timelinescroll = (e) => {
        this.projectlayers.scrollTop += e.deltaY * 0.5;
        //this.projectlayers.scrollTo({ top: this.projectlayers.scrollTop + e.deltaY, behavior: 'smooth' });

        this.yscrollsync();
    }

    yscrollsync() {
        const ratio = this.projectlayers.clientHeight / this.projectlayers.scrollHeight;

        if(this.projectlayers.clientHeight * ratio >= 20) {
            this.yscroll.style.height = `${Math.floor(this.projectlayers.clientHeight * ratio)}px`;
        } else {
            this.yscroll.style.height = `${20}px`;
        }

        const maxScroll = this.projectlayers.scrollHeight - this.projectlayers.clientHeight;
        const maxTop = this.projectlayers.clientHeight - this.yscroll.offsetHeight;
        const currentRatio = maxScroll > 0 ? this.projectlayers.scrollTop / maxScroll : 0;
    
        this.yscroll.style.top = `${Math.floor(currentRatio * maxTop)}px`;
    }

    yscrolldown = (e) => {
        const startY = e.clientY;
        const startScroll = this.projectlayers.scrollTop;
    
        const onMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const ratio = this.projectlayers.scrollHeight / this.projectlayers.clientHeight;
            this.projectlayers.scrollTop = startScroll + (deltaY * ratio);
        }
    
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    }

    timelineclick = (e) => {
        if(e.offsetX >= 0 && e.offsetX <= this.timeline.width && e.offsetY >= 0 && e.offsetY <= this.uiyoffset) {
            console.log('hit!');
            return;
        }

        if(e.offsetX >= 0 && e.offsetX <= this.timeline.width && e.offsetY >= this.timeline.height - this.tlscrollheight && e.offsetY <= this.timeline.height) {
            console.log('hit!');
            return;
        }
        //проверка на область без ползунков и т.д.

        const frameid = Math.floor((e.offsetX - this.uixoffset + this.tlscrollx) / this.loomframe.project.editor.framewidth) + 1;
        const layerindex = Math.floor((e.offsetY - this.uiyoffset + this.projectlayers.scrollTop) / this.ystep);

        console.log(frameid);
        console.log(layerindex);
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



    //OTHER UI
    globalclick(e) {
        const target = e.target.closest('[data-action]');
        if(!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;

        if(typeof this[action] === 'function') {
            this[action](id, e);
        } else {
            console.warn(`Method ${action} is not implemented in UI class`);
        }
    }

    opensection(id) {
        const container = document.querySelector('.sections');

        container.querySelectorAll('.sectionboxes > div').forEach(box => box.style.display = 'none');
        container.querySelectorAll('.sectionpanel .section').forEach(btn => {
            btn.style.backgroundColor = 'transparent';
            btn.style.position = 'static';
            btn.style.borderLeft = 'none';
            btn.style.borderRight = 'none';
        });

        const targetBox = container.querySelector(`.sectionboxes .${id}`);
        targetBox.style.display = 'block';

        const targetBtn = container.querySelector(`.sectionpanel .section[data-id="${id}"]`);
        targetBtn.style.backgroundColor = window.getComputedStyle(targetBox).backgroundColor;
        targetBtn.style.position = 'relative';
        targetBtn.style.borderLeft = '1px solid var(--border)';
        targetBtn.style.borderRight = '1px solid var(--border)';
    }

    //LAYERS UI
    addlayerwin() {
        const addlayerwin = document.querySelector('.addlayerwin');
        addlayerwin.classList.toggle('hidden');
    }

    addlayer() {
        const inputlayername = document.querySelector('.inputlayername');
        const selectlayertype = document.querySelector('.selectlayertype');
        const inputlayercolor = document.querySelector('.inputlayercolor');
        const addlayerwin = document.querySelector('.addlayerwin');

        this.loomframe.addlayer(inputlayername.value, selectlayertype.value, inputlayercolor.value);

        inputlayername.value = '';
        selectlayertype.value = 'vector';
        inputlayercolor.value = '#000000';
        addlayerwin.classList.toggle('hidden');
    }

    renderlayers() {
        const types = {
            vector: 'shape_line',
            raster: 'image',
            video: 'movie',
            audio: 'music_note_2'
        };

        const visible = {
            true: 'visibility',
            false: 'visibility_off'
        };

        let htmlbuffer = '';

        this.loomframe.project.layers.forEach((layer, index) => {
            let layerstyle = `background: ${layer.color}24;`;
            
            if(index == this.loomframe.project.editor.thislayer) {
                layerstyle = `background: ${layer.color}60; outline: 1px solid #ffffff10; box-shadow: 0 0 10px 2px #00000050, 0 0 10px 2px #ffffff50 inset`;
            }

            htmlbuffer += `
                <div class="layer" style="${layerstyle}" data-action="setlayer" data-id="${index}">
                    <div class="layertype"><span class="material-symbols-rounded">${types[layer.type]}</span></div>
                    <div class="layername">${layer.name}</div>
                    <div class="layersettings">
                        <div class="deletelayer" data-action="deletelayerwin" data-id="${index}"><span class="material-symbols-rounded">delete</span></div>
                        <div class="editlayer" data-action="editlayerwin" data-id="${index}"><span class="material-symbols-rounded">edit</span></div>
                        <div class="layerup" data-action="layerup" data-id="${index}"><span class="material-symbols-rounded">keyboard_arrow_up</span></div>
                        <div class="layerdown" data-action="layerdown" data-id="${index}"><span class="material-symbols-rounded">keyboard_arrow_down</span></div>
                        <div class="layervisible" data-action="layervisible" data-id="${index}"><span class="material-symbols-rounded">${visible[layer.visible]}</span></div>
                    </div>
                </div>`;
        });

        htmlbuffer += `<div style="width: 100%; height: ${this.tlscrollheight}px;"></div>`;

        this.projectlayers.innerHTML = htmlbuffer;

        this.yscrollsync();
    }

    setlayer(layerid) {
        this.loomframe.setlayer(parseInt(layerid));
    }

    deletelayerwin(layerid) {
        //TODO
    }

    editlayerwin(layerid) {
        //TODO
    }

    layerup(layerid) {
        //TODO
    }

    layerdown(layerid) {
        //TODO
    }

    layervisible(layerid) {
        this.loomframe.layervisible(parseInt(layerid));
    }

    //RESIZE UI
    resizehandle(type, element) {
        element.addEventListener('mousedown', (e) => {

            const rect = element.getBoundingClientRect();

            if(type === 'x+' && e.clientX >= rect.right - 5 && e.clientX <= rect.right + 5) {
                document.body.style.cursor = 'ew-resize';
                e.preventDefault();
                this.resizestart(type);
            }

            if(type === 'y+' && e.clientY >= rect.bottom - 5 && e.clientY <= rect.bottom + 5) {
                document.body.style.cursor = 'ns-resize';
                e.preventDefault();
                this.resizestart(type);
            }
            
            if(type === 'x-' && e.clientX >= window.innerWidth - rect.width - 5 && e.clientX <= window.innerWidth - rect.width + 5) {
                document.body.style.cursor = 'ew-resize';
                e.preventDefault();
                this.resizestart(type);
            }

            if(type === 'y-' && e.clientY >= window.innerHeight - rect.height - 5 && e.clientY <= window.innerHeight - rect.height + 5) {
                document.body.style.cursor = 'ns-resize';
                e.preventDefault();
                this.resizestart(type);
            }
        });
    }

    resizestart(type) {
        this.resizetype = type;

        window.addEventListener('mousemove', this.resizemove);
        window.addEventListener('mouseup', this.resizeup);
    }

    resizemove = (e) => {
        if(this.resizetype === 'x+') {
            const validWidth = Math.max(this.LIMITS.left.min, Math.min(e.clientX, this.LIMITS.left.max));

            document.documentElement.style.setProperty('--left-w', `${validWidth}px`);
            this.loomframe.project.editor.leftbox = validWidth;
        }

        if (this.resizetype === 'y+') {
            const validHeight = Math.max(this.LIMITS.top.min, Math.min(e.clientY, this.LIMITS.top.max));

            document.documentElement.style.setProperty('--top-h', `${validHeight}px`);
            this.loomframe.project.editor.topbox = validHeight;
        }

        if(this.resizetype === 'x-') {
            const validWidth = Math.max(this.LIMITS.right.min, Math.min(window.innerWidth - e.clientX, this.LIMITS.right.max));

            document.documentElement.style.setProperty('--right-w', `${validWidth}px`);
            this.loomframe.project.editor.rightbox = validWidth;
        }

        if (this.resizetype === 'y-') {
            const validHeight = Math.max(this.LIMITS.bottom.min, Math.min(window.innerHeight - e.clientY, this.LIMITS.bottom.max));

            document.documentElement.style.setProperty('--bottom-h', `${validHeight}px`);
            this.loomframe.project.editor.bottombox = validHeight;
        }

        this.timelineresize();
    }

    resizeup = () => {
        window.removeEventListener('mousemove', this.resizemove);
        window.removeEventListener('mouseup', this.resizeup);

        document.body.style.cursor = 'auto';

        this.resizetype = null;
    }
}