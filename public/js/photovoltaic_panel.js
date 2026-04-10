export default class PhotovoltaicPanel {
    constructor({ cost_per_kwp, /*rated_power = 30,*/ lifetime = 20 }) {
        this.cost_per_kwp = cost_per_kwp;
        //this.rated_power = rated_power;
        this.lifetime = lifetime;
    }

    initialize(hour_steps, max_pan) {
        this.rated_power = max_pan;
        this.output_power = new Float64Array(hour_steps);
        this.meet_demand = new Float64Array(hour_steps);
    }

    generate_power(temperature, solar_irradiance) {
        const irradiance_ref = 1;
        const temperature_ref = 25;
        const power_temperature_coefficient = 3.7e-3;
        const cell_temperature = temperature.map(
            (temp, i) => temp + 0.03125 * solar_irradiance[i],
        );
        for (let i = 0; i < solar_irradiance.length; i++) {
            const cell_temp = temperature[i] + 0.03125 * solar_irradiance[i];

            this.output_power[i] = Math.min(
                this.rated_power *
                    (solar_irradiance[i] / irradiance_ref) *
                    (1 +
                        power_temperature_coefficient *
                            (cell_temp - temperature_ref)),
                this.rated_power,
            );
        }
    }

    economic_analysis(
        project_lifetime_intervals,
        maintenance_cost_rate,
        discount_rate,
        CRF,
    ) {
        const installation_cost = this.cost_per_kwp * this.rated_power;
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
