from RunGridConnected import RunGridConnected
from auxiliar import *
import numpy as np

def discharge(Pw,Pp,Eb,Ebmax,uinv,Pl,t,Pg,Ebmin,Edump,Edch,Ech,gridc,time1):
    t= t-1 #de momento porque en MATLAB se empieza en 1 y aquí en 0
    Pdch = np.zeros(len(Pw))

    Pdch[t] = (Pl[t]/uinv)-(Pw[t] + Pp[t]) 
    Edch[t] = Pdch[t]*1;    #one hour iteration time


    if (Eb[t-1]-Ebmin) > Edch[t]:
        Eb [t] = Eb[t-1] - Edch[t]
        time1[t] = 2
        return [Eb,Edump,Edch,gridc,time1,t]

    elif (Eb[t-1]-Ebmin) <= Edch[t]:
        Eb[t] = Ebmin
        Edch[t] = Eb[t-1] - Eb[t]

        #run load with gridc generator and renewable sources#
        [Eb,Edump,gridc,t] = RunGridConnected(Pw,Pp,Eb,Ebmax,uinv,Pl,t,Pg,Edump,gridc,Ebmin);
        # se actualizan Eb, Edump, gridc, t
        
        return [Eb,Edump,Edch,gridc,time1,t]
