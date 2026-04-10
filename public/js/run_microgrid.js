import Microgrid from "./microgrid.js";
import PhotovoltaicPanel from "./photovoltaic_panel.js";
import WindTurbine from "./wind_turbine.js";
import Battery from "./battery.js";
import PublicGrid from "./public_grid.js";
import Inverter from "./inverter.js";
import Converter from "./converter.js";

export async function read_file(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(
                `Erro ao carregar o arquivo: ${response.statusText}`,
            );
        }

        const text = await response.text();
        return text.split("\n").map((x) => parseFloat(x.trim()));
    } catch (error) {
        console.error("Error reading file:", error);
        return [];
    }
}

let load_ind_cached = null;
let solar_data_cached = null;
let wind_data_cached = null;

export default async function runMicrogrid(
    max_it = 10,
    initial_bat = 0,
    isPausedFn = () => false,
    getFixedValues = () => ({ panels: null, turbines: null }),
    getBattery = () => initial_bat,
    onIteration = () => {},
) {
    let select_bat = initial_bat;
    const exchange_rate = 1.14;

    // Photovoltaic panel input
    const pv_cost_per_kwp = 210;
    //const pv_rated_power = 50;
    const pv_lifetime = 25;

    // Wind turbine input
    const wt_cost_per_kw = 900;
    //const wt_rated_power = 30;
    const wt_rated_wind_speed = 15;
    const cut_in = 2.5;
    const cut_out = 40;
    const wt_lifetime = 20;
    const wt_height = 30;

    // Battery input
    const bat_dod = 0.8;
    const bat_cap = 200;
    const bat_efficiency_list = [
        0.765, 0.9, 0.92, 0.96, 0.94, 0.938, 0.9155, 0.95, 0.86, 0.855, 0.7,
        0.8, 0.75, 0.7,
    ];
    // Each battery capacity cost in [€$]
    const bat_cap_cost_list = [
        7.31393, 28.575, 28.575, 9.8066225, 20.67004375, 7.540625, 10.1099133,
        6.746875, 38.1, 6.99371645, 9.55675, 31.40075, 45.10395475, 14.5415,
        12.4139325,
    ];
    // Each battery lifetime in [years]
    const bat_lf_list = [
        18, 17.5, 7, 15, 10, 10, 10, 20, 14, 13.5, 20, 3, 15, 6.5,
    ];
    // Each battery cycle number
    const bat_cycle_list = [
        1400, 8000, 600, 5000, 1500, 4000, 3000, 1000, 3000, 3250, 1250, 1000,
        10000, 2000,
    ];

    // Public grid input
    const grid_cost_per_kwh = 0.2;
    const grid_tariff_growth = 0.05;
    const grid_credit_rate = 0.1;

    // Inverter input
    const inverter_cost_per_kw = 200;
    const inverter_cost_scale = 0.95;
    const inverter_efficiency = 0.95;
    const inverter_lifetime = 10;

    // Converter input
    const converter_cost_per_kw = 150;
    const converter_cost_scale = 0.95;
    const converter_efficiency = 0.95;
    const converter_lifetime = 15;

    // Microgrid input
    if (!load_ind_cached)
        load_ind_cached = await read_file("../../../js/loadind.txt");
    if (!solar_data_cached)
        solar_data_cached = await read_file("../../../js/solreal.txt");
    if (!wind_data_cached)
        wind_data_cached = await read_file("../../../js/wind_data.txt");

    const load_ind = load_ind_cached;
    const solar_data = solar_data_cached;
    const wind_data = wind_data_cached;

    const baseTemps = [12, 13, 15, 16, 19, 22, 24, 24, 23, 20, 16, 13];
    const temperature = baseTemps.flatMap((temp) => Array(720).fill(temp));
    const wind_height = 10;
    const microgrid_lifetime = 24;
    const microgrid_maintenance_cost_rate = 0.02;
    const microgrid_discount_rate = 0.1;

    class Best {
        constructor(position, cost, rf, meef) {
            this.position = position;
            this.cost = cost;
            this.rf = rf;
            this.meef = meef;
        }
    }

    class EmptyParticle {
        constructor(position, velocity, cost, rf, meef, best) {
            this.position = position;
            this.velocity = velocity;
            this.cost = cost;
            this.rf = rf;
            this.meef = meef;
            this.best = best;
        }
    }

    class GlobalBest {
        constructor(cost, rf, meef, position) {
            this.cost = cost;
            this.rf = rf;
            this.meef = meef;
            this.position = position;
        }
    }

    const photovoltaic_panel = new PhotovoltaicPanel({
        cost_per_kwp: pv_cost_per_kwp,
        //rated_power: pv_rated_power,
        lifetime: pv_lifetime,
    });

    const wind_turbine = new WindTurbine({
        cost_per_kw: wt_cost_per_kw,
        //rated_power: wt_rated_power,
        rated_wind_speed: wt_rated_wind_speed,
        cut_in: cut_in,
        cut_out: cut_out,
        height: wt_height,
        lifetime: wt_lifetime,
    });

    let battery = new Battery({
        capacity: bat_cap,
        cost_per_kwh: bat_cap_cost_list[select_bat] * exchange_rate,
        efficiency: bat_efficiency_list[select_bat],
        lifetime: bat_lf_list[select_bat],
        number_of_cycles: bat_cycle_list[select_bat],
        depth_of_discharge: bat_dod,
    });

    const public_grid = new PublicGrid({
        cost_per_kwh: grid_cost_per_kwh,
        tariff_growth: grid_tariff_growth,
        credit_rate: grid_credit_rate,
    });

    const inverter = new Inverter({
        cost_per_kw: inverter_cost_per_kw,
        cost_scale: inverter_cost_scale,
        efficiency: inverter_efficiency,
        lifetime: inverter_lifetime,
    });

    const converter = new Converter({
        cost_per_kw: converter_cost_per_kw,
        cost_scale: converter_cost_scale,
        efficiency: converter_efficiency,
        lifetime: converter_lifetime,
    });

    let lcoe = 0.0;
    let renewable_factor = 0.0;
    let meef = 0.0;

    let microgrid = new Microgrid({
        load: load_ind.slice(0, 8640),
        temperature: temperature.slice(0, 8640),
        solar_irradiance: solar_data.slice(0, 8640),
        wind_velocity: wind_data.slice(0, 8640),
        wind_height: wind_height,
        lifetime: microgrid_lifetime,
        maintenance_cost_rate: microgrid_maintenance_cost_rate,
        discount_rate: microgrid_discount_rate,
        photovoltaic_panel: photovoltaic_panel,
        wind_turbine: wind_turbine,
        battery: battery,
        public_grid: public_grid,
        inverter: inverter,
        converter: converter,
        lcoe: lcoe,
        renewable_factor: renewable_factor,
        meef: meef,
    });

    const NPOP = 100; // população
    const LB = [10, 10]; // lower boundary da geraçao maxima dos paineis e turbina respectivamente
    const UB = [150, 150]; // upper boundary

    const phi1 = 2.05;
    const phi2 = 2.05;
    const phi = phi1 + phi2;
    const chi = 2 / (phi - 2 + Math.sqrt(Math.pow(phi, 2) - 4 * phi));

    const w1 = chi; // Inertia weight
    const c1 = chi * phi1; // Personal learning coefficient
    const c2 = chi * phi2; // Global learning coefficient

    let particle = [];
    for (let i = 0; i < NPOP; i++) {
        particle.push(
            new EmptyParticle([], [], [], [], [], new Best([], [], [], [])),
        );
    }

    let globalbest = new GlobalBest(Infinity, Infinity, Infinity, []);

    // inicialização
    for (let i = 0; i < NPOP; i++) {
        let currentFixed = getFixedValues();
        particle[i].position.push(
            currentFixed.panels !== null
                ? currentFixed.panels
                : Math.random() * (UB[0] - LB[0]) + LB[0],
        );
        particle[i].position.push(
            currentFixed.turbines !== null
                ? currentFixed.turbines
                : Math.random() * (UB[1] - LB[1]) + LB[1],
        );

        for (let y = 0; y < 2; y++) {
            particle[i].velocity.push(Math.random());
        }

        let max_pan = particle[i].position[0];
        let max_wind = particle[i].position[1];

        let [lcoe, renewable_factor, meef] = microgrid.run(max_pan, max_wind);

        particle[i].cost = lcoe;
        particle[i].rf = renewable_factor;
        particle[i].meef = meef;

        particle[i].best.position = [...particle[i].position];
        particle[i].best.cost = particle[i].cost;
        particle[i].best.rf = particle[i].rf;
        particle[i].best.meef = particle[i].meef;

        if (particle[i].best.cost < globalbest.cost) {
            globalbest = new GlobalBest(
                particle[i].best.cost,
                particle[i].best.rf,
                particle[i].best.meef,
                [...particle[i].best.position],
            );
        }
    }

    let Fminn = new Array(max_it).fill(0);
    let Rf = new Array(max_it).fill(0);
    let Meef = new Array(max_it).fill(0);

    for (let u = 0; u < max_it; u++) {
        // Libera a thread principal para o navegador atualizar a interface (exibir GIFs e animar botão)
        await new Promise((resolve) => setTimeout(resolve, 0));

        let waitTime = 0;
        while (waitTime < 2000) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (!isPausedFn()) {
                waitTime += 100;
            }
        }

        while (isPausedFn()) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        let currentBat = getBattery();
        let batChanged = false;
        if (currentBat !== select_bat) {
            select_bat = currentBat;
            microgrid.battery = new Battery({
                capacity: bat_cap,
                cost_per_kwh: bat_cap_cost_list[select_bat] * exchange_rate,
                efficiency: bat_efficiency_list[select_bat],
                lifetime: bat_lf_list[select_bat],
                number_of_cycles: bat_cycle_list[select_bat],
                depth_of_discharge: bat_dod,
            });
            batChanged = true;
        }

        let currentFixed = getFixedValues();
        let gbViolated = false;
        if (
            currentFixed.panels !== null &&
            Math.round(globalbest.position[0]) !== currentFixed.panels
        )
            gbViolated = true;
        if (
            currentFixed.turbines !== null &&
            Math.round(globalbest.position[1]) !== currentFixed.turbines
        )
            gbViolated = true;
        if (gbViolated || batChanged) globalbest.cost = Infinity;

        for (let i = 0; i < NPOP; i++) {
            let pViolated = false;
            if (
                currentFixed.panels !== null &&
                Math.round(particle[i].best.position[0]) !== currentFixed.panels
            )
                pViolated = true;
            if (
                currentFixed.turbines !== null &&
                Math.round(particle[i].best.position[1]) !==
                    currentFixed.turbines
            )
                pViolated = true;
            if (pViolated || batChanged) particle[i].best.cost = Infinity;

            for (let y = 0; y < 2; y++) {
                let mut = Math.random();
                particle[i].velocity[y] =
                    w1 * mut * particle[i].velocity[y] +
                    c1 *
                        mut *
                        Math.random() *
                        (particle[i].best.position[y] -
                            particle[i].position[y]) +
                    c2 *
                        mut *
                        Math.random() *
                        (globalbest.position[y] - particle[i].position[y]);

                particle[i].position[y] =
                    particle[i].position[y] + particle[i].velocity[y];
                particle[i].position[y] = Math.max(
                    LB[y],
                    Math.min(particle[i].position[y], UB[y]),
                );
            }

            currentFixed = getFixedValues();
            if (currentFixed.panels !== null)
                particle[i].position[0] = currentFixed.panels;
            if (currentFixed.turbines !== null)
                particle[i].position[1] = currentFixed.turbines;

            let max_pan = particle[i].position[0];
            let max_wind = particle[i].position[1];

            let [lcoe, renewable_factor, meef] = microgrid.run(
                max_pan,
                max_wind,
            );

            particle[i].cost = lcoe;
            particle[i].rf = renewable_factor;
            particle[i].meef = meef;

            if (particle[i].cost < particle[i].best.cost) {
                particle[i].best.cost = particle[i].cost;
                particle[i].best.rf = particle[i].rf;
                particle[i].best.meef = particle[i].meef;
                particle[i].best.position = [...particle[i].position];

                if (particle[i].best.cost < globalbest.cost) {
                    globalbest = new GlobalBest(
                        particle[i].best.cost,
                        particle[i].best.rf,
                        particle[i].best.meef,
                        [...particle[i].best.position],
                    );
                }
            }
        }

        Fminn[u] = globalbest.cost;
        Rf[u] = globalbest.rf;
        Meef[u] = globalbest.meef;
        let Xmin = globalbest.position;
        var max_pan_val = Math.round(globalbest.position[0]);
        var max_wind_val = Math.round(globalbest.position[1]);

        onIteration({
            iteration: u,
            lcoe: Fminn[u],
            rf: Rf[u],
            meef: Meef[u],
            max_pan: max_pan_val,
            max_wind: max_wind_val,
        });

        console.log(
            `Iteration ${u}, Best cost = ${Fminn[u]}, RF = ${Rf[u]}, MEEF = ${Meef[u]}`,
        );
        console.log(
            `Best solution max_pan = ${max_pan_val}, max_wind = ${max_wind_val}`,
        );
    }

    return {
        lcoe: globalbest.cost,
        rf: globalbest.rf,
        meef: globalbest.meef,
        max_pan: max_pan_val,
        max_wind: max_wind_val,
    };
}
