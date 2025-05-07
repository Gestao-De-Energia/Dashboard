from auxiliar import *
import numpy as np

def charge(Pw, Pp, Eb, Ebmax, uinv, ub, Pl, t, Edump, Ech):#Pb no se usa
    t = t-1
    Pch = np.zeros(len(Pw))
    
    Pch[t] = (Pw[t] + Pp[t])- (Pl[t]/uinv)
    Ech[t] = Pch[t]*ub;
    if Eb[t] <= Eb[t-1] + Ech[t]:
        Eb [t] = Eb[t-1] + Ech[t]

        if  Eb[t]>= Ebmax:
            Eb[t] = Ebmax
            Ech[t] = Eb[t] - Eb[t-1]
            Edump[t] = Pch[t] - (Ebmax -Eb[t])
            return [Edump, Eb, Ech]
        else:
            Edump[t] = 0
            return [Edump, Eb, Ech]
    else:
        Eb[t] = Ebmax
        Edump[t] = Pch[t]-(Ebmax - Eb[t])
        return [Edump, Eb, Ech]
