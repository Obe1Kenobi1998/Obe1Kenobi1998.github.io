/* =====================================================================
   КАТАЛОГ КОМПЛЕКТУЮЩИХ для страницы «Собери ПК» (pc.html).
   Цены — ориентировочные розничные цены в России на дату PC_DATA.date
   (по данным магазинов и обзоров: 3DNews «Компьютер месяца», palert.ru и др.).
   Точная цена — по ссылкам «Маркет / Ozon / DNS» у каждой позиции: ссылки ведут
   на поиск именно этой модели в магазине.
   Габариты и ограничения — по данным производителей; перед покупкой сверяйте
   на странице товара (у разных ревизий и цветов бывают отличия в пару миллиметров).

   КАК ДОБАВИТЬ ПОЗИЦИЮ: скопируй похожую строку в нужный раздел, поменяй id (любой
   уникальный латиницей), название, характеристики и цену. Новое сразу появится
   в каталоге, проверка совместимости заработает по указанным полям.

   Сокращения полей:
   корпуса  mb — какие платы влезают (E — E-ATX, A — ATX, M — mATX, I — Mini-ITX),
            dim — ширина × высота × глубина, мм; gpu — макс. длина видеокарты, мм;
            cool — макс. высота башенного кулера, мм; rt / rf — макс. радиатор СЖО сверху / спереди, мм;
            psu — формат блока питания (ATX или SFX); front — mesh (сетка) / glass (стекло) / solid / wood;
            fans — вентиляторы в комплекте: «3x140f,1x120r» (f — спереди, r — сзади, t — сверху, b — снизу)
   процессоры s — сокет, c/t — ядра/потоки, ghz — частота, w — TDP, pw — пиковое потребление, Вт,
            ig — встроенная графика (0 — нет), igs — её сила (RTX 5060 = 100), g — сила в играх
            (Ryzen 7 9800X3D = 100), m — многопоток (9800X3D = 100)
   платы    s — сокет, ch — чипсет, ff — формат, mem — тип памяти, ms — слотов памяти, m2 — слотов M.2
   память   t — тип, gb — объём комплекта, k — планок, mhz — частота, cl — тайминг, h — высота, мм
   видеокарты chip, vr — видеопамять, ГБ, len — длина, мм, sl — толщина в слотах, w — потребление, Вт,
            g — производительность (RTX 5060 = 100), col — цвет, fans — вентиляторов
   охлаждение k — tower (башня) / low (низкий) / aio (СЖО), h — высота башни, мм, r — радиатор СЖО, мм,
            tdp — сколько тепла отводит, Вт
   блоки питания w — мощность, cert — сертификат, mod — модульность, ff — ATX / SFX
   накопители k — m2 / sata / hdd, tb — объём, ТБ
   ===================================================================== */
window.PC_DATA = {
  date: "25.11.2026",

  cases: [
    { id: "dc-ch560", b: "DEEPCOOL", n: "CH560", mb: "EAMI", dim: [230, 472, 460], gpu: 380, cool: 175, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x140f,1x120r", rgb: 1, p: 8000 },
    { id: "dc-ch560w", b: "DEEPCOOL", n: "CH560 WH (белый)", mb: "EAMI", dim: [230, 472, 460], gpu: 380, cool: 175, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "white", fans: "3x140f,1x120r", rgb: 1, p: 8500 },
    { id: "dc-cc560", b: "DEEPCOOL", n: "CC560 V2", mb: "AMI", dim: [210, 477, 416], gpu: 370, cool: 163, rt: 240, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x120f,1x120r", rgb: 1, p: 5200 },
    { id: "dc-ch510", b: "DEEPCOOL", n: "CH510", mb: "EAMI", dim: [230, 494, 435], gpu: 380, cool: 175, rt: 240, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 5000 },
    { id: "dc-ch370", b: "DEEPCOOL", n: "CH370", mb: "MI", dim: [215, 403, 409], gpu: 320, cool: 167, rt: 240, rf: 280, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 4500 },
    { id: "dc-m40", b: "DEEPCOOL", n: "MATREXX 40 3FS", mb: "MI", dim: [210, 399, 401], gpu: 320, cool: 151, rt: 0, rf: 240, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "2x120f,1x120r", rgb: 1, p: 3300 },
    { id: "dc-m55", b: "DEEPCOOL", n: "MATREXX 55 MESH", mb: "EAMI", dim: [210, 480, 440], gpu: 370, cool: 165, rt: 280, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 4500 },
    { id: "zl-i3neo", b: "Zalman", n: "i3 NEO", mb: "AMI", dim: [210, 455, 410], gpu: 355, cool: 160, rt: 240, rf: 280, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x120f,1x120r", rgb: 1, p: 4300 },
    { id: "zl-s2", b: "Zalman", n: "S2", mb: "AMI", dim: [195, 445, 410], gpu: 340, cool: 160, rt: 0, rf: 240, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 3000 },
    { id: "ac-bolt", b: "AeroCool", n: "Bolt", mb: "AMI", dim: [197, 455, 418], gpu: 355, cool: 158, rt: 0, rf: 240, psu: "ATX", glass: 1, front: "solid", col: "black", fans: "1x120r", rgb: 1, p: 3200 },
    { id: "cg-mx330", b: "Cougar", n: "MX330-G", mb: "AMI", dim: [210, 445, 395], gpu: 350, cool: 160, rt: 0, rf: 240, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 4000 },
    { id: "msi-f120a", b: "MSI", n: "MAG FORGE 120A AIRFLOW", mb: "AMI", dim: [210, 457, 410], gpu: 330, cool: 160, rt: 240, rf: 240, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x120f,1x120r", rgb: 1, p: 5000 },
    { id: "mt-air100", b: "Montech", n: "AIR 100 ARGB", mb: "MI", dim: [210, 405, 405], gpu: 330, cool: 161, rt: 240, rf: 240, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x120f,1x120r", rgb: 1, p: 5000 },
    { id: "mt-903b", b: "Montech", n: "AIR 903 BASE", mb: "EAMI", dim: [232, 504, 470], gpu: 400, cool: 180, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x140f", rgb: 0, p: 7500 },
    { id: "mt-903m", b: "Montech", n: "AIR 903 MAX", mb: "EAMI", dim: [232, 504, 470], gpu: 400, cool: 180, rt: 360, rf: 420, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x140f,1x140r", rgb: 1, p: 9500 },
    { id: "mt-sky2", b: "Montech", n: "SKY TWO", mb: "EAMI", dim: [241, 474, 478], gpu: 400, cool: 175, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "3x120b,1x120r", rgb: 1, p: 10000 },
    { id: "mt-k95", b: "Montech", n: "KING 95 PRO", mb: "EAMI", dim: [293, 471, 475], gpu: 420, cool: 175, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "3x120b,1x120r", rgb: 1, p: 16000 },
    { id: "cr-4000d", b: "Corsair", n: "4000D AIRFLOW", mb: "EAMI", dim: [230, 466, 453], gpu: 360, cool: 170, rt: 280, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120f,1x120r", rgb: 0, p: 11000 },
    { id: "cr-4000dw", b: "Corsair", n: "4000D AIRFLOW (белый)", mb: "EAMI", dim: [230, 466, 453], gpu: 360, cool: 170, rt: 280, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "white", fans: "1x120f,1x120r", rgb: 0, p: 11500 },
    { id: "cr-3000d", b: "Corsair", n: "3000D AIRFLOW", mb: "AMI", dim: [230, 462, 466], gpu: 360, cool: 170, rt: 240, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120f,1x120r", rgb: 0, p: 8000 },
    { id: "cr-5000d", b: "Corsair", n: "5000D AIRFLOW", mb: "EAMI", dim: [245, 520, 520], gpu: 420, cool: 170, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120f,1x120r", rgb: 0, p: 16000 },
    { id: "ll-216", b: "Lian Li", n: "LANCOOL 216 RGB", mb: "EAMI", dim: [235, 491, 480], gpu: 392, cool: 180, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "2x160f,1x140r", rgb: 1, p: 11500 },
    { id: "ll-207", b: "Lian Li", n: "LANCOOL 207", mb: "AMI", dim: [230, 459, 476], gpu: 375, cool: 175, rt: 360, rf: 280, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "2x140f,2x120b", rgb: 1, p: 9000 },
    { id: "ll-o11e", b: "Lian Li", n: "O11 Dynamic EVO", mb: "EAMI", dim: [285, 459, 465], gpu: 426, cool: 167, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "", rgb: 0, p: 17000 },
    { id: "ll-o11ew", b: "Lian Li", n: "O11 Dynamic EVO (белый)", mb: "EAMI", dim: [285, 459, 465], gpu: 426, cool: 167, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "white", fans: "", rgb: 0, p: 17500 },
    { id: "ll-o11am", b: "Lian Li", n: "O11 Air Mini", mb: "EAMI", dim: [269, 380, 400], gpu: 362, cool: 170, rt: 280, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "2x140f,1x120r", rgb: 0, p: 10000 },
    { id: "ll-a3", b: "Lian Li", n: "A3-mATX", mb: "MI", dim: [192, 308, 443], gpu: 415, cool: 165, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "", rgb: 0, p: 8000 },
    { id: "nz-h5f", b: "NZXT", n: "H5 Flow (2024)", mb: "AMI", dim: [227, 464, 446], gpu: 365, cool: 180, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "2x120f,1x120b", rgb: 0, p: 10000 },
    { id: "nz-h6f", b: "NZXT", n: "H6 Flow", mb: "AMI", dim: [287, 415, 435], gpu: 365, cool: 163, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "3x120b", rgb: 0, p: 13000 },
    { id: "nz-h9f", b: "NZXT", n: "H9 Flow", mb: "EAMI", dim: [290, 495, 466], gpu: 435, cool: 165, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "white", fans: "3x120b,1x120r", rgb: 0, p: 17000 },
    { id: "fd-north", b: "Fractal Design", n: "North (дерево)", mb: "AMI", dim: [215, 469, 447], gpu: 355, cool: 170, rt: 240, rf: 360, psu: "ATX", glass: 1, front: "wood", col: "black", fans: "2x140f", rgb: 0, p: 15000 },
    { id: "fd-popair", b: "Fractal Design", n: "Pop Air RGB", mb: "AMI", dim: [215, 474, 454], gpu: 405, cool: 170, rt: 280, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x120f", rgb: 1, p: 9000 },
    { id: "fd-m2c", b: "Fractal Design", n: "Meshify 2 Compact", mb: "AMI", dim: [210, 475, 424], gpu: 360, cool: 169, rt: 240, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "2x140f,1x140r", rgb: 0, p: 13000 },
    { id: "fd-torrent", b: "Fractal Design", n: "Torrent", mb: "EAMI", dim: [242, 530, 544], gpu: 461, cool: 188, rt: 360, rf: 420, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "2x180f,3x140b", rgb: 0, p: 25000 },
    { id: "bq-500dx", b: "be quiet!", n: "Pure Base 500DX", mb: "AMI", dim: [232, 463, 450], gpu: 369, cool: 190, rt: 240, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "2x140f,1x140r", rgb: 1, p: 12000 },
    { id: "ph-xtpro", b: "Phanteks", n: "XT PRO", mb: "EAMI", dim: [230, 485, 470], gpu: 415, cool: 184, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 8000 },
    { id: "cm-td500", b: "Cooler Master", n: "MasterBox TD500 Mesh V2", mb: "EAMI", dim: [217, 469, 493], gpu: 410, cool: 165, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "3x120f", rgb: 1, p: 9000 },
    { id: "cm-q300l", b: "Cooler Master", n: "MasterBox Q300L", mb: "MI", dim: [230, 387, 387], gpu: 360, cool: 159, rt: 240, rf: 240, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 4000 },
    { id: "cm-nr200p", b: "Cooler Master", n: "NR200P (Mini-ITX)", mb: "I", dim: [185, 292, 376], gpu: 330, cool: 155, rt: 280, rf: 0, psu: "SFX", glass: 1, front: "solid", col: "black", fans: "2x120b", rgb: 0, p: 9500 },
    { id: "ll-a4h2o", b: "Lian Li", n: "A4-H2O (Mini-ITX)", mb: "I", dim: [138, 244, 355], gpu: 322, cool: 55, rt: 240, rf: 0, psu: "SFX", glass: 0, front: "mesh", col: "black", fans: "", rgb: 0, p: 13000 },
    { id: "fd-terra", b: "Fractal Design", n: "Terra (Mini-ITX)", mb: "I", dim: [157, 213, 351], gpu: 322, cool: 77, rt: 0, rf: 0, psu: "SFX", glass: 0, front: "wood", col: "black", fans: "", rgb: 0, p: 17000 },
    { id: "jb-d31", b: "Jonsbo", n: "D31 MESH (mATX, экран)", mb: "MI", dim: [205, 415, 420], gpu: 400, cool: 168, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "", rgb: 0, p: 8000 },
    { id: "jb-d41", b: "Jonsbo", n: "D41 MESH", mb: "AMI", dim: [215, 445, 430], gpu: 400, cool: 168, rt: 360, rf: 360, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "", rgb: 0, p: 10000 },
    { id: "hy-y60", b: "HYTE", n: "Y60 (панорамный)", mb: "AMI", dim: [285, 462, 456], gpu: 375, cool: 160, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "2x120b,1x120r", rgb: 0, p: 18000 },
    { id: "hy-y40", b: "HYTE", n: "Y40", mb: "AMI", dim: [240, 470, 458], gpu: 422, cool: 180, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "2x120r", rgb: 0, p: 13000 },
    { id: "tt-v270", b: "Thermaltake", n: "View 270 TG ARGB", mb: "AMI", dim: [230, 497, 430], gpu: 380, cool: 175, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "3x120b", rgb: 1, p: 9000 },
    { id: "tt-s100", b: "Thermaltake", n: "S100 TG", mb: "MI", dim: [220, 446, 430], gpu: 330, cool: 165, rt: 240, rf: 280, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "1x120r", rgb: 0, p: 5000 },
    { id: "as-gt502", b: "ASUS", n: "TUF Gaming GT502", mb: "AMI", dim: [285, 462, 450], gpu: 400, cool: 163, rt: 360, rf: 0, psu: "ATX", glass: 1, front: "glass", col: "black", fans: "", rgb: 0, p: 15000 },
    { id: "as-a21", b: "ASUS", n: "A21 (mATX)", mb: "MI", dim: [230, 460, 380], gpu: 380, cool: 165, rt: 360, rf: 240, psu: "ATX", glass: 1, front: "mesh", col: "black", fans: "", rgb: 0, p: 7000 }
  ],

  cpus: [
    { id: "r5-5500", b: "AMD", n: "Ryzen 5 5500", s: "AM4", c: 6, t: 12, ghz: "3.6–4.2", w: 65, pw: 76, ig: 0, g: 45, m: 50, p: 9000 },
    { id: "r5-5600", b: "AMD", n: "Ryzen 5 5600", s: "AM4", c: 6, t: 12, ghz: "3.5–4.4", w: 65, pw: 76, ig: 0, g: 52, m: 55, p: 11500 },
    { id: "r5-5600g", b: "AMD", n: "Ryzen 5 5600G", s: "AM4", c: 6, t: 12, ghz: "3.9–4.4", w: 65, pw: 76, ig: "Radeon Vega 7", igs: 12, g: 46, m: 52, p: 12000 },
    { id: "r7-5700x", b: "AMD", n: "Ryzen 7 5700X", s: "AM4", c: 8, t: 16, ghz: "3.4–4.6", w: 65, pw: 76, ig: 0, g: 55, m: 68, p: 15000 },
    { id: "r7-5700x3d", b: "AMD", n: "Ryzen 7 5700X3D", s: "AM4", c: 8, t: 16, ghz: "3.0–4.1", w: 105, pw: 105, ig: 0, g: 66, m: 64, p: 24000 },
    { id: "r5-7500f", b: "AMD", n: "Ryzen 5 7500F", s: "AM5", c: 6, t: 12, ghz: "3.7–5.0", w: 65, pw: 88, ig: 0, g: 68, m: 70, p: 13000 },
    { id: "r5-7600", b: "AMD", n: "Ryzen 5 7600", s: "AM5", c: 6, t: 12, ghz: "3.8–5.1", w: 65, pw: 88, ig: "Radeon (2 CU)", igs: 6, g: 70, m: 72, p: 16500 },
    { id: "r5-8600g", b: "AMD", n: "Ryzen 5 8600G", s: "AM5", c: 6, t: 12, ghz: "4.3–5.0", w: 65, pw: 88, ig: "Radeon 760M", igs: 26, g: 60, m: 66, p: 18000 },
    { id: "r7-8700g", b: "AMD", n: "Ryzen 7 8700G", s: "AM5", c: 8, t: 16, ghz: "4.2–5.1", w: 65, pw: 88, ig: "Radeon 780M", igs: 32, g: 63, m: 80, p: 25000 },
    { id: "r5-9600x", b: "AMD", n: "Ryzen 5 9600X", s: "AM5", c: 6, t: 12, ghz: "3.9–5.4", w: 65, pw: 88, ig: "Radeon (2 CU)", igs: 6, g: 75, m: 78, p: 19500 },
    { id: "r7-7700", b: "AMD", n: "Ryzen 7 7700", s: "AM5", c: 8, t: 16, ghz: "3.8–5.3", w: 65, pw: 88, ig: "Radeon (2 CU)", igs: 6, g: 72, m: 88, p: 22000 },
    { id: "r7-9700x", b: "AMD", n: "Ryzen 7 9700X", s: "AM5", c: 8, t: 16, ghz: "3.8–5.5", w: 65, pw: 88, ig: "Radeon (2 CU)", igs: 6, g: 78, m: 95, p: 25500 },
    { id: "r7-7800x3d", b: "AMD", n: "Ryzen 7 7800X3D", s: "AM5", c: 8, t: 16, ghz: "4.2–5.0", w: 120, pw: 90, ig: "Radeon (2 CU)", igs: 6, g: 88, m: 85, p: 28500 },
    { id: "r7-9800x3d", b: "AMD", n: "Ryzen 7 9800X3D", s: "AM5", c: 8, t: 16, ghz: "4.7–5.2", w: 120, pw: 120, ig: "Radeon (2 CU)", igs: 6, g: 100, m: 100, p: 40000 },
    { id: "r9-9900x", b: "AMD", n: "Ryzen 9 9900X", s: "AM5", c: 12, t: 24, ghz: "4.4–5.6", w: 120, pw: 162, ig: "Radeon (2 CU)", igs: 6, g: 80, m: 140, p: 33000 },
    { id: "r9-9950x", b: "AMD", n: "Ryzen 9 9950X", s: "AM5", c: 16, t: 32, ghz: "4.3–5.7", w: 170, pw: 230, ig: "Radeon (2 CU)", igs: 6, g: 82, m: 175, p: 48000 },
    { id: "r9-9950x3d", b: "AMD", n: "Ryzen 9 9950X3D", s: "AM5", c: 16, t: 32, ghz: "4.3–5.7", w: 170, pw: 200, ig: "Radeon (2 CU)", igs: 6, g: 98, m: 172, p: 66000 },
    { id: "i3-12100f", b: "Intel", n: "Core i3-12100F", s: "LGA1700", c: 4, t: 8, ghz: "3.3–4.3", w: 58, pw: 89, ig: 0, g: 48, m: 38, p: 7500 },
    { id: "i5-12400f", b: "Intel", n: "Core i5-12400F", s: "LGA1700", c: 6, t: 12, ghz: "2.5–4.4", w: 65, pw: 117, ig: 0, g: 56, m: 58, p: 12500 },
    { id: "i5-12400", b: "Intel", n: "Core i5-12400", s: "LGA1700", c: 6, t: 12, ghz: "2.5–4.4", w: 65, pw: 117, ig: "UHD 730", igs: 5, g: 56, m: 58, p: 14000 },
    { id: "i5-13400f", b: "Intel", n: "Core i5-13400F", s: "LGA1700", c: 10, t: 16, ghz: "2.5–4.6", w: 65, pw: 148, ig: 0, g: 60, m: 75, p: 13500 },
    { id: "i5-14400f", b: "Intel", n: "Core i5-14400F", s: "LGA1700", c: 10, t: 16, ghz: "2.5–4.7", w: 65, pw: 148, ig: 0, g: 62, m: 78, p: 14500 },
    { id: "i5-14600kf", b: "Intel", n: "Core i5-14600KF", s: "LGA1700", c: 14, t: 20, ghz: "3.5–5.3", w: 125, pw: 181, ig: 0, g: 74, m: 110, p: 20000 },
    { id: "i7-14700kf", b: "Intel", n: "Core i7-14700KF", s: "LGA1700", c: 20, t: 28, ghz: "3.4–5.6", w: 125, pw: 253, ig: 0, g: 80, m: 150, p: 31000 },
    { id: "i9-14900kf", b: "Intel", n: "Core i9-14900KF", s: "LGA1700", c: 24, t: 32, ghz: "3.2–6.0", w: 125, pw: 253, ig: 0, g: 84, m: 165, p: 46000 },
    { id: "u5-225f", b: "Intel", n: "Core Ultra 5 225F", s: "LGA1851", c: 10, t: 10, ghz: "3.3–4.9", w: 65, pw: 121, ig: 0, g: 60, m: 85, p: 16000 },
    { id: "u5-245k", b: "Intel", n: "Core Ultra 5 245K", s: "LGA1851", c: 14, t: 14, ghz: "4.2–5.2", w: 125, pw: 159, ig: "Intel Graphics (4 Xe)", igs: 10, g: 70, m: 115, p: 22000 },
    { id: "u5-250kp", b: "Intel", n: "Core Ultra 5 250K Plus", s: "LGA1851", c: 18, t: 18, ghz: "4.2–5.3", w: 125, pw: 159, ig: "Intel Graphics (4 Xe)", igs: 10, g: 74, m: 135, p: 23500 },
    { id: "u7-265k", b: "Intel", n: "Core Ultra 7 265K", s: "LGA1851", c: 20, t: 20, ghz: "3.9–5.5", w: 125, pw: 250, ig: "Intel Graphics (4 Xe)", igs: 11, g: 76, m: 150, p: 30000 },
    { id: "u7-270kp", b: "Intel", n: "Core Ultra 7 270K Plus", s: "LGA1851", c: 24, t: 24, ghz: "3.9–5.5", w: 125, pw: 250, ig: "Intel Graphics (4 Xe)", igs: 11, g: 80, m: 165, p: 31000 },
    { id: "u9-285k", b: "Intel", n: "Core Ultra 9 285K", s: "LGA1851", c: 24, t: 24, ghz: "3.7–5.7", w: 125, pw: 250, ig: "Intel Graphics (4 Xe)", igs: 12, g: 80, m: 175, p: 50000 }
  ],

  mbs: [
    { id: "msi-a520ma", b: "MSI", n: "A520M-A PRO", s: "AM4", ch: "A520", ff: "M", mem: "DDR4", ms: 2, m2: 1, wifi: 0, p: 5500 },
    { id: "ar-a520hdv", b: "ASRock", n: "A520M-HDV", s: "AM4", ch: "A520", ff: "M", mem: "DDR4", ms: 2, m2: 1, wifi: 0, p: 5200 },
    { id: "gb-b550mds3h", b: "GIGABYTE", n: "B550M DS3H", s: "AM4", ch: "B550", ff: "M", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 8000 },
    { id: "ar-b550mpro4", b: "ASRock", n: "B550M Pro4", s: "AM4", ch: "B550", ff: "M", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 8500 },
    { id: "gb-b550eagle", b: "GIGABYTE", n: "B550 EAGLE", s: "AM4", ch: "B550", ff: "A", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 9500 },
    { id: "as-b550tuf", b: "ASUS", n: "TUF GAMING B550-PLUS", s: "AM4", ch: "B550", ff: "A", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 13000 },
    { id: "msi-b550tom", b: "MSI", n: "MAG B550 TOMAHAWK", s: "AM4", ch: "B550", ff: "A", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 14000 },
    { id: "as-b550i", b: "ASUS", n: "ROG STRIX B550-I GAMING", s: "AM4", ch: "B550", ff: "I", mem: "DDR4", ms: 2, m2: 2, wifi: 1, p: 17000 },
    { id: "ar-a620mhdv", b: "ASRock", n: "A620M-HDV/M.2+", s: "AM5", ch: "A620", ff: "M", mem: "DDR5", ms: 2, m2: 1, wifi: 0, p: 8500 },
    { id: "gb-a620mgx", b: "GIGABYTE", n: "A620M GAMING X", s: "AM5", ch: "A620", ff: "M", mem: "DDR5", ms: 2, m2: 2, wifi: 0, p: 9000 },
    { id: "gb-b650mgxax", b: "GIGABYTE", n: "B650M GAMING X AX", s: "AM5", ch: "B650", ff: "M", mem: "DDR5", ms: 4, m2: 2, wifi: 1, p: 14000 },
    { id: "msi-b650ma", b: "MSI", n: "PRO B650M-A WIFI", s: "AM5", ch: "B650", ff: "M", mem: "DDR5", ms: 4, m2: 2, wifi: 1, p: 14500 },
    { id: "as-b650tuf", b: "ASUS", n: "TUF GAMING B650-PLUS WIFI", s: "AM5", ch: "B650", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 18000 },
    { id: "msi-b650tom", b: "MSI", n: "MAG B650 TOMAHAWK WIFI", s: "AM5", ch: "B650", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 20000 },
    { id: "gb-b850eagle", b: "GIGABYTE", n: "B850 EAGLE WIFI6E", s: "AM5", ch: "B850", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 17000 },
    { id: "gb-b850maorus", b: "GIGABYTE", n: "B850M AORUS ELITE WIFI6E", s: "AM5", ch: "B850", ff: "M", mem: "DDR5", ms: 4, m2: 2, wifi: 1, p: 17500 },
    { id: "as-b850tuf", b: "ASUS", n: "TUF GAMING B850-PLUS WIFI", s: "AM5", ch: "B850", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 20000 },
    { id: "msi-b850tom", b: "MSI", n: "MAG B850 TOMAHAWK MAX WIFI", s: "AM5", ch: "B850", ff: "A", mem: "DDR5", ms: 4, m2: 4, wifi: 1, p: 23000 },
    { id: "msi-x870tom", b: "MSI", n: "MAG X870 TOMAHAWK WIFI", s: "AM5", ch: "X870", ff: "A", mem: "DDR5", ms: 4, m2: 4, wifi: 1, p: 30000 },
    { id: "as-x870ee", b: "ASUS", n: "ROG STRIX X870E-E GAMING WIFI", s: "AM5", ch: "X870E", ff: "A", mem: "DDR5", ms: 4, m2: 5, wifi: 1, p: 45000 },
    { id: "ar-b650i", b: "ASRock", n: "B650I Lightning WiFi", s: "AM5", ch: "B650", ff: "I", mem: "DDR5", ms: 2, m2: 2, wifi: 1, p: 20000 },
    { id: "gb-h610ms2h", b: "GIGABYTE", n: "H610M S2H DDR4", s: "LGA1700", ch: "H610", ff: "M", mem: "DDR4", ms: 2, m2: 1, wifi: 0, p: 6500 },
    { id: "mx-b760mch", b: "MAXSUN", n: "MS-Challenger B760M", s: "LGA1700", ch: "B760", ff: "M", mem: "DDR4", ms: 2, m2: 2, wifi: 0, p: 7500 },
    { id: "as-b760mkd4", b: "ASUS", n: "PRIME B760M-K D4", s: "LGA1700", ch: "B760", ff: "M", mem: "DDR4", ms: 2, m2: 2, wifi: 0, p: 9000 },
    { id: "gb-b760mds3h", b: "GIGABYTE", n: "B760M DS3H DDR4", s: "LGA1700", ch: "B760", ff: "M", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 10000 },
    { id: "msi-b760ma", b: "MSI", n: "PRO B760M-A DDR4 II", s: "LGA1700", ch: "B760", ff: "M", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 12500 },
    { id: "gb-b760gx", b: "GIGABYTE", n: "B760 GAMING X DDR4", s: "LGA1700", ch: "B760", ff: "A", mem: "DDR4", ms: 4, m2: 2, wifi: 0, p: 12000 },
    { id: "msi-b760tom", b: "MSI", n: "MAG B760 TOMAHAWK WIFI", s: "LGA1700", ch: "B760", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 17000 },
    { id: "as-b760tuf", b: "ASUS", n: "TUF GAMING B760-PLUS WIFI", s: "LGA1700", ch: "B760", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 18000 },
    { id: "msi-z790p", b: "MSI", n: "PRO Z790-P WIFI", s: "LGA1700", ch: "Z790", ff: "A", mem: "DDR5", ms: 4, m2: 4, wifi: 1, p: 20000 },
    { id: "as-b760i", b: "ASUS", n: "ROG STRIX B760-I GAMING WIFI", s: "LGA1700", ch: "B760", ff: "I", mem: "DDR5", ms: 2, m2: 2, wifi: 1, p: 20000 },
    { id: "msi-b860ma", b: "MSI", n: "PRO B860M-A WIFI", s: "LGA1851", ch: "B860", ff: "M", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 16000 },
    { id: "gb-b860gx", b: "GIGABYTE", n: "B860 GAMING X WIFI6E", s: "LGA1851", ch: "B860", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 18500 },
    { id: "as-b860tuf", b: "ASUS", n: "TUF GAMING B860-PLUS WIFI", s: "LGA1851", ch: "B860", ff: "A", mem: "DDR5", ms: 4, m2: 3, wifi: 1, p: 20000 },
    { id: "gb-z890elite", b: "GIGABYTE", n: "Z890 AORUS ELITE WIFI7", s: "LGA1851", ch: "Z890", ff: "A", mem: "DDR5", ms: 4, m2: 4, wifi: 1, p: 30000 },
    { id: "msi-z890tom", b: "MSI", n: "MAG Z890 TOMAHAWK WIFI", s: "LGA1851", ch: "Z890", ff: "A", mem: "DDR5", ms: 4, m2: 4, wifi: 1, p: 32000 }
  ],

  rams: [
    { id: "nt-d4-16", b: "Netac", n: "Basic DDR4 16 ГБ (2×8) 3200", t: "DDR4", gb: 16, k: 2, mhz: 3200, cl: 16, h: 32, rgb: 0, p: 9000 },
    { id: "kf-d4-16", b: "Kingston", n: "FURY Beast DDR4 16 ГБ (2×8) 3200", t: "DDR4", gb: 16, k: 2, mhz: 3200, cl: 16, h: 34, rgb: 0, p: 10000 },
    { id: "kf-d4-32", b: "Kingston", n: "FURY Beast DDR4 32 ГБ (2×16) 3200", t: "DDR4", gb: 32, k: 2, mhz: 3200, cl: 16, h: 34, rgb: 0, p: 24000 },
    { id: "gs-d4-32", b: "G.Skill", n: "Ripjaws V DDR4 32 ГБ (2×16) 3600", t: "DDR4", gb: 32, k: 2, mhz: 3600, cl: 18, h: 42, rgb: 0, p: 25500 },
    { id: "kfr-d4-32", b: "Kingston", n: "FURY Beast RGB DDR4 32 ГБ (2×16) 3600", t: "DDR4", gb: 32, k: 2, mhz: 3600, cl: 18, h: 42, rgb: 1, p: 27500 },
    { id: "kf-d4-64", b: "Kingston", n: "FURY Beast DDR4 64 ГБ (2×32) 3200", t: "DDR4", gb: 64, k: 2, mhz: 3200, cl: 16, h: 34, rgb: 0, p: 47000 },
    { id: "kf-d5-16", b: "Kingston", n: "FURY Beast DDR5 16 ГБ (2×8) 5600", t: "DDR5", gb: 16, k: 2, mhz: 5600, cl: 36, h: 35, rgb: 0, p: 23000 },
    { id: "kf-d5-32", b: "Kingston", n: "FURY Beast DDR5 32 ГБ (2×16) 6000", t: "DDR5", gb: 32, k: 2, mhz: 6000, cl: 30, h: 35, rgb: 0, p: 48000 },
    { id: "kfr-d5-32", b: "Kingston", n: "FURY Beast RGB DDR5 32 ГБ (2×16) 6000", t: "DDR5", gb: 32, k: 2, mhz: 6000, cl: 30, h: 42, rgb: 1, p: 51000 },
    { id: "gs-flare-32", b: "G.Skill", n: "Flare X5 DDR5 32 ГБ (2×16) 6000", t: "DDR5", gb: 32, k: 2, mhz: 6000, cl: 30, h: 33, rgb: 0, p: 48500 },
    { id: "gs-tz5-32", b: "G.Skill", n: "Trident Z5 RGB DDR5 32 ГБ (2×16) 6000", t: "DDR5", gb: 32, k: 2, mhz: 6000, cl: 30, h: 44, rgb: 1, p: 53000 },
    { id: "cr-veng-32", b: "Corsair", n: "Vengeance RGB DDR5 32 ГБ (2×16) 6000", t: "DDR5", gb: 32, k: 2, mhz: 6000, cl: 30, h: 45, rgb: 1, p: 52000 },
    { id: "tf-delta-32", b: "TeamGroup", n: "T-Force Delta RGB DDR5 32 ГБ (2×16) 6000", t: "DDR5", gb: 32, k: 2, mhz: 6000, cl: 38, h: 46, rgb: 1, p: 49000 },
    { id: "ad-lancer-32", b: "ADATA", n: "XPG Lancer Blade RGB DDR5 32 ГБ (2×16) 6000", t: "DDR5", gb: 32, k: 2, mhz: 6000, cl: 30, h: 34, rgb: 1, p: 49500 },
    { id: "kf-d5-64", b: "Kingston", n: "FURY Beast DDR5 64 ГБ (2×32) 6000", t: "DDR5", gb: 64, k: 2, mhz: 6000, cl: 30, h: 35, rgb: 0, p: 95000 },
    { id: "kf-d5-96", b: "G.Skill", n: "Trident Z5 RGB DDR5 96 ГБ (2×48) 6400", t: "DDR5", gb: 96, k: 2, mhz: 6400, cl: 32, h: 44, rgb: 1, p: 150000 }
  ],

  gpus: [
    { id: "g-2060s", b: "Разные бренды", n: "GeForce RTX 2060 SUPER 8 ГБ", chip: "RTX 2060 SUPER", vr: 8, len: 230, sl: 2, w: 175, g: 72, col: "black", fans: 2, p: 31000 },
    { id: "g-3050", b: "MSI", n: "GeForce RTX 3050 VENTUS 2X 8G OC", chip: "RTX 3050", vr: 8, len: 189, sl: 2, w: 130, g: 55, col: "black", fans: 2, p: 36000 },
    { id: "g-3060", b: "Palit", n: "GeForce RTX 3060 Dual 12GB", chip: "RTX 3060", vr: 12, len: 245, sl: 2, w: 170, g: 75, col: "black", fans: 2, p: 53500 },
    { id: "g-b570", b: "ASRock", n: "Intel Arc B570 Challenger 10GB", chip: "Arc B570", vr: 10, len: 270, sl: 2, w: 150, g: 80, col: "black", fans: 2, p: 41000 },
    { id: "g-b580", b: "ASRock", n: "Intel Arc B580 Challenger OC 12GB", chip: "Arc B580", vr: 12, len: 272, sl: 2, w: 190, g: 92, col: "black", fans: 2, p: 44000 },
    { id: "g-7600", b: "Sapphire", n: "PULSE Radeon RX 7600 8GB", chip: "RX 7600", vr: 8, len: 240, sl: 2, w: 165, g: 82, col: "black", fans: 2, p: 46000 },
    { id: "g-5050", b: "MSI", n: "GeForce RTX 5050 VENTUS 2X OC 8G", chip: "RTX 5050", vr: 8, len: 197, sl: 2, w: 130, g: 82, col: "black", fans: 2, p: 45000 },
    { id: "g-5060p", b: "Palit", n: "GeForce RTX 5060 Dual 8GB", chip: "RTX 5060", vr: 8, len: 250, sl: 2, w: 145, g: 100, col: "black", fans: 2, p: 52000 },
    { id: "g-5060g", b: "GIGABYTE", n: "GeForce RTX 5060 WINDFORCE OC 8G", chip: "RTX 5060", vr: 8, len: 199, sl: 2, w: 145, g: 100, col: "black", fans: 2, p: 53500 },
    { id: "g-9060xt8", b: "ASRock", n: "Radeon RX 9060 XT Challenger 8GB", chip: "RX 9060 XT 8GB", vr: 8, len: 270, sl: 2, w: 160, g: 110, col: "black", fans: 2, p: 52000 },
    { id: "g-5060ti8", b: "ASUS", n: "DUAL GeForce RTX 5060 Ti 8GB", chip: "RTX 5060 Ti 8GB", vr: 8, len: 229, sl: 2.5, w: 180, g: 115, col: "black", fans: 2, p: 60000 },
    { id: "g-9060xt16", b: "Sapphire", n: "PULSE Radeon RX 9060 XT 16GB", chip: "RX 9060 XT 16GB", vr: 16, len: 240, sl: 2, w: 180, g: 115, col: "black", fans: 2, p: 70500 },
    { id: "g-5060ti16", b: "MSI", n: "GeForce RTX 5060 Ti 16G VENTUS 2X OC", chip: "RTX 5060 Ti 16GB", vr: 16, len: 199, sl: 2, w: 180, g: 118, col: "black", fans: 2, p: 86000 },
    { id: "g-5060ti16w", b: "ASUS", n: "DUAL GeForce RTX 5060 Ti 16GB White", chip: "RTX 5060 Ti 16GB", vr: 16, len: 229, sl: 2.5, w: 180, g: 118, col: "white", fans: 2, p: 90000 },
    { id: "g-9070gre", b: "PowerColor", n: "Radeon RX 9070 GRE Reaper 12GB", chip: "RX 9070 GRE", vr: 12, len: 242, sl: 2, w: 220, g: 145, col: "black", fans: 3, p: 80000 },
    { id: "g-5070m", b: "MSI", n: "GeForce RTX 5070 VENTUS 2X OC 12G", chip: "RTX 5070", vr: 12, len: 242, sl: 2.5, w: 250, g: 160, col: "black", fans: 2, p: 96000 },
    { id: "g-5070p", b: "Palit", n: "GeForce RTX 5070 GamingPro 12GB", chip: "RTX 5070", vr: 12, len: 304, sl: 2.5, w: 250, g: 162, col: "black", fans: 3, p: 98000 },
    { id: "g-9070", b: "Sapphire", n: "PULSE Radeon RX 9070 16GB", chip: "RX 9070", vr: 16, len: 320, sl: 2.5, w: 220, g: 172, col: "black", fans: 3, p: 90000 },
    { id: "g-9070xt", b: "PowerColor", n: "Hellhound Radeon RX 9070 XT 16GB", chip: "RX 9070 XT", vr: 16, len: 332, sl: 2.5, w: 304, g: 195, col: "black", fans: 3, p: 110000 },
    { id: "g-9070xtn", b: "Sapphire", n: "NITRO+ Radeon RX 9070 XT 16GB", chip: "RX 9070 XT", vr: 16, len: 320, sl: 3, w: 330, g: 200, col: "black", fans: 3, p: 125000 },
    { id: "g-5070ti", b: "GIGABYTE", n: "GeForce RTX 5070 Ti WINDFORCE OC SFF 16G", chip: "RTX 5070 Ti", vr: 16, len: 304, sl: 2.5, w: 300, g: 205, col: "black", fans: 3, p: 150000 },
    { id: "g-5070titf", b: "ASUS", n: "TUF Gaming GeForce RTX 5070 Ti 16GB", chip: "RTX 5070 Ti", vr: 16, len: 348, sl: 3.6, w: 300, g: 208, col: "black", fans: 3, p: 165000 },
    { id: "g-5080", b: "MSI", n: "GeForce RTX 5080 16G GAMING TRIO OC", chip: "RTX 5080", vr: 16, len: 338, sl: 3, w: 360, g: 240, col: "black", fans: 3, p: 197000 },
    { id: "g-5080w", b: "GIGABYTE", n: "GeForce RTX 5080 AERO OC 16G (белая)", chip: "RTX 5080", vr: 16, len: 340, sl: 3.5, w: 360, g: 242, col: "white", fans: 3, p: 215000 },
    { id: "g-5090", b: "Palit", n: "GeForce RTX 5090 GameRock 32GB", chip: "RTX 5090", vr: 32, len: 332, sl: 3.5, w: 575, g: 340, col: "black", fans: 3, p: 780000 }
  ],

  coolers: [
    { id: "id-se903", b: "ID-COOLING", n: "SE-903-SD V3", k: "tower", h: 131, tdp: 130, fans: 1, rgb: 0, p: 1000 },
    { id: "id-se224xts", b: "ID-COOLING", n: "SE-224-XTS", k: "tower", h: 154, tdp: 180, fans: 1, rgb: 0, p: 2000 },
    { id: "dc-ak400", b: "DEEPCOOL", n: "AK400", k: "tower", h: 155, tdp: 220, fans: 1, rgb: 0, p: 2800 },
    { id: "ar-f36", b: "ARCTIC", n: "Freezer 36", k: "tower", h: 159, tdp: 200, fans: 2, rgb: 0, p: 3500 },
    { id: "tr-pa120se", b: "Thermalright", n: "Peerless Assassin 120 SE", k: "tower", h: 155, tdp: 245, fans: 2, rgb: 0, p: 3500 },
    { id: "tr-ps120se", b: "Thermalright", n: "Phantom Spirit 120 SE ARGB", k: "tower", h: 154, tdp: 245, fans: 2, rgb: 1, p: 4200 },
    { id: "tr-rp130", b: "Thermalright", n: "Royal Pretor 130", k: "tower", h: 158, tdp: 265, fans: 2, rgb: 0, p: 4500 },
    { id: "bq-pr2", b: "be quiet!", n: "Pure Rock 2", k: "tower", h: 155, tdp: 150, fans: 1, rgb: 0, p: 4500 },
    { id: "dc-ak500", b: "DEEPCOOL", n: "AK500 DIGITAL", k: "tower", h: 158, tdp: 240, fans: 1, rgb: 1, p: 5200 },
    { id: "dc-ak620", b: "DEEPCOOL", n: "AK620", k: "tower", h: 160, tdp: 260, fans: 2, rgb: 0, p: 6000 },
    { id: "nc-d15g2", b: "Noctua", n: "NH-D15 G2", k: "tower", h: 168, tdp: 280, fans: 2, rgb: 0, p: 17000 },
    { id: "tr-axp90", b: "Thermalright", n: "AXP90-X47 (низкий)", k: "low", h: 47, tdp: 95, fans: 1, rgb: 0, p: 2500 },
    { id: "id-is55", b: "ID-COOLING", n: "IS-55 (низкий)", k: "low", h: 57, tdp: 125, fans: 1, rgb: 0, p: 3000 },
    { id: "id-fx240", b: "ID-COOLING", n: "FrostFlow X 240 (СЖО)", k: "aio", r: 240, tdp: 220, fans: 2, rgb: 0, p: 4500 },
    { id: "dc-le520", b: "DEEPCOOL", n: "LE520 (СЖО 240)", k: "aio", r: 240, tdp: 240, fans: 2, rgb: 1, p: 6000 },
    { id: "ar-lf3-240", b: "ARCTIC", n: "Liquid Freezer III 240", k: "aio", r: 240, tdp: 270, fans: 2, rgb: 0, p: 8000 },
    { id: "ar-lf3-280", b: "ARCTIC", n: "Liquid Freezer III 280", k: "aio", r: 280, tdp: 300, fans: 2, rgb: 0, p: 9000 },
    { id: "tr-fn360", b: "Thermalright", n: "Frozen Notte 360 ARGB", k: "aio", r: 360, tdp: 300, fans: 3, rgb: 1, p: 7500 },
    { id: "dc-ls720", b: "DEEPCOOL", n: "LS720 (СЖО 360)", k: "aio", r: 360, tdp: 320, fans: 3, rgb: 1, p: 10500 },
    { id: "ar-lf3-360", b: "ARCTIC", n: "Liquid Freezer III 360", k: "aio", r: 360, tdp: 350, fans: 3, rgb: 0, p: 10500 },
    { id: "msi-a13", b: "MSI", n: "MAG CORELIQUID A13 360", k: "aio", r: 360, tdp: 300, fans: 3, rgb: 1, p: 10000 },
    { id: "ll-gal2", b: "Lian Li", n: "Galahad II Trinity 360", k: "aio", r: 360, tdp: 350, fans: 3, rgb: 1, p: 15000 },
    { id: "nz-kr360", b: "NZXT", n: "Kraken 360 (экран на помпе)", k: "aio", r: 360, tdp: 350, fans: 3, rgb: 1, p: 20000 }
  ],

  psus: [
    { id: "dc-pf500", b: "DEEPCOOL", n: "PF500", w: 500, cert: "80+", mod: "нет", ff: "ATX", p: 3300 },
    { id: "dc-pf600", b: "DEEPCOOL", n: "PF600", w: 600, cert: "80+", mod: "нет", ff: "ATX", p: 3800 },
    { id: "dc-pf650", b: "DEEPCOOL", n: "PF650", w: 650, cert: "80+", mod: "нет", ff: "ATX", p: 4200 },
    { id: "msi-a650bn", b: "MSI", n: "MAG A650BN", w: 650, cert: "80+ Bronze", mod: "нет", ff: "ATX", p: 5000 },
    { id: "bq-sp10", b: "be quiet!", n: "System Power 10 650W", w: 650, cert: "80+ Bronze", mod: "нет", ff: "ATX", p: 6500 },
    { id: "dc-pk750d", b: "DEEPCOOL", n: "PK750D", w: 750, cert: "80+ Bronze", mod: "нет", ff: "ATX", p: 6000 },
    { id: "dc-pn750d", b: "DEEPCOOL", n: "GAMERSTORM PN750D", w: 750, cert: "80+ Gold", mod: "нет", ff: "ATX", p: 6500 },
    { id: "msi-a750gl", b: "MSI", n: "MAG A750GL PCIE5", w: 750, cert: "80+ Gold", mod: "частичная", ff: "ATX", p: 8000 },
    { id: "dc-pn850m", b: "DEEPCOOL", n: "PN850M", w: 850, cert: "80+ Gold", mod: "полная", ff: "ATX", p: 9000 },
    { id: "cm-mwe850", b: "Cooler Master", n: "MWE Gold 850 V2", w: 850, cert: "80+ Gold", mod: "полная", ff: "ATX", p: 10000 },
    { id: "bq-pp12m", b: "be quiet!", n: "Pure Power 12 M 850W", w: 850, cert: "80+ Gold", mod: "полная", ff: "ATX", p: 12000 },
    { id: "cr-rm850x", b: "Corsair", n: "RM850x (2024)", w: 850, cert: "80+ Gold", mod: "полная", ff: "ATX", p: 15000 },
    { id: "ss-gx850", b: "Seasonic", n: "FOCUS GX-850", w: 850, cert: "80+ Gold", mod: "полная", ff: "ATX", p: 15000 },
    { id: "msi-a1000pl", b: "MSI", n: "PRO A1000PL", w: 1000, cert: "80+ Platinum", mod: "нет", ff: "ATX", p: 12000 },
    { id: "msi-a1000g", b: "MSI", n: "MPG A1000G PCIE5", w: 1000, cert: "80+ Gold", mod: "полная", ff: "ATX", p: 16000 },
    { id: "cr-rm1000x", b: "Corsair", n: "RM1000x", w: 1000, cert: "80+ Gold", mod: "полная", ff: "ATX", p: 19000 },
    { id: "ss-px1300", b: "Seasonic", n: "PRIME PX-1300", w: 1300, cert: "80+ Platinum", mod: "полная", ff: "ATX", p: 32000 },
    { id: "cm-v850sfx", b: "Cooler Master", n: "V850 SFX Gold", w: 850, cert: "80+ Gold", mod: "полная", ff: "SFX", p: 15000 },
    { id: "ll-sp750", b: "Lian Li", n: "SP750 (SFX)", w: 750, cert: "80+ Gold", mod: "полная", ff: "SFX", p: 13000 },
    { id: "cr-sf750", b: "Corsair", n: "SF750 (SFX)", w: 750, cert: "80+ Platinum", mod: "полная", ff: "SFX", p: 17000 }
  ],

  ssds: [
    { id: "kn-nv3-500", b: "Kingston", n: "NV3 500 ГБ", k: "m2", tb: .5, gen: "PCIe 4.0", rd: 5000, p: 8500 },
    { id: "kn-nv3-1", b: "Kingston", n: "NV3 1 ТБ", k: "m2", tb: 1, gen: "PCIe 4.0", rd: 6000, p: 14500 },
    { id: "kn-nv3-2", b: "Kingston", n: "NV3 2 ТБ", k: "m2", tb: 2, gen: "PCIe 4.0", rd: 6000, p: 23000 },
    { id: "wd-sn5000-1", b: "WD", n: "Blue SN5000 1 ТБ", k: "m2", tb: 1, gen: "PCIe 4.0", rd: 5150, p: 15000 },
    { id: "wd-sn5000-2", b: "WD", n: "Blue SN5000 2 ТБ", k: "m2", tb: 2, gen: "PCIe 4.0", rd: 5150, p: 24000 },
    { id: "cr-p3p-1", b: "Crucial", n: "P3 Plus 1 ТБ", k: "m2", tb: 1, gen: "PCIe 4.0", rd: 5000, p: 14000 },
    { id: "ad-l860-1", b: "ADATA", n: "LEGEND 860 1 ТБ", k: "m2", tb: 1, gen: "PCIe 4.0", rd: 6000, p: 14000 },
    { id: "sm-990ep-1", b: "Samsung", n: "990 EVO Plus 1 ТБ", k: "m2", tb: 1, gen: "PCIe 4.0/5.0", rd: 7150, p: 17000 },
    { id: "sm-990ep-2", b: "Samsung", n: "990 EVO Plus 2 ТБ", k: "m2", tb: 2, gen: "PCIe 4.0/5.0", rd: 7250, p: 27000 },
    { id: "wd-sn850x-2", b: "WD", n: "BLACK SN850X 2 ТБ", k: "m2", tb: 2, gen: "PCIe 4.0", rd: 7300, p: 32000 },
    { id: "kn-kc3000-2", b: "Kingston", n: "KC3000 2 ТБ", k: "m2", tb: 2, gen: "PCIe 4.0", rd: 7000, p: 30000 },
    { id: "sm-9100-2", b: "Samsung", n: "9100 PRO 2 ТБ", k: "m2", tb: 2, gen: "PCIe 5.0", rd: 14700, p: 42000 },
    { id: "kn-a400-480", b: "Kingston", n: "A400 480 ГБ (SATA 2,5\")", k: "sata", tb: .48, gen: "SATA", rd: 500, p: 6000 },
    { id: "sm-870-1", b: "Samsung", n: "870 EVO 1 ТБ (SATA 2,5\")", k: "sata", tb: 1, gen: "SATA", rd: 560, p: 16000 },
    { id: "sg-bc-2", b: "Seagate", n: "BarraCuda 2 ТБ (HDD 3,5\")", k: "hdd", tb: 2, gen: "SATA HDD", rd: 220, p: 9000 }
  ]
};
