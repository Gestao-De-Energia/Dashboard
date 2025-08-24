import { techno_ka } from './techno_ka.js';
import { emptyparticle, best, globalbest } from './structure.js';

export default async function CDEEPSO(iterations, steps, shouldPause, fixedValues, startIteration = 0) {
    const init_t = Date.now() / 1000;

    let runningStatus = document.getElementById("running_sim_status"); // apenas para avisar em qual iteração está

    // Problem definition
    const C = 0.65; // price of electricity
    const W = 0.14; // loss of load probability
    const K = 0.9;  // renewable energy factor
    const nvars = 1; // only one system

    const LB = [10, 1, 1, 1];  // Lower bound (p_npv, ad, houses, nwt)
    const UB = [150, 3, 30, 8]; // Upper bound

    const max_it = 10;
    const NPOP = 10;
    let velmax = [];

    for (let d = 0; d < 4; d++) {
        if (LB[d] > -1e20 && UB[d] < 1e20) {
            velmax[d] = (UB[d] - LB[d]) / NPOP;
        } else {
            velmax[d] = Infinity;
        }
    }

    // Algorithm initial parameters
    const phi1 = 2.05;
    const phi2 = 2.05;
    const phi = phi1 + phi2;
    const chi = 2 / (phi - 2 + Math.sqrt(Math.pow(phi, 2) - 4 * phi));

    const w1 = chi;               // Inertia weight
    const c1 = chi * phi1;        // Personal learning coefficient
    const c2 = chi * phi2;        // Global learning coefficient

    // Initialization
    let particle = [];

    for (let i = 0; i < NPOP; i++) {
        particle.push(new emptyparticle([], [], [], new best([], [])));
    }

    let global_best = new globalbest(Infinity, []);

    for (let i = 0; i < NPOP; i++) {
        let cc = 1;
        let ww = 0.3;
        let kkk = 2;
        let ff = 0;

        while (ww >= W || kkk >= K) {
            particle[i].position = LB.map((lb, index) => lb + Math.random() * (UB[index] - lb));
            particle[i].velocity = Array(4).fill(0).map(() => Math.random());

            let p_npv = particle[i].position[0];
            let ad = particle[i].position[1];
            let houses = Math.round(particle[i].position[2]);
            let nwt = Math.round(particle[i].position[3]);

            var [LPSP, price_electricity, renewable_factor, b, ali, ali2] = await techno_ka(houses, p_npv, ad, nwt, steps);
            ff += 1;
            ww = LPSP;
            kkk = renewable_factor;
        }
        
        particle[i].cost = price_electricity;
        particle[i].best.position = particle[i].position;
        particle[i].best.cost = particle[i].cost;

        if (particle[i].best.cost < global_best.cost) {
            global_best = particle[i].best;
        }
    }

    // Algorithm main loop
    let Fminn = Array(iterations).fill(0);

    let temp_renewable_factor, temp_LPSP, temp_price_electricity;

    let u = startIteration;
    for (u; u < iterations; u++) {
        let vv = 0;
        runningStatus.innerHTML = `Rodando iteração ${u+1}/${iterations}`;

        for (let i = 0; i < NPOP; i++) {
            if (shouldPause()) {
                return { pausedAtIteration: u }; // cancela a iteração atual se usuario pausou
            }

            let cc = 1;
            let LPSP = 0.3;
            let renewable_factor = 2;
            let bb = 0;

            while (LPSP >= W || renewable_factor >= K) {
                for (let y = 0; y < 4; y++) {
                    let mut = Math.random();
                    particle[i].velocity[y] = (
                        (w1 * mut) * particle[i].velocity[y] +
                        (c1 * mut) * Math.random() * (particle[i].best.position[y] - particle[i].position[y]) +
                        (c2 * mut) * Math.random() * (global_best.position[y] - particle[i].position[y])
                    );

                    particle[i].position[y] = particle[i].position[y] + particle[i].velocity[y];
                    particle[i].position[y] = Math.max(LB[y], Math.min(UB[y], particle[i].position[y]));    
                }

                let oo = 0;
                var p_npv = Math.round(particle[i].position[0]);
                var ad = Math.round(particle[i].position[1]);
                var houses = Math.round(particle[i].position[2]);
                var nwt = Math.round(particle[i].position[3]);

                // Sobrescreve se tiver fixado
                if (fixedValues.generation !== null) p_npv = fixedValues.generation;
                if (fixedValues.houses !== null) houses = fixedValues.houses;
                if (fixedValues.turbines !== null) nwt = fixedValues.turbines;

                [LPSP, price_electricity, renewable_factor, b, ali, ali2] = await techno_ka(houses, p_npv, ad, nwt, steps);
                bb += 1;
            }

            [LPSP, price_electricity, renewable_factor, b, ali, ali2] = await techno_ka(houses, p_npv, ad, nwt, steps);
            particle[i].cost = price_electricity;
            var rnwfct = renewable_factor;
            vv += 1;

            if (particle[i].cost < particle[i].best.cost) {
                particle[i].best.cost = particle[i].cost;
                particle[i].best.position = particle[i].position;

                if (particle[i].best.cost < global_best.cost) {
                    global_best = particle[i].best;
                    var rnwfct_best = rnwfct;
                }
            }

            temp_renewable_factor = renewable_factor;
            temp_LPSP = LPSP;
            temp_price_electricity = price_electricity;
        }
        
        Fminn[u] = global_best.cost;
        let Xmin = global_best.position;
        p_npv = fixedValues.generation !== null ? fixedValues.generation : Math.round(global_best.position[0]);
        ad = Math.round(global_best.position[1]);
        houses = fixedValues.houses !== null ? fixedValues.houses : Math.round(global_best.position[2]);
        nwt = fixedValues.turbines !== null ? fixedValues.turbines : Math.round(global_best.position[3]);

        console.log(`Iteration ${u}, Best cost = ${Fminn[u]}`);
        console.log(`Best solution p_npv = ${p_npv}, ad = ${ad}, houses = ${houses}, nwt = ${nwt}`);

        // mostrando valores temporários nos cards (exceto na primeira iteração)
        const metricas = document.querySelectorAll(".metrica-texto .valor");
        const valoresTemp = [
            (temp_renewable_factor * 100).toFixed(2).replace(".", ",") + "%",
            (temp_LPSP * 100).toFixed(2).replace(".", ",") + "%",
            "R$" + temp_price_electricity.toFixed(3).replace(".", ",") + "/kWh",
            houses,
            nwt,
            p_npv + " kWh"
        ];

        metricas.forEach((el, index) => {
            el.innerText = valoresTemp[index];
            el.classList.add("temp"); // aplicando opacidade
            el.style.display = "inline";
        });
    
    }

    runningStatus.innerHTML = ""; // apagando
    [LPSP, price_electricity, renewable_factor, b, ali, ali2] = await techno_ka(houses, p_npv, ad, nwt, steps);
    //console.log(`LOLP ${LPSP}, $/KWh = ${price_electricity}, %RES = ${renewable_factor}`);

    let simulationData = {
        "renewable_factor": renewable_factor,
        "price_electricity": price_electricity,
        "loss_load_probability": LPSP,
        "houses": houses,
        "num_wind_turbines": nwt,
        "max_generation": p_npv
    };

    // Salvando os dados gerados localmente
    localStorage.setItem("simulationData", JSON.stringify(simulationData));

    //console.log(`Total time ${((Date.now() / 1000) - init_t).toFixed(2)} seconds`);
}