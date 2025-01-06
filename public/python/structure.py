class best:
    def __init__(self, position, cost):
        self.position = position
        self.cost = cost

class empty_particle:
    def __init__(self, position, velocity, cost, best):
        self.position = position
        self.velocity = velocity
        self.cost = cost
        self.best = best

class globalbest:
    def __init__(self, cost, position):
        self.cost = cost
        self.position = position
