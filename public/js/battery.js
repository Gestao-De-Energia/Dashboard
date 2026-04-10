export default class Battery {
    constructor({
        capacity,
        cost_per_kwh,
        efficiency,
        lifetime,
        number_of_cycles,
        depth_of_discharge = 0.8,
    }) {
        this.cycles = 0.0;

        this.capacity = capacity;
        this.cost_per_kwh = cost_per_kwh;
        this.efficiency = efficiency;
        this.lifetime = lifetime;
        this.number_of_cycles = number_of_cycles;
        this.energy_per_cycle = capacity * depth_of_discharge;
        this.depth_of_discharge = depth_of_discharge;
        this.min_soc = capacity * (1 - depth_of_discharge);
    }

    initialize(hour_steps) {
        this.state_of_charge = new Float64Array(hour_steps + 1);
        this.energy_charged = new Float64Array(hour_steps);
        this.energy_discharged = new Float64Array(hour_steps);
        this.meet_demand = new Float64Array(hour_steps);
        this.state_of_charge[0] = this.capacity;
    }

    charge(surplus_energy, converter_efficiency, t) {
        const t_soc = t + 1;
        const state_of_charge = this.state_of_charge[t];
        const surplus_energy_adjusted = surplus_energy * converter_efficiency;
        this.state_of_charge[t_soc] = Math.min(
            state_of_charge + surplus_energy_adjusted,
            this.capacity,
        );
        const energy_to_charge = this.state_of_charge[t_soc] - state_of_charge;
        this.energy_charged[t] = energy_to_charge;
        this.cycles += energy_to_charge / (2 * this.energy_per_cycle);

        return surplus_energy_adjusted - energy_to_charge;
    }

    discharge(energy_demanded_adjusted, inverter_efficiency, t) {
        const t_soc = t + 1;
        const state_of_charge = this.state_of_charge[t];
        this.state_of_charge[t_soc] = Math.max(
            state_of_charge - energy_demanded_adjusted / this.efficiency,
            this.min_soc,
        );
        const energy_to_discharge =
            state_of_charge - this.state_of_charge[t_soc];
        this.energy_discharged[t] = energy_to_discharge;
        this.cycles += energy_to_discharge / (2 * this.energy_per_cycle);
        this.meet_demand[t] =
            energy_to_discharge * this.efficiency * inverter_efficiency;

        return energy_demanded_adjusted - energy_to_discharge * this.efficiency;
    }

    economic_analysis(
        project_lifetime_intervals,
        maintenance_cost_rate,
        discount_rate,
        CRF,
    ) {
        const installation_cost = this.cost_per_kwh * this.capacity;
        let NPC = installation_cost;
        NPC += (installation_cost * maintenance_cost_rate) / CRF;

        let lifetime_cycles;
        if (this.cycles > 0) {
            lifetime_cycles = this.number_of_cycles / this.cycles;
        } else {
            lifetime_cycles = Infinity;
        }

        const t_eff = Math.min(this.lifetime, lifetime_cycles);
        const n_repl = project_lifetime_intervals.map((t) =>
            Math.ceil(t / t_eff),
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
