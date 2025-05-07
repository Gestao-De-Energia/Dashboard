from auxiliar import zeros
#copiar la función de creador de vector_zeros
def HourlytoDaily(y):
    """it takes y as a matrix with 8640 elements and
    calculate the average daily in 24 hours"""
#habría que comprobar la forma de la matriz y cambiar los bucles si fuese necesario
    a = zeros(24)
#8640/24=360    en MATLAB for i=1:24:8640
    for i in range(0, 360):
        for k in range(0,24):
            a[k] = a[k] + y[i][k] # suponiendo que y tiene 360 filas y 24 columnas
    for i in range(1,24):
        x[i] = a[i]/360
    return x

def Hourlytomonthly (y):
    """it takes y as a matrix with 8640 elements and
    calculate the average monthly in 30 days of 24 hours"""
    a = zeros(12) #12 months --> 30*24=720 hours in a month
#8640/720=12    en MATLAB for i=1:720:8640
    for i in range(0, 12):
        for k in range(0,720):
            a[k] = a[k] + y[i][k] # suponiendo que y tiene 12 filas y 720 columnas
    for i in range(1,24):
        x[i] = a[i]/720
    return x
