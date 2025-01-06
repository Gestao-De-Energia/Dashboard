from CHARGE import charge
from DISCHARGE import discharge
from EconomicFast import economic_fast
from RunGridConnected import RunGridConnected
from HourlyTo import *
from auxiliar import *

from statistics import mean
import numpy as np

def techno_ka(houses,p_npv,ad,nwt):
        
    ## load inputs
    #radiation(kW/m^2) KARLSRUHE
    #http://www.soda-pro.com/web-services/radiation/helioclim-3-archives-for-free

    # g = read_file('C:/UNI/PROYECTO/python/datos/solreal.txt')#vector fila con datos obtenidos de solreal
    g = np.genfromtxt('./solreal.txt') #vector fila con datos obtenidos de solreal

    #average annual average temperature (12 months)
    #tamb=[0.8 4.2 8.95 13.07 17 17.2 17.05 20.1 17.22 9.4 5 3.9]#ambient temperature-hararate KARLSRUHE (1 ano)
    #tamb=[4.7 5.9 9.1 12 16.4 22.4 25.7 25.3 20.7 14.9 8.6 5.4]#alcala de henares
    tamb = np.array([12, 13, 15, 16, 19, 22, 24, 24, 23, 20, 16, 13])#cadiz
    tamb = np.repeat(tamb, 720)

    
    #############################################################
    gref = 1 #1000kW/m^2
    tref = tamb.mean() #float #temperature at reference condition
    kt = -3.7e-3 # temperature coefficient of the maximum power(1/c0)
    tc = tamb + 0.0256 # se suma en cada elemento el valor entre ()
    tc = g * tc #en MATLAB -> tc = g'.*tc';
    upv = 0.986 #efficiency of pv with tilted angle>>98.6#
    p_pvout_hourly = upv * (p_npv * (g / gref)) * (1 + kt * (tc - tref)) #output power(kw)_hourly
    
    del tc
    del g

    ## battery 
    ########inputs##############inputs####################inputs##

    #load demand >> hourly typical rural household load profile Kw
    #load1 = [42.3126517000000 43.7486178000000 40.7923115000000 46.4707433000000 43.6216673000000 49.5948666000000 72.4969969000000 95.0471497000000 102.492353000000 108.380370000000 105.387571000000 100.995852000000 98.6396144000000 93.7103684000000 87.9627851000000 90.7283227000000 89.8206648000000 88.8345821000000 95.0138573000000 93.8417709000000 83.5670178000000 79.8144560000000 61.7658149000000 48.6676827000000]
    #load1 = [0.21	0.21	0.21	0.21	0.21	0.21	0.57	0.33	0.35	0.89	0.35	0.35	0.35	0.31	0.25	0.25	0.25	0.29	0.29	0.35	0.45	0.36	0.31	0.31]
    #load2=houses.*load1#total load in a day for the whole village

    #Realdata from Silvia
    # loadind = read_file('C:/UNI/PROYECTO/python/datos/loadind.txt')
    loadind = np.genfromtxt('./loadind.txt')
    # loadres = read_file('C:/UNI/PROYECTO/python/datos/loadres.txt')
    loadres = np.genfromtxt('./loadres.txt')

    factor = 5.1 #5.3(loadres)    #3.5(loadin)

    load  = loadres * factor  

    uinv = 0.75
    ub = 0.75    #LFP 0.95   #RFV 0.75  #Li4Ti5O12   0.90
    dod = 0.8 #0.8 #depth of discharge 0.5 0.7 in the article 80# <=======
    bcap = 200 #battery capacity 40 kWh
# ############################################################

    cwh = bcap / (uinv * ub) * (1 + 1 - dod) #storage capacity for battery,bmax,kW

## wind turbine
########inputs##############inputs####################inputs##
    shape_w = 1###----------> out of wind xls, from http://www.renewable-energy-concepts.com/fileadmin/user_upload/bilder/windkarte-deutschland-10m.pdf
    # v1 = read_file('C:/UNI/PROYECTO/python/datos/wind_data.txt')
    v1 = np.genfromtxt('./wind_data.txt')
    v1 = v1 * shape_w
    h2 = 18  ###-------------------------------------------------------------->changed
    h0 = 27.3 ###------------------------------------------------------------->changed
    rw = 12 #blades diameter(m)6.4, 7.4
    pi = np.pi # 3.14159
    aw = pi * rw**2 #Swept Area>>pi x Radius² = Area Swept by the Blades
    uw = 0.95 #
    vco = 20 #cut out -------------------> changed from 40 to 25 m/s
    vci = 3 #cut in 2.5
    vr = 12 #rated speed(m/s)
    pr = 30 #rated power(kW) 5
    alfa = 0.1 #for heavily forested landscape
    pmax = 30 #maximum output power(kW)
    pfurl = 30 #output power at cut-out speed9kW)
# ############################################################
    v2 = v1 * ((h2/h0)**alfa)

## grid conected
    Png = 0 #kW output power of diesel generator --------------------------->changed 4 
    Bg = 1 #1/kW --------------------------->changed 0.246
    Ag = 0 #1/kW--------------------------->changed 0.08415
    Pg = 1 #nominal power kW--------------------------->changed 4
# #Price based on in old aproach using RunDieselGeneraor.m
    Fg = Bg * Pg + Ag * Png
## MAIN PROGRAM
    contribution = np.zeros((5, 8640)) #pv,wind, battery, diesel contribution in each hour

    Ebmax = bcap * (1 + 1 - dod) #40kWh#battery capacity 40 kWh-----------> normally never fully charged
    Ebmin = bcap * (1 - dod) #40kWh
    SOCb = 0.2 #state of charge of the battery>>20#
    Eb = np.zeros(8640)
    time1 = np.zeros(8640)
    gridc = np.zeros(8640)
    Edump = np.zeros(8640)
    Edch = np.zeros(8640)
    Ech = np.zeros(8640)
    Eb[0] = SOCb * Ebmax #state of charge for starting time
#^^^^^^^^^^^^^^START^^^^^^^^^^^^^^^^^^^^^^^^
    #hourly load data for one year
    Pl = load[1:]
#^^^^^^^^^^Out put power calculation^^^^^^^^
#solar power calculation
    Pp = p_pvout_hourly.copy() #output power(kw)_hourly
    Pp[Pp > p_npv] = p_npv

    Pw = np.zeros(8640)
    Pp_mean=mean(Pp)
# wind power calculation
    pwtg = np.zeros(8640)
    pwtg[(vci <= v2) & (v2 <= vr)] = \
        (pr / (vr**3 - vci**3)) * (v2[(vci <= v2) & (v2 <= vr)])**3 - \
            (vci**3 / (vr**3 - vci**3)) * pr
    pwtg[~((vci <= v2) & (v2 <= vr)) & (vr <= v2) & (v2<=vco)] = pr
    Pw[:-1] = pwtg[:-1] * uw * nwt

    # for t in range(8639):###### COMPROBAR SI ESTÁ BIEN EL ÍNDICE Y ESO
    #     if v2[t]<vci: #v2>>hourly_wind_speed
    #         pwtg.append (0)
    #     elif (vci<=v2[t]) and (v2[t]<=vr):
    #         pwtg.append ((pr/(vr**3-vci**3))*(v2[t])**3-(vci**3/(vr**3-vci**3))*(pr))
    #     elif (vr<=v2[t]) and (v2[t]<=vco):
    #         pwtg.append(pr)
    #     else :
    #         pwtg.append(0)
    #     Pw[t]=pwtg[t]*uw*nwt

    Pw_mean=mean(Pw)

    for t in range(1,8639):
#^^^^^^^^^^^^^^READ INPUTS^^^^^^^^^^^^^^^^^^

#^^^^^^^^^^^^^^COMPARISON^^^^^^^^^^^^^^^^^^^
        if (Pw[t]+Pp[t]) >= (Pl[t]/uinv):
        #^^^^^^RUN LOAD WITH WIND TURBINE AND PV^^^^^^
         
            if (Pw[t]+Pp[t]) > Pl[t]:
            #^^^^^^^^^^^^^^CHARGE^^^^^^^^^^^^^^^^^^^^^^^^^^
                [Edump,Eb,Ech] = charge(Pw,Pp,Eb,Ebmax,uinv,ub,Pl,t,Edump,Ech)
                time1[t]=1
                contribution[0, t] = Pp[t]
                contribution[1, t] = Pw[t]
                contribution[2, t] = Edch[t]
                contribution[3, t] = gridc[t]
                contribution[4, t] = Edump[t] #contribution(6,t)=Pl(t)        
            else:
                Eb[t]=Eb(t-1)
#            return #CREO Q HABRÁ Q BORRARLO
        
        else:
       #^^^^^^^^^^^^^^DISCHARGE^^^^^^^^^^^^^^^^^^^
            [Eb,Edump,Edch,gridc,time1,t] = discharge(Pw,Pp,Eb,Ebmax,uinv,Pl,t,Pg,Ebmin,Edump,Edch,Ech,gridc,time1)
            contribution[0, t] = Pp[t]
            contribution[1, t] = Pw[t]
            contribution[2, t] = Edch[t]
            contribution[3, t] = gridc[t]
            contribution[4, t] = Edump[t] #contribution(6,t)=Pl(t)

            


## plotting
    b = np.sum(contribution, axis=1)
    renewable_factor = ((b[0]+b[1]-(b[2]/(uinv*ub)-b[2])-b[4]+b[2])/
                        (b[0]+b[1]-(b[2]/(uinv*ub)-b[2])-b[4]+b[2]+b[3]))
    
#AÚN NO SÉ HACERLO    #h=pie(b)
    #colormap jet
#AÚN NO SÉ HACERLO    legend('PV','WIND','BATTERY','PUBLIC GRID', 'SURPLUS')

    #reliability
    #lose of load probability=sum(load-pv-wind+battery)/sum(load)
    k=0
    aa=[]
    aa = Pl[:-2] - Pp[:-1] - Pw[:-1] + Eb[:-1]
    k = np.sum(Pl[:-2] > (Pp[:-1] + Pw[:-1] + (Eb[:-1] - Ebmin) + gridc[:-1]))
    # for t in range(8639):
    #     aa.append (Pl[t]-Pp[t]-Pw[t]+Eb[t])
    #     if Pl[t]>(Pp[t]+Pw[t]+(Eb[t]-Ebmin)+gridc[t]):
    #         k=k+1

    LPSP=k/8640
    reliability=sum(aa)/sum(Pl)

    price_electricity = economic_fast(gridc,Pl,Fg,cwh,p_npv,nwt, Edch)
    ali=[Pp[:168], Pw[:168], Eb[:168], gridc[:168], Pl[:168], Edump[:168]]
    ali2=[Pp[:8640], Pw[:8640], Eb[:8640], Edch[:8640], Ech[:8640], gridc[:8640], Pl[:8640], Edump[:8640]]
    ali = np.array(ali).T
    ali2 = np.array(ali2).T
    
    return [LPSP,price_electricity,renewable_factor,b,ali, ali2]
