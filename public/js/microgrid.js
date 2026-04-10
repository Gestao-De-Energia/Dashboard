//import * as fs from "fs";

export default class Microgrid {
    constructor({
        load,
        temperature,
        solar_irradiance,
        wind_velocity,
        wind_height,
        lifetime = 24,
        maintenance_cost_rate = 0.02,
        discount_rate = 0.15,
        photovoltaic_panel,
        wind_turbine,
        battery,
        public_grid,
        inverter,
        converter,
        lcoe,
        renewable_factor,
        meef,
    }) {
        // Objectives

        this.lcoe = lcoe;
        this.renewable_factor = renewable_factor;
        this.meef = meef;

        this.load = load;
        this.temperature = temperature;
        this.solar_irradiance = solar_irradiance;
        this.wind_velocity = wind_velocity;
        this.wind_height = wind_height;
        this.lifetime = lifetime;
        this.maintenance_cost_rate = maintenance_cost_rate;
        this.discount_rate = discount_rate;
        this.photovoltaic_panel = photovoltaic_panel;
        this.wind_turbine = wind_turbine;
        this.battery = battery;
        this.public_grid = public_grid;
        this.inverter = inverter;
        this.converter = converter;
        this.hour_steps = load.length;
        this.surplus_energy = new Float64Array(this.hour_steps);
    }

    static _no_battery_charge(surplus_energy, converter_efficiency, t) {
        return surplus_energy;
    }

    static _no_battery_discharge(
        energy_demanded_adjusted,
        inverter_efficiency,
        t,
    ) {
        return energy_demanded_adjusted;
    }

    static _no_public_grid_export(surplus_energy, inverter_efficiency, t) {
        return surplus_energy;
    }

    static _no_public_grid_import(energy_demanded, t) {
        return null;
    }

    initialize(max_pan, max_wind) {
        this.energy_generated = new Float64Array(this.hour_steps);
        this.surplus_energy = new Float64Array(this.hour_steps);
        this.lcoe = 0.0;
        this.renewable_factor = 0.0;
        this.meef = 0.0;
        if (this.photovoltaic_panel) {
            this.photovoltaic_panel.initialize(this.hour_steps, max_pan);
        }
        if (this.wind_turbine) {
            this.wind_turbine.initialize(this.hour_steps, max_wind);
        }
        if (this.battery) {
            this.battery.initialize(this.hour_steps);
        }
        if (this.public_grid) {
            this.public_grid.initialize(this.hour_steps);
        }
    }

    generate_energy() {
        if (this.photovoltaic_panel) {
            this.photovoltaic_panel.generate_power(
                this.temperature,
                this.solar_irradiance,
            );
            for (let i = 0; i < this.hour_steps; i++) {
                this.energy_generated[i] +=
                    this.photovoltaic_panel.output_power[i];
            }
        }
        if (this.wind_turbine) {
            this.wind_turbine.generate_power(
                this.wind_velocity,
                this.wind_height,
            );
            for (let i = 0; i < this.hour_steps; i++) {
                this.energy_generated[i] += this.wind_turbine.output_power[i];
            }
        }
    }

    dispatch_energy_by_generators(
        energy_demanded_adjusted,
        inverter_efficiency,
    ) {
        if (this.photovoltaic_panel && this.wind_turbine) {
            for (let i = 0; i < energy_demanded_adjusted.length; i++) {
                const demand = energy_demanded_adjusted[i];

                const wind_half = Math.min(
                    this.wind_turbine.output_power[i],
                    demand / 2,
                );

                const pv_meet = Math.min(
                    this.photovoltaic_panel.output_power[i],
                    demand - wind_half,
                );

                this.photovoltaic_panel.meet_demand[i] = pv_meet;

                const wind_meet = Math.min(
                    this.wind_turbine.output_power[i],
                    demand - pv_meet,
                );

                this.wind_turbine.meet_demand[i] = wind_meet;

                // aplicar eficiência
                this.photovoltaic_panel.meet_demand[i] *= inverter_efficiency;
                this.wind_turbine.meet_demand[i] *= inverter_efficiency;
            }
        } else if (this.photovoltaic_panel) {
            for (let i = 0; i < energy_demanded_adjusted.length; i++) {
                this.photovoltaic_panel.meet_demand[i] = Math.min(
                    this.photovoltaic_panel.output_power[i],
                    energy_demanded_adjusted[i],
                );
            }
        } else if (this.wind_turbine) {
            for (let i = 0; i < energy_demanded_adjusted.length; i++) {
                this.wind_turbine.meet_demand[i] = Math.min(
                    this.wind_turbine.output_power[i],
                    energy_demanded_adjusted[i],
                );
            }
        }
    }

    dispatch_energy() {
        let converter_efficiency = 1.0;
        let charge_battery;
        let discharge_battery;
        if (this.battery) {
            charge_battery = this.battery.charge.bind(this.battery);
            discharge_battery = this.battery.discharge.bind(this.battery);
            if (this.converter) {
                converter_efficiency = this.converter.efficiency;
            }
        } else {
            charge_battery = Microgrid._no_battery_charge;
            discharge_battery = Microgrid._no_battery_discharge;
        }

        let inverter_efficiency;
        if (this.inverter) {
            inverter_efficiency = this.inverter.efficiency;
        } else {
            inverter_efficiency = 1.0;
        }

        let export_energy;
        let import_energy;
        if (this.public_grid && this.public_grid.credit_rate > 0) {
            export_energy = this.public_grid.export_energy.bind(
                this.public_grid,
            );
            import_energy = this.public_grid.import_energy.bind(
                this.public_grid,
            );
        } else if (this.public_grid) {
            export_energy = Microgrid._no_public_grid_export;
            import_energy = this.public_grid.import_energy.bind(
                this.public_grid,
            );
        } else {
            export_energy = Microgrid._no_public_grid_export;
            import_energy = Microgrid._no_public_grid_import;
        }

        const n = this.load.length;

        const energy_demanded_adjusted = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            energy_demanded_adjusted[i] = this.load[i] / inverter_efficiency;
        }

        this.dispatch_energy_by_generators(
            energy_demanded_adjusted,
            inverter_efficiency,
        );

        for (let t = 0; t < n; t++) {
            const generated = this.energy_generated[t];
            const demand = energy_demanded_adjusted[t];

            const there_is_surplus = generated > demand;

            const energy_flow_adjusted = Math.abs(generated - demand);

            if (there_is_surplus) {
                let remaining_surplus_energy = energy_flow_adjusted;

                let remaining_after_charge =
                    charge_battery(
                        remaining_surplus_energy,
                        converter_efficiency,
                        t,
                    ) / converter_efficiency;

                this.meef += remaining_after_charge;

                this.surplus_energy[t] =
                    export_energy(
                        remaining_after_charge,
                        inverter_efficiency,
                        t,
                    ) / inverter_efficiency;
            } else {
                let remaining_deficit = energy_flow_adjusted;

                let remaining_after_discharge =
                    discharge_battery(
                        remaining_deficit,
                        inverter_efficiency,
                        t,
                    ) * inverter_efficiency;

                import_energy(remaining_after_discharge, t);
            }
        }

        if (this.battery) {
            this.battery.state_of_charge =
                this.battery.state_of_charge.slice(1);
        }
    }

    economic_analysis(sum_of_loads) {
        let CRF;
        if (this.discount_rate > 0) {
            CRF =
                (this.discount_rate *
                    (1 + this.discount_rate) ** this.lifetime) /
                ((1 + this.discount_rate) ** this.lifetime - 1);
        } else {
            CRF = 1 / this.lifetime;
        }

        const project_lifetime_intervals = Array.from(
            { length: this.lifetime + 1 },
            (_, i) => i,
        );

        let der_rated_power = 0.0;

        if (this.photovoltaic_panel) {
            this.lcoe += this.photovoltaic_panel.economic_analysis(
                project_lifetime_intervals,
                this.maintenance_cost_rate,
                this.discount_rate,
                CRF,
            );
            der_rated_power += this.photovoltaic_panel.rated_power;
        }

        if (this.wind_turbine) {
            this.lcoe += this.wind_turbine.economic_analysis(
                project_lifetime_intervals,
                this.maintenance_cost_rate,
                this.discount_rate,
                CRF,
            );
            der_rated_power += this.wind_turbine.rated_power;
        }

        if (this.battery) {
            this.lcoe += this.battery.economic_analysis(
                project_lifetime_intervals,
                this.maintenance_cost_rate,
                this.discount_rate,
                CRF,
            );
        }

        if (this.public_grid) {
            this.lcoe += this.public_grid.economic_analysis(
                this.lifetime,
                this.discount_rate,
            );
        }

        if (this.inverter) {
            this.lcoe += this.inverter.economic_analysis(
                der_rated_power * 1.2,
                project_lifetime_intervals,
                this.maintenance_cost_rate,
                this.discount_rate,
                CRF,
            );
        }

        if (this.converter) {
            this.lcoe += this.converter.economic_analysis(
                der_rated_power * 1.2,
                project_lifetime_intervals,
                this.maintenance_cost_rate,
                this.discount_rate,
                CRF,
            );
        }

        this.lcoe *= CRF / sum_of_loads;
    }

    calculate_renewable_factor(sum_of_loads) {
        let pv_meet, wt_meet, bat_meet;

        if (this.photovoltaic_panel) {
            pv_meet = this.photovoltaic_panel.meet_demand;
        } else {
            pv_meet = 0;
        }

        if (this.wind_turbine) {
            wt_meet = this.wind_turbine.meet_demand;
        } else {
            wt_meet = 0;
        }

        if (this.battery) {
            bat_meet = this.battery.meet_demand;
        } else {
            bat_meet = 0;
        }

        let total = 0;

        for (let i = 0; i < pv_meet.length; i++) {
            total += pv_meet[i] + wt_meet[i] + bat_meet[i];
        }

        this.renewable_factor = total / sum_of_loads;
    }

    run(max_pan, max_wind) {
        this.initialize(max_pan, max_wind);
        this.generate_energy();
        this.dispatch_energy();

        const sum_of_loads = this.load.reduce((acc, x) => acc + x, 0);

        this.economic_analysis(sum_of_loads);
        this.calculate_renewable_factor(sum_of_loads);

        let total_generated = 0;
        for (let i = 0; i < this.energy_generated.length; i++) {
            total_generated += this.energy_generated[i];
        }
        this.meef /= total_generated;

        // console.log(`(JAVASCRIPT)\n\nLCOE: ${this.lcoe}\nRF: ${this.renewable_factor}\nMEEF: ${this.meef}\n`);

        return [this.lcoe, this.renewable_factor, this.meef];
    }

    logging(file_name) {
        const header = [
            "Load [kWh]",
            "Photovoltaic Panel Generation [kWh]",
            "Wind Turbine Generation [kWh]",
            "Photovoltaic Panel Supply [kWh]",
            "Wind Turbine Supply [kWh]",
            "Battery State of Charge [kWh]",
            "Battery Charge [kWh]",
            "Battery Discharge [kWh]",
            "Battery Supply [kWh]",
            "Energy Purchased [kWh]",
            "Energy Credited [kWh]",
            "Energy Compensated [kWh]",
            "Energy Surplus [kWh]",
        ];

        let csv = header.join(",") + "\n";

        for (let i = 0; i < this.hour_steps; i++) {
            const row = [
                this.load[i],
                this.photovoltaic_panel
                    ? this.photovoltaic_panel.output_power[i]
                    : 0,
                this.wind_turbine ? this.wind_turbine.output_power[i] : 0,
                this.photovoltaic_panel
                    ? this.photovoltaic_panel.meet_demand[i]
                    : 0,
                this.wind_turbine ? this.wind_turbine.meet_demand[i] : 0,
                this.battery ? this.battery.state_of_charge[i] : 0,
                this.battery ? this.battery.energy_charged[i] : 0,
                this.battery ? this.battery.energy_discharged[i] : 0,
                this.battery ? this.battery.meet_demand[i] : 0,
                this.public_grid ? this.public_grid.energy_purchased[i] : 0,
                this.public_grid ? this.public_grid.energy_credited[i] : 0,
                this.public_grid ? this.public_grid.energy_compensated[i] : 0,
                this.surplus_energy[i],
            ];

            csv += row.join(",") + "\n";
        }

        const full_path = `${file_name}.csv`;
        //fs.writeFileSync(full_path, csv, "utf8");
    }
}
