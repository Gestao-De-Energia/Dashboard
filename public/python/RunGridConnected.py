
def RunGridConnected(Pw,Pp,Eb,Ebmax,uinv,Pl,t,Pg,Edump,gridc,Ebmin):
    Eb[t]=Eb[t-1]+(Pw[t]+Pp[t]-((Pl[t]/uinv)*1))
    if Eb[t]>Ebmax:
        Edump[t]=Eb[t]-Ebmax
        Eb[t]=Ebmax
        
    if Eb[t]<Ebmin:
        Edump[t] = 0
        Eb[t] = Ebmin
        
    gridc[t]=(Pl[t]/uinv)-(Eb[t]-Eb[t-1]+Pw[t]+Pp[t])
             
    if gridc[t]>(Pl[t]/uinv):
        gridc[t]=0 #eh como se nao pudesse ligar a termoeletrica
        
    if Eb[t]<Ebmin:
        Eb[t]=0
        
    if gridc[t]<0:
        gridc[t]=(Pl[t]/uinv)-(Pw[t]+Pp[t])

    return [Eb,Edump,gridc,t]
