export function zeros(x, y = 1) {
    let v = [];
    let aux = [];

    for (let j = 0; j < y; j++) {
        for (let i = 0; i < x; i++) {
            aux.push(0);
        }
        if (y === 1) {
            v = [...aux];
        } else {
            v.push(aux);
            aux = [];
        }
    }
    return v;
}

export function transpose(A) {
    let m = A.length;
    let n = A[0].length;
    let At = [];

    for (let i = 0; i < n; i++) {
        At.push([]);
    }

    for (let l = 0; l < m; l++) {
        for (let c = 0; c < n; c++) {
            At[c].push(A[l][c]);
        }
    }
    return At;
}

export function find(x, tol = 1e-6) {
    return x.filter(element => element > tol || element < -tol);
}

export async function read_file(path) {
    try {
        const response = await fetch(path);
        if(!response.ok){
            throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
        }

        const text = await response.text();
        return text.split("\n").map(x => parseFloat(x.trim())); 
    } catch (error) {
        console.error("Error reading file:", error);
        return []; 
    }
}

export function op_list(list, num, op) {
    let sol = [];
    op = op.toLowerCase();

    switch (op) {
        case 'div':
            sol = list.map(element => element / num);
            break;
        case 'div2':
            sol = list.map(element => num / element);
            break;
        case 'add':
            sol = list.map(element => element + num);
            break;
        case 'mult':
            sol = list.map(element => element * num);
            break;
        case 'sub':
            sol = list.map(element => element - num);
            break;
        case 'sub2':
            sol = list.map(element => num - element);
            break;
        default:
            console.error("Operação inválida");
            return [];
    }
    return sol;
}

export function op_list2(L1, L2, op) {
    if (L1.length !== L2.length) {
        return "ERROR DE DIMENSIONES";
    }

    let sol = [];
    op = op.toLowerCase();

    switch (op) {
        case 'div':
            sol = L1.map((value, i) => value / L2[i]);
            break;
        case 'div2':
            sol = L1.map((value, i) => L2[i] / value);
            break;
        case 'add':
            sol = L1.map((value, i) => value + L2[i]);
            break;
        case 'mult':
            sol = L1.map((value, i) => value * L2[i]);
            break;
        case 'sub':
            sol = L1.map((value, i) => value - L2[i]);
            break;
        case 'sub2':
            sol = L1.map((value, i) => L2[i] - value);
            break;
        default:
            console.error("Operação inválida");
            return [];
    }
    return sol;
}
