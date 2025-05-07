function sum(arr){
    return arr.reduce((acc, val) => acc + val, 0);
}

export function economic_fast(gridc, Pl, Fg, cwh, p_npv, nwt, Edch) {
    const DR_2015 = 1.14;
    const WT_C = 2391 * DR_2015;
    const PV_C = 1500 * DR_2015;
    const BAT_C = 581.66 * DR_2015;
    const BAT_BOPC = 440.7;
    const BAT_BOP = 100;
    const BAT_OC = 327;
    //const BAT_BOPT = (BAT_BOPC + BAT_OC) * BAT_BOP
    const BAT_BOPT = ((BAT_BOPC + BAT_OC) * BAT_BOP) * 0;
    const DSL_C = 0 * DR_2015;
    const DSL_FC = 0.65 * DR_2015;
    const INV_CKW = 643 * DR_2015;
    const INV_MAX = 100;
    const INV_C = INV_CKW * INV_MAX;
    const PV_reg = 1500;
    const Wind_reg = 10;
    //const Wind_reg = 1000;

    const INTREST = 6;
    const INFLATION = 1.4;
    const INFLATION_f = 1.4;

    const WT_LF = 20;
    const PV_LF = 20;
    const BAT_LF = 15;
    const DSL_LF = 50;
    const INV_LF = 15;
    const PRJ_LF = 24;

    const BAT_cycle = 10000;
    //const BAT_Tam = 340;
    const BAT_DoD = 0.80;

    let OM = 20;

    const WT_P = 5;
    //const PV_P = 7.3;
    const PV_P = p_npv;
    const BAT_P = cwh;
    const DSL_P = 1;

    let k = gridc.filter(val => val !== 0);
    k = sum(k);

    let fuel_consumption = Fg * k;
    k = DSL_LF / k;
    let price_d;
    let k_d;

    if (k < PRJ_LF) {
        let n = Math.floor(PRJ_LF / k);
        price_d = DSL_C * DSL_P * n;
    } else {
        k_d = PRJ_LF;
        price_d = DSL_C * DSL_P;
    }

    k = Math.floor(PRJ_LF / BAT_LF);
    let price_b = BAT_C * BAT_P * k + BAT_BOPT;
    let dc = (BAT_C * BAT_P) / (BAT_cycle * BAT_P * BAT_DoD);

    let i = (INTREST - INFLATION) / 100;
    let initial_cost = (WT_C * WT_P * nwt) + (PV_C * PV_P) + price_b + price_d + INV_C + PV_reg + Wind_reg;
    OM = initial_cost * (OM / 100);
    initial_cost += OM;

    let Anual_cost = initial_cost * ((i * Math.pow((1 + i), PRJ_LF)) / (Math.pow((1 + i), PRJ_LF) - 1));

    i = (INTREST - INFLATION_f) / 100;
    let Anual_cost_fuel = fuel_consumption * PRJ_LF * DSL_FC * ((i * Math.pow((1 + i), PRJ_LF)) / (Math.pow((1 + i), PRJ_LF) - 1));
    let Anual_cost_batery = dc * sum(Edch) * PRJ_LF * ((i * Math.pow((1 + i), PRJ_LF)) / (Math.pow((1 + i), PRJ_LF) - 1));
    Anual_cost += Anual_cost_fuel + Anual_cost_batery;
    let Anual_load = sum(Pl);
    let price_electricity = Anual_cost / Anual_load;

    return price_electricity;
}
