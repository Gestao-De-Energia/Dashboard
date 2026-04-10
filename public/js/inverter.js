export default class Inverter {
    constructor({
        cost_per_kw,
        cost_scale = 0.95,
        efficiency = 0.95,
        lifetime = 10,
    }) {
        this.operation_cost = 0.0;

        this.cost_per_kw = cost_per_kw;
        this.cost_scale = cost_scale;
        this.efficiency = efficiency;
        this.lifetime = lifetime;
    }

    economic_analysis(
        rated_power,
        project_lifetime_intervals,
        maintenance_cost_rate,
        discount_rate,
        CRF,
    ) {
        const installation_cost =
            this.cost_per_kw * rated_power ** this.cost_scale;
        let NPC = installation_cost;
        NPC += (installation_cost * maintenance_cost_rate) / CRF;
        const n_repl = project_lifetime_intervals.map((t) =>
            Math.ceil(t / this.lifetime),
        );
        NPC += n_repl
            .slice(1)
            .map((val, i) => {
                const diff = val - n_repl[i];
                const discount =
                    (1 + discount_rate) ** project_lifetime_intervals[i + 1];
                return (installation_cost * diff) / discount;
            })
            .reduce((acc, x) => acc + x, 0);
        return NPC;
    }
}
