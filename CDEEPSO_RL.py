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

# LB=[10, 1, 1, 1] # Lower bound of problem
# UB=[150, 3, 20, 200] # Upper bound of problem
LB=[150, 3, 16, 6] # Lower bound of problem
UB=[150, 3, 16, 6] # Upper bound of problem


p_npv, ad, houses, nwt = np.random.uniform(LB, UB)

[LPSP,price_electricity,renewable_factor,b,ali, ali2] = techno_ka(houses,p_npv,ad,nwt)
print(str.format("LOLP {0}, $/KWh = {1}, %RES = {2}", LPSP, price_electricity, renewable_factor))

