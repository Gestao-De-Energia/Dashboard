from math import floor

def zeros(x, y=1):
    """int, int --> list
    it creates a matrix x*y full of zeros"""
    v = []
    aux = []
    for j in range(y):
        for i in range(x):
            aux.append(0)
        if y == 1:
            v = aux[:]
        else:
            v.append(aux)
            aux = []
    return v

def transpose(A):
    """matrix --> matrix
    It takes a matrix and returns the transposed matrix"""
    m = len(A)
    n = len(A[0])
    At= []
    for i in range(n):
        At.append([])
    for l in range(m):
        for c in range(n):
            At[c].append(A[l][c])
    return At

def find(x, tol=1e-6):
    """list --> list
        It creates a new list formed by all the non-zero values in x"""
    vec=[]
    for element in x:
        if (element > tol):
            vec.append(element)
        elif (element < -tol):
            vec.append(element)
    return vec

def read_file(path):
    """str --> list
    given the path of a file (formed by a column of numbers) it creats a list with the data of the file"""
    f = open(path, 'r')
    cont =f.read()
    cont = cont.split("\n")
    for i in range(len(cont)):
        cont[i] = float(cont[i])
    f.close()
    return cont


def op_list( List, num, op):
    """list, int, str --> list
    op: div = List/num; div2 = num/List; add = +;
        mult = *; sub = List-num; sub2 = num-List
    aplica la operación op elemento a elemento de la lista con el númeron num"""
    sol = []
    op = str.lower(op)
    if op == 'div':
        for element in List:
            sol.append(element/num)
        return sol
    elif op == 'div2':
        for element in List:
            sol.append(num/element)
        return sol
    elif op == 'add':
        for element in List:
            sol.append(num+element)
        return sol
    elif op == 'mult':
        for element in List:
            sol.append(num*element)
        return sol
    elif op == 'sub':
        for element in List:
            sol.append(element-num)
        return sol
    elif op == 'sub2':
        for element in List:
            sol.append(num-element)
        return sol
    
def op_list2(L1, L2, op):
    """list, list, str --> list
    op: div = List/num; div2 = num/List; add = +;
        mult = *; sub = List-num; sub2 = num-List
    aplica la operación op elemento a elemento de las listas
    Es necesario que ambas listas sean de las mismas dimensiones"""
    sol = []
    op = str.lower(op)
    if len(L1) != len(L2):
        return 'ERROR DE DIMENSIONES'
    else:      
        if op == 'div':
            for i in range(len(L1)):
                sol.append(L1[i]/L2[i])
            return sol
        elif op == 'div2':
            for i in range(len(L1)):
                sol.append(L2[i]/L1[i])
            return sol
        elif op == 'add':
            for i in range(len(L1)):
                sol.append(L2[i]+L1[i])
            return sol
        elif op == 'mult':
            for i in range(len(L1)):
                sol.append(L2[i]*L1[i])
            return sol
        elif op == 'sub':
            for i in range(len(L1)):
                sol.append(L1[i]-L2[i])
            return sol
        elif op == 'sub2':
            for i in range(len(L1)):
                sol.append(L2[i]-L1[i])
            return sol
