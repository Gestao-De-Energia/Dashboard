from microgrid import Microgrid
from photovoltaic_panel import PhotovoltaicPanel
from wind_turbine import WindTurbine
from battery import Battery
from public_grid import PublicGrid
from inverter import Inverter
from converter import Converter

import numpy as np
from math import sqrt, inf
from random import random


# Economic input
exchange_rate = 1.14

# Photovoltaic panel input
pv_cost_per_kwp = 210
#pv_rated_power = 50
pv_lifetime = 25

# Wind turbine input
wt_cost_per_kw = 900
#wt_rated_power = 30
wt_rated_wind_speed = 15
cut_in = 2.5
cut_out = 40
wt_lifetime = 20
wt_height = 30

# Battery input
bat_dod = 0.8
bat_cap = 200
select_bat = 0 # LAG AGM(0) Li4Ti5O12(1) LiCoO2(2) LiFePO4(3) LiMnO2(4) LiNiCoMnO2(5) LiNiCoAlO2(6) LiPoly(7) NaNiCl(8) NaS(9) NiCd(10) NiMH(11) RFV(12) Zn/Br Redox(13)
bat_efficiency_list = [0.765,0.90,0.92,0.96,0.94,0.938,0.9155,0.95,0.86,0.855,0.70,0.80,0.75,0.70]
# Each battery capacity cost in [€$]
bat_cap_cost_list = [7.31393,28.575,28.575,9.8066225,20.67004375,7.540625,10.1099133,6.746875,38.1,6.99371645,9.55675,31.40075,45.10395475,14.5415,12.4139325]
# Each battery lifetime in [years]
bat_lf_list = [18,17.5,7,15,10,10,10,20,14,13.5,20,3,15,6.5]
# Each battery cycle number
bat_cycle_list = [1400,8000,600,5000,1500,4000,3000,1000,3000,3250,1250,1000,10000,2000]

# Public grid input
grid_cost_per_kwh = 0.2
grid_tariff_growth = 0.05
grid_credit_rate = 0.1

# Inverter input
inverter_cost_per_kw = 200
inverter_cost_scale = 0.95
inverter_efficiency = 0.95
inverter_lifetime = 10

# Converter input
converter_cost_per_kw = 150
converter_cost_scale = 0.95
converter_efficiency = 0.95
converter_lifetime = 15

# Microgrid input
load_ind = np.genfromtxt('./python/loadind.txt')
temperature = np.repeat(np.array([12, 13, 15, 16, 19, 22, 24, 24, 23, 20, 16, 13]), 720)
solar_data = np.genfromtxt('./python/solreal.txt')
wind_data = np.genfromtxt('./python/wind_data.txt')
wind_height = 10
microgrid_lifetime = 24
microgrid_maintenance_cost_rate = 0.02
microgrid_discount_rate = 0.1

#######################
class best:
    def __init__(self, position, cost, rf, meef):
        self.position = position
        self.cost = cost
        self.rf = rf
        self.meef = meef

class empty_particle:
    def __init__(self, position, velocity, cost, rf, meef, best):
        self.position = position
        self.velocity = velocity
        self.cost = cost
        self.rf = rf
        self.meef = meef
        self.best = best

class globalbest:
    def __init__(self, cost, rf, meef, position):
        self.cost = cost
        self.rf = rf
        self.meef = meef
        self.position = position



photovoltaic_panel = PhotovoltaicPanel(cost_per_kwp=pv_cost_per_kwp,
                                       #rated_power=pv_rated_power,
                                       lifetime=pv_lifetime)
wind_turbine = WindTurbine(cost_per_kw=wt_cost_per_kw,
                           #rated_power=wt_rated_power,
                           rated_wind_speed=wt_rated_wind_speed,
                           cut_in=cut_in,
                           cut_out=cut_out,
                           height=wt_height,
                           lifetime=wt_lifetime)
battery = Battery(capacity=bat_cap,
                  cost_per_kwh=bat_cap_cost_list[select_bat] * exchange_rate,
                  efficiency=bat_efficiency_list[select_bat],
                  lifetime=bat_lf_list[select_bat],
                  number_of_cycles=bat_cycle_list[select_bat],
                  depth_of_discharge=bat_dod)
public_grid = PublicGrid(cost_per_kwh=grid_cost_per_kwh,
                         tariff_growth=grid_tariff_growth,
                         credit_rate=grid_credit_rate)
inverter = Inverter(cost_per_kw=inverter_cost_per_kw,
                    cost_scale=inverter_cost_scale,
                    efficiency=inverter_efficiency,
                    lifetime=inverter_lifetime)
converter = Converter(cost_per_kw=converter_cost_per_kw,
                      cost_scale=converter_cost_scale,
                      efficiency=converter_efficiency,
                      lifetime=converter_lifetime)




lcoe = 0.0 # inicio
renewable_factor = 0.0
meef = 0.0

microgrid = Microgrid(load=load_ind[:8640],
                      temperature=temperature[:8640],
                      solar_irradiance=solar_data[:8640],
                      wind_velocity=wind_data[:8640],
                      wind_height=wind_height,
                      lifetime=microgrid_lifetime,
                      maintenance_cost_rate=microgrid_maintenance_cost_rate,
                      discount_rate=microgrid_discount_rate,
                      photovoltaic_panel=photovoltaic_panel,
                      wind_turbine=wind_turbine,
                      battery=battery,
                      public_grid=public_grid,
                      inverter=inverter,
                      converter=converter,
                      lcoe=lcoe,
                      renewable_factor=renewable_factor,
                      meef=meef)


# rated power (geraçao maxima em kW) tem que ser escolhido pelo user, serao vars. de otimizacao
# nao tem dias de autonomia nem numero de casas
# vai ser possivel mudar a bateria no meio

max_it = 30
NPOP = 10 # população
LB = [10, 10] # lower boundary da geraçao maxima dos paineis e turbina respectivamente
UB = [150, 150] # upper boundary

phi1=2.05
phi2=2.05
phi=phi1+phi2
chi=2/(phi-2+sqrt(phi**2-4*phi))

w1=chi                                # Inertia weight
c1=chi*phi1                           # Personal learning coefficient
c2=chi*phi2                           # Global learning coefficient

particle=[]
for i in range(NPOP):
    particle.append(empty_particle([],[],[],[],[],best([],[],[],[])))
    
globalbest.cost=inf
globalbest.rf=inf
globalbest.meef=inf
globalbest.position=[]

# inicialização
for i in range(NPOP):
    particle[i].position.extend(np.random.uniform(LB, UB).tolist())
    
    for _ in range(2):
        particle[i].velocity.append(random())
            
    max_pan=particle[i].position[0]
    max_wind=particle[i].position[1]

    [lcoe, renewable_factor, meef] = microgrid.run(max_pan, max_wind)

    particle[i].cost=lcoe
    particle[i].rf=renewable_factor
    particle[i].meef=meef

    particle[i].best.position=particle[i].position
    particle[i].best.cost=particle[i].cost
    particle[i].best.rf=particle[i].rf
    particle[i].best.meef=particle[i].meef

    if particle[i].best.cost<globalbest.cost:
        globalbest=particle[i].best

Fminn=np.zeros(max_it) #EN MATLAB ES UNA COLUMNA
Rf=np.zeros(max_it)
Meef=np.zeros(max_it)
## algorithm main loop
for u in range(max_it):
    for i in range(NPOP):
        for y in range(2):
            
            mut = random()
            particle[i].velocity[y] =( (w1*mut)*particle[i].velocity[y]+(c1*mut)*random()
                *(particle[i].best.position[y]-particle[i].position[y])
                +(c2*mut)*random()*(globalbest.position[y]-particle[i].position[y]) )
            
            particle[i].position[y]=particle[i].position[y]+particle[i].velocity[y]
            # particle[i].position[y]=min(max(particle[i].position[y], LB[y]), UB[y])
            particle[i].position[y]=np.clip(particle[i].position[y], LB[y], UB[y])
                        

        max_pan = particle[i].position[0]
        max_wind = particle[i].position[1]
        
        [lcoe, renewable_factor, meef] = microgrid.run(max_pan, max_wind)

        particle[i].cost = lcoe
        particle[i].rf=renewable_factor
        particle[i].meef=meef
        if particle[i].cost < particle[i].best.cost:
            particle[i].best.cost = particle[i].cost
            particle[i].best.rf = particle[i].rf
            particle[i].best.meef = particle[i].meef
            particle[i].best.position = list(particle[i].position)
            if particle[i].best.cost < globalbest.cost: #& rnwfct<rnwfct_best
                globalbest.cost = particle[i].best.cost
                globalbest.rf = particle[i].best.rf
                globalbest.meef = particle[i].best.meef
                globalbest.position = list(particle[i].best.position)

    
    Fminn[u] = globalbest.cost
    Rf[u] = globalbest.rf
    Meef[u] = globalbest.meef
    Xmin = globalbest.position
    max_pan = round(globalbest.position[0])
    max_wind = round(globalbest.position[1])
    print(str.format("Iteration {0}, Best cost = {1}, RF = {2}, MEEF = {3}",u,Fminn[u], Rf[u], Meef[u]))
    print(str.format("Best solution max_pan = {0}, max_wind = {1}", max_pan, max_wind))


# Run microgrid
#[lcoe, renewable_factor, meef] = microgrid.run()

#end for

#microgrid.logging('./python/result/microgrid_resultsPY')