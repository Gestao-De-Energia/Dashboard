export class best {
    constructor(position, cost) {
        this.position = position;
        this.cost = cost;
    }
}

export class emptyparticle {
    constructor(position, velocity, cost, best) {
        this.position = position;
        this.velocity = velocity;
        this.cost = cost;
        this.best = best;
    }
}

export class globalbest {
    constructor(cost, position) {
        this.cost = cost;
        this.position = position;
    }
}
