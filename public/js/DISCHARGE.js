import { RunGridConnected } from "./RunGridConnected.js";

export function discharge(Pw, Pp, Eb, Ebmax, uinv, Pl, t, Pg, Ebmin, Edump, Edch, Ech, gridc, time1) {
    t = t - 1;
    let Pdch = new Array(Pw.length).fill(0);

    Pdch[t] = (Pl[t] / uinv) - (Pw[t] + Pp[t]);
    Edch[t] = Pdch[t] * 1;

    if ((Eb[t-1] - Ebmin) > Edch[t]) {
        Eb[t] = Eb[t-1] - Edch[t];
        time1[t] = 2;
        return [Eb, Edump, Edch, gridc, time1, t];
    } else if ((Eb[t-1] - Ebmin) <= Edch[t]) {
        Eb[t] = Ebmin;
        Edch[t] = Eb[t-1] - Eb[t];

        [Eb, Edump, gridc, t] = RunGridConnected(Pw, Pp, Eb, Ebmax, uinv, Pl, t, Pg, Edump, gridc, Ebmin);

        return [Eb, Edump, Edch, gridc, time1, t];
    }
}
