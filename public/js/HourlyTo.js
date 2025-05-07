/* 
* o código em python apresenta uma série de inconstâncias 
* e não aparenta ser utilizado em outros códigos, mas
* mesmo assim resolvi traduzir para JavaScript.
*/

function zeros(size) {
    return new Array(size).fill(0);
}

function hourlyToDaily(y) {
    let a = zeros(24);
    let x = zeros(24);

    for (let i = 0; i < 360; i++) {
        for (let k = 0; k < 24; k++) {
            a[k] += y[i][k];
        }
    }

    for (let i = 0; i < 24; i++) {
        x[i] = a[i] / 360;
    }

    return x;
}

function hourlyToMonthly(y) {
    let a = zeros(12);
    let x = zeros(12);

    for (let i = 0; i < 12; i++) {
        for (let k = 0; k < 720; k++) {
            a[k] += y[i][k];
        }
    }

    for (let i = 0; i < 12; i++) {
        x[i] = a[i] / 720;
    }

    return x;
}
