class best {
    constructor(position, cost) {
        this.position = position;
        this.cost = cost;
    }
}

class empty_particle {
    constructor(position, velocity, cost, best) {
        this.position = position;
        this.velocity = velocity;
        this.cost = cost;
        this.best = best;
    }
}

class globalbest {
    constructor(cost, position) {
        this.cost = cost;
        this.position = position;
    }
}
