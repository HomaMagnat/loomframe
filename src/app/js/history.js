export class History {
    constructor() {
        this.past = [];
        this.future = [];
        this.maxhistory = 100;
    }

    execute(action) {
        action.do();
        this.past.push(action);
        this.future = [];

        if (this.past.length > this.maxhistory) {
            this.past.shift();
        }
    }

    undo() {
        if(this.past.length === 0) return;

        const action = this.past.pop();
        action.undo();
        this.future.push(action);
    }

    redo() {
        if(this.future.length === 0) return;

        const action = this.future.pop();
        action.do();
        this.past.push(action);
    }
}