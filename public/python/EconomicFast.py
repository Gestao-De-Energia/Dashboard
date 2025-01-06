from math import floor
from auxiliar import *
import numpy as np

def economic_fast(gridc, Pl, Fg,cwh,p_npv,nwt, Edch):
    DR_2015=1.14 #-----------> exchange rate € to $
    WT_C=2391*DR_2015# 6985
    PV_C=1500*DR_2015
    BAT_C=581.66*DR_2015 # Battery  #LFP 392.2649  #RFV 581.66 #Li4Ti5O12  1143
    BAT_BOPC=440.7 #------------> Balance of Plant Cost in $/kW (HVAC, Control units etc.)
    BAT_BOP=100 #---------------> assumed to be 20 kW as trade off as no information is available
    BAT_OC=327 #----------------> installation cost etc.
    #BAT_BOPT=(BAT_BOPC+BAT_OC)*BAT_BOP #-->Additional BoP Costs of Battery
    BAT_BOPT=((BAT_BOPC+BAT_OC)*BAT_BOP)*0 #-->Additional BoP Costs of Battery -- RFV
    DSL_C= 0*DR_2015 #24.06*1.3#-----> maybe set to 0 --> 1000
    DSL_FC=0.65*DR_2015  #------------------->Grid connection --> in $$ 0.65   0.41
    INV_CKW=643*DR_2015#------------------>Dependent on power output in €/kW
    INV_MAX=100#-------------------->has to be same as upper boundary for PV in PSO
    INV_C=INV_CKW*INV_MAX
    PV_reg=1500
    Wind_reg=10
    #Wind_reg=1000# before had this price for adequate turbine costs
    #da turbina
    #economic index
    INTREST=6#------------------------> more realistic for Germany
    INFLATION=1.4#-------------------------> more realistic for Germany
    INFLATION_f=1.4#-----------------------> more realistic for Germany
    #life time
    WT_LF=20#24000
    PV_LF=20#------------------------------------>more realistic
    BAT_LF=15 #### Baterry  #LFP 15  #RFV 15  #Li4Ti5O12   17.5
    DSL_LF=50
    INV_LF=15#------------------------------------>more realistic
    PRJ_LF=24

    #cycle life time
    BAT_cycle = 10000   #LFP 5000  #RFV 10000  #Li4Ti5O12   8000
    #BAT_Tam = 340 #antes era 500 cwh
    BAT_DoD = 0.80 #0.80

    #running cost
    OM=20
    #rated power
    WT_P=5
    #PV_P=7.3
    PV_P=p_npv#for sensivity analysis for pv
    BAT_P=cwh#for sensivity analysis for autonomy days
    DSL_P=1#---------------->4 formerly
    
    ## economic analysis
    #gridc*************************A*************************************8
    # k=find(gridc)
    k = np.sum(gridc != 0)
    k = (gridc[gridc != 0]/1).sum()
    # k=sum(k / 1)#4 is because i set gridc on 4 when it will be turn on ----------->
# a partir de aquí k es un número
    fuel_consumption=Fg*k#feul consuption in one year for gridc
    k=DSL_LF/k#year life time
    if k<PRJ_LF:
        n=floor(PRJ_LF/k)#n is number of repalcement for gridc in project life time
        price_d=DSL_C*DSL_P*n 
    else:
        k_d=PRJ_LF
        price_d=DSL_C*DSL_P
     
     #battery************A**************A*********************A************************
    k=floor(PRJ_LF/BAT_LF)
    price_b=BAT_C*BAT_P*k+BAT_BOPT ### Added BoP Cost
    dc = (BAT_C*BAT_P)/(BAT_cycle * BAT_P *  BAT_DoD)
    # economic analysis
    i=(INTREST-INFLATION)/100#real interest rate=monetary interest rate-rate of inflation
    #initial_cost=WT_C*WT_P*nwt+PV_C*PV_P+price_b+price_d+INV_C+PV_reg+Wind_reg
    initial_cost=WT_C*WT_P*nwt+PV_C*PV_P+price_b+price_d+INV_C+PV_reg+Wind_reg  #tentativa de incluir os ciclos (dc)
    OM=initial_cost*(OM/100)
    initial_cost=initial_cost+OM#addind operation and maintanence cost

    Anual_cost=initial_cost*((i*(1+i)**PRJ_LF)/(((1+i)**PRJ_LF)-1))

    i=(INTREST-INFLATION_f)/100#feul real interest rate=monetary interest rate-rate of inflation
    Anual_cost_fuel=fuel_consumption*PRJ_LF*DSL_FC*((i*(1+i)**PRJ_LF)/(((1+i)**PRJ_LF)-1))###---------------->added real fuel cost for Germany
    sum(Edch)
    #disp('custos da bateria')
    Anual_cost_batery = dc*sum(Edch)*PRJ_LF*((i*(1+i)**PRJ_LF)/(((1+i)**PRJ_LF)-1)) #inclui cyclos + O&M costs of battery + Annuity
    Anual_cost=Anual_cost+Anual_cost_fuel + Anual_cost_batery
    Anual_load=sum(Pl)
    price_electricity = Anual_cost/Anual_load

    return price_electricity

