import { charge } from "./CHARGE.js";
import { discharge } from "./DISCHARGE.js";
import { economic_fast } from "./EconomicFast.js";
import { RunGridConnected } from "./RunGridConnected.js";
import { read_file, transpose } from "./auxiliar.js";

export async function techno_ka(houses, p_npv, ad, nwt, steps) {
    let g = await read_file("/js/solreal.txt"); // path em desenvolvimento: "../../../js/solreal.txt"; path em prod: "/js/solreal.txt"
    g = g.slice(0, steps);
    
    let tamb = [12, 13, 15, 16, 19, 22, 24, 24, 23, 20, 16, 13];
    
    if (steps <= 168) tamb = Array(168).fill(tamb[0]); // 1 semana
    else if (steps <= 336) tamb = Array(336).fill(tamb[0]); // 2 semanas
    else if (steps <= 720) tamb = Array(720).fill(tamb[0]); // 1 mês
    else if (steps <= 2160) tamb = Array(720).fill(tamb.slice(0, 3)).flat(); // 3 meses
    else if (steps <= 4320) tamb = Array(720).fill(tamb.slice(0, 6)).flat(); // 6 meses
    else if (steps <= 6480) tamb = Array(720).fill(tamb.slice(0, 9)).flat(); // 9 meses
    else tamb = Array(720).fill(tamb).flat(); // 12 meses
    
    let gref = 1;
    let tref = tamb.reduce((sum, value) => sum + value, 0) / tamb.length;
    let kt = -3.7e-3;
    let tc = tamb.map((val, index) => g[index] * (val + 0.0256));
    let upv = 0.986;
    let p_pvout_hourly = g.map((gi, i) => upv * (p_npv * (gi / gref)) * (1 + kt * (tc[i] - tref)));
    
    let loadind = await read_file("/js/loadind.txt"); // path em desenvolvimento: "../../../js/loadind.txt"; path em prod: "/js/loadind.txt"
    loadind = loadind.slice(0, steps);
    let loadres = await read_file("/js/loadres.txt"); // path em desenvolvimento: "../../../js/loadres.txt"; path em prod: "/js/loadres.txt"
    loadres = loadres.slice(0, steps + 2);
    let factor = 5.1;
    let load = loadres.map((l) => (l * factor));
    
    let uinv = 0.75, ub = 0.75, dod = 0.8, bcap = 200;
    let cwh = (bcap / (uinv * ub)) * (1 + 1 - dod);
    
    let shape_w = 1;
    let v1 = await read_file("/js/wind_data.txt"); // path em desenvolvimento: "../../../js/wind_data.txt"; path em prod: "/js/wind_data.txt"
    v1 = v1.slice(0, steps);
    v1 = v1.map((v) => (v * shape_w));
    let h2 = 18;
    let h0 = 27.3;
    let rw = 12;
    let pi = Math.PI;
    let aw = pi * Math.pow(rw, 2);
    let uw = 0.95;
    let vco = 20;
    let vci = 3;
    let vr = 12;
    let pr = 30;
    let alfa = 0.1;
    let pmax = 30;
    let pfurl = 30;
    let v2 = v1.map((v) => (v * Math.pow(h2 / h0, alfa)));
    
    let Png = 0, Bg = 1, Ag = 0, Pg = 1;
    let Fg = Bg * Pg + Ag * Png;
    
    let contribution = Array.from({ length: 5 }, () => Array(steps).fill(0));
    let Ebmax = bcap * (1 + 1 - dod);
    let Ebmin = bcap * (1 - dod);
    let SOCb = 0.2;
    let Eb = Array(steps).fill(0);
    let time1 = Array(steps).fill(0);
    let gridc = Array(steps).fill(0);
    let Edump = Array(steps).fill(0);
    let Edch = Array(steps).fill(0);
    let Ech = Array(steps).fill(0);
    Eb[0] = SOCb * Ebmax;
    
    let Pl = load.slice(1);
    let Pp = p_pvout_hourly.slice();
    Pp = Pp.map((p) => ((p > p_npv) ? p_npv : p));
    
    let Pw = Array(steps).fill(0);
    let Pp_mean = Pp.reduce((sum, value) => sum + value, 0) / Pp.length;
    let pwtg = new Array(steps).fill(0);
    
    // (vci <= v2) & (v2 <= vr)
    for (let i = 0; i < steps; i++) {
        if (vci <= v2[i] && v2[i] <= vr) {
            pwtg[i] = (pr / (Math.pow(vr, 3) - Math.pow(vci, 3))) * Math.pow(v2[i], 3) -
                    (Math.pow(vci, 3) / (Math.pow(vr, 3) - Math.pow(vci, 3))) * pr;
        }
    }
    
    // ~((vci <= v2) & (v2 <= vr)) & (vr <= v2) & (v2 <= vco)
    for (let i = 0; i < steps; i++) {
        if (!(vci <= v2[i] && v2[i] <= vr) && vr <= v2[i] && v2[i] <= vco) {
            pwtg[i] = pr;
        }
    }
    
    // Atualiza Pw
    for (let i = 0; i < Pw.length - 1; i++) {
        Pw[i] = pwtg[i] * uw * nwt;
    }
    
    let Pw_mean = Pw.reduce((sum, value) => sum + value, 0) / Pw.length;
    
    // Loop principal
    for (let t = 0; t < steps - 2; t++) {
        if ((Pw[t] + Pp[t]) >= (Pl[t] / uinv)) {
            if ((Pw[t] + Pp[t]) > Pl[t]) {
                [Edump, Eb, Ech] = charge(Pw, Pp, Eb, Ebmax, uinv, ub, load, t, Edump, Ech);
                time1[t] = 1;
                contribution[0][t] = Pp[t];
                contribution[1][t] = Pw[t];
                contribution[2][t] = Edch[t];
                contribution[3][t] = gridc[t];
                contribution[4][t] = Edump[t];
            } else {
                Eb[t] = Eb[t - 1];
            }
        } else {
            [Eb, Edump, Edch, gridc, time1, t] = discharge(Pw, Pp, Eb, Ebmax, uinv, load, t, Pg, Ebmin, Edump, Edch, Ech, gridc, time1);
            contribution[0][t] = Pp[t];
            contribution[1][t] = Pw[t];
            contribution[2][t] = Edch[t];
            contribution[3][t] = gridc[t];
            contribution[4][t] = Edump[t];
        }
    }
    
    let b = contribution.map(row => row.reduce((sum, value) => sum + value, 0));
    let renewable_factor = ((b[0] + b[1] - (b[2] / (uinv * ub) - b[2]) - b[4] + b[2]) / 
    (b[0] + b[1] - (b[2] / (uinv * ub) - b[2]) - b[4] + b[2] + b[3]));
    
    let k = 0;
    let aa = [];
    
    let Pl_slice = Pl.slice(0, -2); // Pl[:-2]
    let Pp_slice = Pp.slice(0, -1); // Pp[:-1]
    let Pw_slice = Pw.slice(0, -1); // Pw[:-1]
    let Eb_slice = Eb.slice(0, -1); // Eb[:-1]
    let gridc_slice = gridc.slice(0, -1); // gridc[:-1]
    
    // aa = Pl[:-2] - Pp[:-1] - Pw[:-1] + Eb[:-1]
    aa = Pl_slice.map((pl, index) => pl - Pp_slice[index] - Pw_slice[index] + Eb_slice[index]);
    
    // k = np.sum(Pl[:-2] > (Pp[:-1] + Pw[:-1] + (Eb[:-1] - Ebmin) + gridc[:-1]))
    k = Pl_slice.filter((pl, index) => {
        const valor = Pp_slice[index] + Pw_slice[index] + (Eb_slice[index] - Ebmin) + gridc_slice[index];
        return pl > valor;
    }).length;
                           
    let LPSP = k / steps;
    let reliability = aa.reduce((acc, curr) => acc + curr, 0) / load.reduce((acc, curr) => acc + curr, 0);

    let price_electricity = economic_fast(gridc, load, Fg, cwh, p_npv, nwt, Edch);
    
    let ali = [Pp.slice(0, 168), Pw.slice(0, 168), Eb.slice(0, 168), gridc.slice(0, 168), load.slice(0, 168), Edump.slice(0, 168)];
    let ali2 = [Pp.slice(0, steps), Pw.slice(0, steps), Eb.slice(0, steps), Edch.slice(0, steps), Ech.slice(0, steps), gridc.slice(0, steps), load.slice(0, steps), Edump.slice(0, steps)];
    ali = transpose(Array.from(ali));
    ali2 = transpose(Array.from(ali2));

    return [LPSP, price_electricity, renewable_factor, b, ali, ali2];
}
