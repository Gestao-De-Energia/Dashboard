from techno_ka import *
from structure import *
from random import random, uniform
from math import sqrt, inf
import numpy as np
from time import time

init_t = time()

## Problem definition
C=0.65#price of electricity
W=0.14#loss of load probability#
K=0.9#renewable energy factor#
nvars=1#only one system

LB=[10, 1, 1, 1] # Lower bound of problem
UB=[150, 3, 30, 8] # Upper bound of problem
# LB=[130, 2, 15, 150] # Lower bound of problem
# UB=[130, 2, 15, 150] # Upper bound of problem

max_it=10#100# Maximum number of iterations
NPOP=10#20# Number of population
# Determine the maximum step for velocity
for d in range(4):
    if (LB[d]>-1e20) and (UB[d]<1e20):
        velmax = (UB[d]-LB[d])/NPOP
    else:
        velmax = inf

## algorithm initial parameters
phi1=2.05
phi2=2.05
phi=phi1+phi2
chi=2/(phi-2+sqrt(phi**2-4*phi))

w1=chi                                # Inertia weight
c1=chi*phi1                           # Personal learning coefficient
c2=chi*phi2                           # Global learning coefficient

## Initialization

particle=[]
for i in range(NPOP):
    particle.append(empty_particle([],[],[],best([],[])))
    
globalbest.cost=inf
globalbest.position=[]

for i in range(NPOP):
    cc=1#a value for cost
    ww=0.3# a value for lose of load probability#
    kkk=2#renewable energy factor# 2
    ff=0

    while ww>=W or kkk>=K:# LOLP/REfactor
        particle[i].position.extend(np.random.uniform(LB, UB).tolist())
        # particle[i].position.append (uniform(10,150))#pv kW # Rated PV power
        # particle[i].position.append (uniform(1,3))#autonomy days #
        # particle[i].position.append (uniform(1,30))#number of houses
        # particle[i].position.append (uniform(1,8))#number of wind turbine
        
        for g in range(4):
            particle[i].velocity.append (random())
                
        #----convert------------
        p_npv=particle[i].position[0]
        ad=particle[i].position[1]
        houses=round(particle[i].position[2])
        nwt=round(particle[i].position[3])
        #-----------------------
        [LPSP,price_electricity,renewable_factor,b,ali, ali2] = techno_ka(houses,p_npv,ad,nwt)
        ff = ff+1
        ww = LPSP
        kkk= renewable_factor

    particle[i].cost=price_electricity
    particle[i].best.position=particle[i].position
    particle[i].best.cost=particle[i].cost
    if particle[i].best.cost<globalbest.cost:
        globalbest=particle[i].best
        
Fminn=np.zeros(max_it) #EN MATLAB ES UNA COLUMNA
## algorithm main loop
for u in range(max_it):
    vv=0
    for i in range(NPOP):
        cc=1#a value for cost
        LPSP=0.3# a value for lose of load probability#
        renewable_factor=2#
        bb=0
        while (LPSP)>=W or (renewable_factor)>=K:
            for y in range(4):
                
                mut = random()
                particle[i].velocity[y] =( (w1*mut)*particle[i].velocity[y]+(c1*mut)*random()
                    *(particle[i].best.position[y]-particle[i].position[y])
                    +(c2*mut)*random()*(globalbest.position[y]-particle[i].position[y]) )
                
                particle[i].position[y]=particle[i].position[y]+particle[i].velocity[y]
                # particle[i].position[y]=min(max(particle[i].position[y], LB[y]), UB[y])
                particle[i].position[y]=np.clip(particle[i].position[y], LB[y], UB[y])
                          

            oo=0
            p_npv = round(particle[i].position[0])
            ad = round(particle[i].position[1])
            houses = round(particle[i].position[2])
            nwt = round(particle[i].position[3])
           
            [LPSP,price_electricity,renewable_factor,b,ali, ali2] = techno_ka(houses,p_npv,ad,nwt)
            bb=bb+1

        #-----------------------
        [LPSP,price_electricity,renewable_factor,b,ali, ali2] = techno_ka(houses,p_npv,ad,nwt)
        particle[i].cost = price_electricity
        rnwfct = renewable_factor 
        vv = vv+1
        if particle[i].cost < particle[i].best.cost:
            particle[i].best.cost = particle[i].cost
            particle[i].best.position = particle[i].position
            if particle[i].best.cost < globalbest.cost: #& rnwfct<rnwfct_best
                globalbest = particle[i].best
                rnwfct_best = rnwfct #

    
    Fminn[u] = globalbest.cost
    Xmin = globalbest.position
    p_npv = round(globalbest.position[0])
    ad = round(globalbest.position[1])
    houses = round(globalbest.position[2])
    nwt = round(globalbest.position[3])
    print(str.format("Iteration {0}, Best cost = {1}",u,Fminn[u]))
    print(str.format("Best solution p_npv = {0}, ad = {1}, houses = {2}, nwt = {3}", p_npv, ad, houses, nwt))

[LPSP,price_electricity,renewable_factor,b,ali, ali2] = techno_ka(houses,p_npv,ad,nwt)
print(str.format("LOLP {0}, $/KWh = {1}, %RES = {2}", LPSP, price_electricity, renewable_factor))

print("Total time {}".format(time() - init_t))
