export default class WindTurbine {
    constructor({
        cost_per_kw,
        //rated_power = 5,
        rated_wind_speed = 12.5,
        cut_in = 3,
        cut_out = 20,
        height = 30,
        lifetime = 24,
    }) {
        this.operation_cost = 0.0;

        this.cost_per_kw = cost_per_kw;
        //this.rated_power = rated_power;
        this.rated_wind_speed = rated_wind_speed;
        this.cut_in = cut_in;
        this.cut_out = cut_out;
        this.height = height;
        this.lifetime = lifetime;
    }

    initialize(hour_steps, max_wind) {
        this.rated_power = max_wind;
        this.output_power = new Float64Array(hour_steps);
        this.meet_demand = new Float64Array(hour_steps);
    }

    generate_power(wind_speed, height_reference) {
        const alpha = 1 / 7;

        const factor = (this.height / height_reference) ** alpha;

        for (let i = 0; i < wind_speed.length; i++) {
            const v = wind_speed[i] * factor;

            if (v >= this.cut_in && v <= this.cut_out) {
                const turbine_power =
                    (this.rated_power * (v ** 3 - this.cut_in ** 3)) /
                    (this.rated_wind_speed ** 3 - this.cut_in ** 3);

                this.output_power[i] = Math.min(
                    turbine_power,
                    this.rated_power,
                );
            } else {
                this.output_power[i] = 0;
            }
        }
    }

    economic_analysis(
        project_lifetime_intervals,
        maintenance_cost_rate,
        discount_rate,
        CRF,
    ) {
        const installation_cost = this.cost_per_kw * this.rated_power;
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
