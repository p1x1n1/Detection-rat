
import cv2
import numpy as np

def viewImage(image, name_of_window):
    cv2.namedWindow(name_of_window, cv2.WINDOW_NORMAL)
    cv2.imshow(name_of_window, image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def findPeresech(lin, obl):  # определяет пересекает ли область линии
    k = -1#возвращаемое значение в случае если объект не пересекает никакую из линий
    for i in range(0, len(lin)):
        if ((obl[0][0] >= lin[i][0] or obl[3][0] >= lin[i][0]) and (obl[1][0]) <= lin[i][
            2]) or ((obl[0][0] >= lin[i][2] or obl[3][0] >= lin[i][2]) and (obl[1][0]) <= lin[i][
            0]):  # по крайним границам линии по х
            if (obl[0][1] <= lin[i][3] and (obl[2][1]) >= lin[i][1]) or (
                    obl[0][1] >= lin[i][3] and (obl[2][1]) <= lin[i][
                1]):  # по крайним границам линии по у
                k = i#фиксируем линию
                break
    return k

# Для обработки видео
video = cv2.VideoCapture("rat.mp4")  # загружаем файл
if not video.isOpened():# и проверяем
    print("error")
while video.isOpened():
    _, image = video.read()
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    rgb_image1 = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    rgb_image2 = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    viewImage(rgb_image, "rgb ")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)#переход к оттенкам серого
    viewImage(gray, "gray ")
    blur = cv2.GaussianBlur(gray, (7, 7), 2)#примененение сгалживания по Гауссу
    canny_img = cv2.Canny(blur, 30, 70)  #примененение детектора границ Canny
    canny_img = cv2.GaussianBlur(canny_img, (3, 3), 0)#примененение сгалживания по Гауссу,для уменьшения количества шумов
    viewImage(canny_img, "Gaussian ans Canny ")
    _, tresh = cv2.threshold(canny_img, 80, 200, cv2.THRESH_BINARY)#применение порогового значения
    viewImage(tresh, "threshold ")
    # houghlinesP
    linesP = cv2.HoughLinesP(tresh, 1, np.pi / 180, 50, np.array([()]), 80, 10)# список всех найденных линий
    j = 0#позиция линии
    lenese = []#список линий в интересующей области
    #print(rgb_image.shape)
    h, w, c = rgb_image.shape  # высота и ширина изображения и кол-во цветов
    if linesP is not None:
        for i in range(0, len(linesP)):#прохождение по списку линий Хафа
            l = linesP[i][0]
            if (l[1] > h/2.7) and (l[1] < (h-80)):#определение лежит ли линяя в интересующей области
                lenese.append([0] * 5)
                #координаты точек прямой
                lenese[j][0] = l[0]
                lenese[j][1] = l[1]
                lenese[j][2] = l[2]
                lenese[j][3] = l[3]
                #угловой коэффициент прямой
                lenese[j][4] = round((l[3] - l[1]) / (l[2] - l[0]), 3)
                j += 1
    del linesP#очищаем список
    lenese = sorted(lenese, key=lambda x: x[4])#сортируем по угловым коэффициентам
    print("Линии полученные преобразованием Хафа")
    for l in lenese:#отображение линий в интересующей области
        j += 1
        cv2.putText(rgb_image2, str(j), (l[0], l[1]), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.line(rgb_image2, (l[0], l[1]), (l[2], l[3]), (142, 107, 255), 2, cv2.LINE_AA)
        print(l, j)
    viewImage(rgb_image2, "Line")
    l = lenese[0]#запоминаем первую линию
    linline = []#список усредннненых линий
    linline.append([0] * 6)
    #координаты
    linline[0][0] = l[0]
    linline[0][1] = l[1]
    linline[0][2] = l[2]
    linline[0][3] = l[3]
    #linline[0][4]-кол-во пересечеий данной линии изначально равно 0
    linline[0][5] = l[4]#угловой коэффициент
    k=0
    for i in range(1, len(lenese)):#сортировка линий по угловому коэффициенту
        t = 0#индикатор было ли наложение
        l = lenese[i]#считываем текущую линию
        for j in range(0, len(linline)):#проход по усредненным линиям
            ll = linline[j]
            if abs(ll[5] - l[4]) <= 0.06 and (l[0] != ll[0] or l[2] != ll[2]) and (
                    abs(l[0] - ll[0]) < 100 or abs(l[2] - ll[2]) < 100) and t == 0:#усредненние линий накладывающихся друг на друга
                if (l[0] <= ll[0]) and (l[2] >= ll[2]):#остается наиболее "длинная"(протяженная) вдоль оси ох
                    ll[0] = l[0]
                    ll[1] = l[1]
                    ll[2] = l[2]
                    ll[3] = l[3]
                    ll[5] = l[4]
                t = 1#наложение было, добавлять в список не нужно
        if t == 0:#если наложения не было, то добавляем в список усреднненых линий
            k+=1
            linline.append([0] * 6)
            linline[k][0] = l[0]
            linline[k][1] = l[1]
            linline[k][2] = l[2]
            linline[k][3] = l[3]
            linline[k][5] = l[4]
    del lenese  # очищаем список
    i = 1
    k = 0
    while i < len(linline):#отбрасывание линий находящися за границами установки
        l = linline[i]
        if l[5] > 2:
            linline.remove(l)
        i += 1
    j = 0
    # вывод полученных после сортировки линий
    print("Усреднненые линии")
    for l in linline:
        j += 1
        print(l, j)
    for i in range(0, len(linline)):#отображение линий на изображении
        l = linline[i]
        cv2.line(rgb_image, (l[0], l[1]), (l[2], l[3]), (142, 107, 255), 3, cv2.LINE_AA)#отображение линии
        cv2.putText(rgb_image, str(i + 1), (l[0], l[1]), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)#номер линии
    viewImage(rgb_image, "Line")
    cv2.waitKey(1)
    cv2.destroyAllWindows()
    break

#центр изображения
center_x=linline[0][0]
center_y=linline[5][1]
#радиусы эллипсов
#пересчет в радиусы от 1,2,8 до центра
rad2=int(((linline[0][0]-center_x)**2+(linline[0][1]-center_y)**2)**0.5)+30
rad1=int(((linline[1][0]-center_x)**2+(linline[1][1]-center_y)**2)**0.5)+30
rad3=int(((linline[5][0]-center_x)**2+(linline[5][1]-center_y)**2)**0.5)+30
smesh_y=abs(h//2-linline[5][1])
print("rad",rad1,rad2,rad3,"smesh",smesh_y)
print('center', center_x,center_y)
angl=0#угол
time=0#четность линии
count=1#коэффициент смешения по y
linline.clear()#очищаем полученные ориентировочные линии
while angl<360:
    cos_smesh = np.cos(angl * np.pi / 180)
    sin_smesh = np.sin(angl * np.pi / 180)
    if angl<90:#1 четверть
        y0 = int(rad3 * (cos_smesh)) + smesh_y*count
        x1 = int(rad3 * (sin_smesh)) + center_x
        if time%2==0:
            x0 = int(rad2 * (sin_smesh)) + center_x
            y1 = int(rad2 * (cos_smesh)) + smesh_y*count
        else:
            y0+=30
            x0 = int(rad1 * (sin_smesh)) + center_x
            y1 = int(rad1 * (cos_smesh)) + smesh_y*count+60
        count+=1
        #print(count)
    elif angl < 180:#2 четверть
        y1 = int(rad3 * abs(cos_smesh)) + center_y
        x1 = int(rad3 * abs(sin_smesh)) + center_x
        if time%2!=0:
            x0 = int(rad1 * abs(sin_smesh)) + center_x
            y0 = int(rad1 * abs(cos_smesh)) + center_y
        else:
            x0 = int(rad2 * abs(sin_smesh)) + center_x
            y0 = int(rad2 * abs(cos_smesh)) + center_y
    elif angl<240:#3 четверть
        x1 = int(rad3 * (sin_smesh)) + center_x
        y1 = int(rad3 * (cos_smesh)) - center_y - 20
        if time%2!=0:
            y0 = int(rad1 * (cos_smesh)) - center_y
            x0 = int(rad1 * (sin_smesh)) + center_x
        else:
            y0 = int(rad2 * (cos_smesh)) - center_y
            x0 = int(rad2 * (sin_smesh)) + center_x
    elif angl < 300:
        x1 = int(rad3 * (sin_smesh)) + center_x
        y1 = int(rad3 * abs(cos_smesh)) + center_y
        if time % 2 != 0:
            x0 = int(rad1 * (sin_smesh)) + center_x
            y0 = int(rad1 * abs(cos_smesh)) + center_y
        else:
            x0 = int(rad2 * (sin_smesh)) + center_x
            y0 = int(rad2 * abs(cos_smesh)) + center_y
    elif angl>=300:
        count -=1
        y0 = int(rad3 * (cos_smesh)) + smesh_y*count
        x1 = int(rad3 * (sin_smesh)) + center_x+30
        if time%2==0:
            x0 = int(rad2 * (sin_smesh)) + center_x+30
            y1 = int(rad2 * (cos_smesh)) + smesh_y*count
        else:
            y0+=30
            x0 = int(rad1 * (sin_smesh)) + center_x
            y1 = int(rad1 * (cos_smesh)) + smesh_y*count+60
    x0 = abs(x0)
    y0 = abs(y0)
    x1 = abs(x1)
    y1 = abs(y1)
    l = [x0, y0, x1, y1, 0, round(sin_smesh / cos_smesh, 3)] #координаты, счётчик количетсва пересечений ,угловый коээфициент
    linline.append(l)#добаления линии в список
    time+=1#увеличваем чётность
    angl+=30#увеличиваем угол

# вывод полученных после сортировки линий
print("Построенные линии")
for i in range(0, len(linline)):
    l = linline[i]
    cv2.line(rgb_image1, (l[0], l[1]), (l[2], l[3]), (142, 107, 255), 3, cv2.LINE_AA)
    cv2.putText(rgb_image1, str(i + 1), (l[0], l[1]), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    print(l, i + 1)
viewImage(rgb_image1, "Line")

vpr = -1#флаг совпадения линий
while video.isOpened():
    _, img = video.read()
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    tresh = cv2.GaussianBlur(gray, (5, 5), 0)
    tresh = cv2.Canny(tresh, 50, 150)
    _, tresh = cv2.threshold(gray, 78, 125, cv2.THRESH_BINARY_INV)
    contours0, hierarchy0 = cv2.findContours(tresh.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours0:
        rect = cv2.minAreaRect(cnt)  # пытаемся вписать прямоугольник
        box = cv2.boxPoints(rect)  # поиск четырех вершин прямоугольника
        box = np.intp(box)  # округление координат
        #cv2.drawContours(img, [box], 0, (255, 0, 0), 2)
        area = int(rect[1][0] * rect[1][1])  # вычисление площади
        if area > 350 and area < 8000:#является ли контуром мышки
            k = 0
            for l in linline:#отображение линий
                k += 1
                cv2.line(img, (l[0], l[1]), (l[2], l[3]), (142, 107, 255), 3, cv2.LINE_AA)
                cv2.putText(img, str(k), (l[0], l[1]), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            if box[0][0] > 0:
                cv2.drawContours(img, [box], 0, (255, 0, 0), 2)#отображение контура
                v = findPeresech(linline, box)#обнаружения пересечения
                if v != -1 and vpr != v:#устанавление факта пересечения
                    linline[v][4] += 1
                    vpr = v
                    cv2.drawContours(img, [box], 0, (0, 0, 255), 2)
                    #print(box)
                    print("Количество пересечений линии ", v + 1, ":", linline[v][4])
    # cv2.namedWindow('video', cv2.WINDOW_NORMAL)
    # cv2.imshow('video', img)
    viewImage(img, 'video')
    if cv2.waitKey(40) & 0xFF == ord('q'):#заверщение показа видео при нажатии на 'q'
        video.release()
        cv2.destroyAllWindows()
cv2.destroyAllWindows()
video.release()

