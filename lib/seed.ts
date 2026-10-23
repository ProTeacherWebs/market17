import { demoAdminEmail } from "@/lib/site";
import type { Banner, Category, Product, ProductSpec, ShopData } from "@/lib/types";

type Draft = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  day: number;
  note: string;
  a: string;
  b: string;
  c: string;
  d: string;
};

const categories: Category[] = [
  { id: "c-gadgets", slug: "gadgets", name: "Смартфоны и гаджеты", parentId: null, sort: 1 },
  { id: "c-phones", slug: "smartphones", name: "Смартфоны", parentId: "c-gadgets", sort: 1 },
  { id: "c-tablets", slug: "tablets", name: "Планшеты", parentId: "c-gadgets", sort: 2 },
  { id: "c-watches", slug: "watches", name: "Часы", parentId: "c-gadgets", sort: 3 },
  { id: "c-headphones", slug: "headphones", name: "Наушники", parentId: "c-gadgets", sort: 4 },
  { id: "c-computers", slug: "computers", name: "Ноутбуки и компьютеры", parentId: null, sort: 2 },
  { id: "c-laptops", slug: "laptops", name: "Ноутбуки", parentId: "c-computers", sort: 1 },
  { id: "c-monitors", slug: "monitors", name: "Мониторы", parentId: "c-computers", sort: 2 },
  { id: "c-tv", slug: "tv-audio", name: "Телевизоры и аудио", parentId: null, sort: 3 },
  { id: "c-tvs", slug: "tvs", name: "Телевизоры", parentId: "c-tv", sort: 1 },
  { id: "c-soundbars", slug: "soundbars", name: "Саундбары", parentId: "c-tv", sort: 2 },
  { id: "c-appliances", slug: "appliances", name: "Крупная техника", parentId: null, sort: 4 },
  { id: "c-fridges", slug: "fridges", name: "Холодильники", parentId: "c-appliances", sort: 1 },
  { id: "c-washers", slug: "washers", name: "Стиральные машины", parentId: "c-appliances", sort: 2 },
  { id: "c-acs", slug: "conditioners", name: "Кондиционеры", parentId: "c-appliances", sort: 3 },
  { id: "c-kitchen", slug: "kitchen", name: "Кухня и дом", parentId: null, sort: 5 },
  { id: "c-vacuums", slug: "vacuums", name: "Пылесосы", parentId: "c-kitchen", sort: 1 },
  { id: "c-kettles", slug: "kettles", name: "Чайники", parentId: "c-kitchen", sort: 2 },
  { id: "c-fryers", slug: "airfryers", name: "Аэрогрили", parentId: "c-kitchen", sort: 3 },
];

/** Модели из ассортимента магазинов Ташкента (Mediapark, Texnomart и др.). Цены в ₽ для витрины VOLTA. */
const drafts: Draft[] = [
  // смартфоны
  { slug: "samsung-galaxy-a18", name: "Смартфон Samsung Galaxy A18 6/128 ГБ", brand: "Samsung", category: "smartphones", price: 21990, compareAtPrice: 24990, stock: 0, day: 95, note: "Экран 6,7 дюйма, память 128 ГБ. Модель продаётся в Mediapark Ташкент.", a: "6,7 дюйма", b: "128 ГБ", c: "50 Мп", d: "191 г" },
  { slug: "xiaomi-redmi-note-17", name: "Смартфон Xiaomi Redmi Note 17 8/256 ГБ", brand: "Xiaomi", category: "smartphones", price: 27990, stock: 9, day: 92, note: "Экран 6,67 дюйма, память 256 ГБ. Есть в сети Xiaomi и Mediapark в Ташкенте.", a: "6,67 дюйма", b: "256 ГБ", c: "50 Мп", d: "190 г" },
  { slug: "honor-x8e", name: "Смартфон Honor X8e 6/128 ГБ", brand: "Honor", category: "smartphones", price: 25990, compareAtPrice: 28990, stock: 7, day: 88, note: "Экран 6,7 дюйма, память 128 ГБ. В ассортименте Mediapark Ташкент.", a: "6,7 дюйма", b: "128 ГБ", c: "108 Мп", d: "185 г" },
  { slug: "realme-16-5g", name: "Смартфон Realme 16 5G 8/256 ГБ", brand: "Realme", category: "smartphones", price: 45990, stock: 5, day: 86, note: "Экран 6,67 дюйма, 5G, память 256 ГБ. Новинка витрин Ташкента.", a: "6,67 дюйма", b: "256 ГБ", c: "50 Мп", d: "188 г" },
  { slug: "vivo-v80-lite", name: "Смартфон Vivo V80 Lite 6/256 ГБ", brand: "Vivo", category: "smartphones", price: 41990, stock: 6, day: 84, note: "Экран 6,67 дюйма, память 256 ГБ. Продаётся через Mediapark и Alif Shop.", a: "6,67 дюйма", b: "256 ГБ", c: "50 Мп", d: "186 г" },
  { slug: "oppo-a6s", name: "Смартфон Oppo A6s 8/256 ГБ", brand: "Oppo", category: "smartphones", price: 35990, compareAtPrice: 39990, stock: 4, day: 80, note: "Экран 6,67 дюйма, память 256 ГБ. Есть в каталоге Mediapark Ташкент.", a: "6,67 дюйма", b: "256 ГБ", c: "50 Мп", d: "187 г" },

  // планшеты
  { slug: "samsung-tab-a9", name: "Планшет Samsung Galaxy Tab A9 8/128 ГБ", brand: "Samsung", category: "tablets", price: 18990, stock: 8, day: 78, note: "Экран 8,7 дюйма, память 128 ГБ. Доступен в магазинах Ташкента.", a: "8,7 дюйма", b: "128 ГБ", c: "8 Мп", d: "332 г" },
  { slug: "xiaomi-redmi-pad-se", name: "Планшет Xiaomi Redmi Pad SE 8/256 ГБ", brand: "Xiaomi", category: "tablets", price: 22990, compareAtPrice: 25990, stock: 6, day: 76, note: "Экран 11 дюймов, память 256 ГБ. В Xiaomi Store и Mediapark.", a: "11 дюймов", b: "256 ГБ", c: "8 Мп", d: "478 г" },
  { slug: "honor-pad-x8a", name: "Планшет Honor Pad X8a 4/128 ГБ", brand: "Honor", category: "tablets", price: 16990, stock: 5, day: 74, note: "Экран 11 дюймов, память 128 ГБ. Продаётся в Ташкенте.", a: "11 дюймов", b: "128 ГБ", c: "5 Мп", d: "490 г" },
  { slug: "samsung-tab-s9-fe", name: "Планшет Samsung Galaxy Tab S9 FE 8/256 ГБ", brand: "Samsung", category: "tablets", price: 44990, stock: 3, day: 72, note: "Экран 10,9 дюйма, память 256 ГБ. Официальные поставки в Узбекистан.", a: "10,9 дюйма", b: "256 ГБ", c: "12 Мп", d: "523 г" },

  // часы
  { slug: "xiaomi-watch-2", name: "Часы Xiaomi Watch 2", brand: "Xiaomi", category: "watches", price: 14990, stock: 10, day: 70, note: "Корпус 46 мм, GPS. Есть в Xiaomi Store Ташкент.", a: "46 мм", b: "Силикон", c: "до 5 дней", d: "35 г" },
  { slug: "samsung-watch-fe", name: "Часы Samsung Galaxy Watch FE", brand: "Samsung", category: "watches", price: 18990, compareAtPrice: 21990, stock: 4, day: 68, note: "Корпус 40 мм. Продаётся в Mediapark и Samsung-точках Ташкента.", a: "40 мм", b: "Силикон", c: "до 40 часов", d: "27 г" },
  { slug: "amazfit-bip-5", name: "Часы Amazfit Bip 5", brand: "Amazfit", category: "watches", price: 7990, stock: 11, day: 66, note: "Корпус 46 мм. Популярная модель на рынках Ташкента.", a: "46 мм", b: "Силикон", c: "до 10 дней", d: "26 г" },
  { slug: "honor-watch-gs3", name: "Часы Honor Watch GS 3", brand: "Honor", category: "watches", price: 12990, stock: 7, day: 64, note: "Корпус 46 мм. Есть в витринах Honor и Mediapark.", a: "46 мм", b: "Силикон", c: "до 14 дней", d: "35 г" },

  // наушники
  { slug: "samsung-buds-fe", name: "Наушники Samsung Galaxy Buds FE", brand: "Samsung", category: "headphones", price: 8990, stock: 12, day: 62, note: "Вкладыши с шумоподавлением. Продаются в Ташкенте.", a: "Вкладыши", b: "до 6 часов", c: "Bluetooth", d: "5,6 г" },
  { slug: "xiaomi-buds-5", name: "Наушники Xiaomi Buds 5", brand: "Xiaomi", category: "headphones", price: 9990, compareAtPrice: 11990, stock: 8, day: 60, note: "Вкладыши, ANC. В ассортименте Xiaomi Store Ташкент.", a: "Вкладыши", b: "до 6 часов", c: "Bluetooth", d: "4,9 г" },
  { slug: "jbl-tune-520bt", name: "Наушники JBL Tune 520BT", brand: "JBL", category: "headphones", price: 5990, stock: 9, day: 58, note: "Накладные, до 57 часов. Есть в Mediapark и Texnomart.", a: "Накладные", b: "до 57 часов", c: "Bluetooth", d: "157 г" },
  { slug: "honor-earbuds-x6", name: "Наушники Honor Earbuds X6", brand: "Honor", category: "headphones", price: 4990, stock: 10, day: 56, note: "Вкладыши. Модель из каталогов Ташкента.", a: "Вкладыши", b: "до 5 часов", c: "Bluetooth", d: "4,5 г" },

  // ноутбуки
  { slug: "lenovo-ideapad-slim-3", name: "Ноутбук Lenovo IdeaPad Slim 3 15", brand: "Lenovo", category: "laptops", price: 54990, stock: 0, day: 54, note: "Экран 15,6 дюйма, 16 ГБ. Типичная модель витрин Ташкента.", a: "15,6 дюйма", b: "16 ГБ", c: "512 ГБ", d: "1,6 кг" },
  { slug: "asus-vivobook-15", name: "Ноутбук ASUS VivoBook 15", brand: "ASUS", category: "laptops", price: 59990, compareAtPrice: 64990, stock: 4, day: 52, note: "Экран 15,6 дюйма, 16 ГБ. Есть в Mediapark и компьютерных салонах.", a: "15,6 дюйма", b: "16 ГБ", c: "512 ГБ", d: "1,7 кг" },
  { slug: "hp-15s", name: "Ноутбук HP 15s", brand: "HP", category: "laptops", price: 52990, stock: 5, day: 50, note: "Экран 15,6 дюйма, 8 ГБ. Постоянно в продаже в Ташкенте.", a: "15,6 дюйма", b: "8 ГБ", c: "512 ГБ", d: "1,7 кг" },
  { slug: "acer-aspire-3", name: "Ноутбук Acer Aspire 3", brand: "Acer", category: "laptops", price: 47990, stock: 6, day: 48, note: "Экран 15,6 дюйма, 8 ГБ. Есть в Texnomart и Mediapark.", a: "15,6 дюйма", b: "8 ГБ", c: "256 ГБ", d: "1,8 кг" },

  // мониторы
  { slug: "samsung-odyssey-g3", name: "Монитор Samsung Odyssey G3 27", brand: "Samsung", category: "monitors", price: 24990, stock: 5, day: 46, note: "27 дюймов, 165 Гц. Продаётся в Ташкенте.", a: "27 дюймов", b: "VA", c: "1920×1080", d: "165 Гц" },
  { slug: "lg-24mr400", name: "Монитор LG 24MR400", brand: "LG", category: "monitors", price: 12990, compareAtPrice: 14990, stock: 8, day: 44, note: "24 дюйма, IPS. Есть в магазинах электроники Ташкента.", a: "24 дюйма", b: "IPS", c: "1920×1080", d: "100 Гц" },
  { slug: "xiaomi-monitor-a22i", name: "Монитор Xiaomi A22i", brand: "Xiaomi", category: "monitors", price: 9990, stock: 7, day: 42, note: "21,45 дюйма. В Xiaomi Store Ташкент.", a: "21,45 дюйма", b: "IPS", c: "1920×1080", d: "75 Гц" },
  { slug: "asus-va24ehe", name: "Монитор ASUS VA24EHE", brand: "ASUS", category: "monitors", price: 13990, stock: 4, day: 40, note: "23,8 дюйма, IPS. Доступен в Ташкенте.", a: "23,8 дюйма", b: "IPS", c: "1920×1080", d: "75 Гц" },

  // телевизоры
  { slug: "samsung-ue55-crystal", name: "Телевизор Samsung Crystal UHD 55", brand: "Samsung", category: "tvs", price: 57990, compareAtPrice: 69990, stock: 0, day: 98, note: "Диагональ 55 дюймов, 4K. Акция Mediapark Ташкент.", a: "55 дюймов", b: "4K", c: "3 HDMI", d: "60 Гц" },
  { slug: "artel-43f", name: "Телевизор Artel 43F", brand: "Artel", category: "tvs", price: 28990, stock: 6, day: 38, note: "Диагональ 43 дюйма. Узбекский бренд, точки по Ташкенту.", a: "43 дюйма", b: "Full HD", c: "3 HDMI", d: "60 Гц" },
  { slug: "tcl-50p635", name: "Телевизор TCL 50P635", brand: "TCL", category: "tvs", price: 34990, stock: 5, day: 36, note: "Диагональ 50 дюймов, 4K. Есть в Mediapark и Texnomart.", a: "50 дюймов", b: "4K", c: "3 HDMI", d: "60 Гц" },
  { slug: "lg-43uq75006", name: "Телевизор LG UQ75 43", brand: "LG", category: "tvs", price: 39990, stock: 4, day: 34, note: "Диагональ 43 дюйма, 4K. Официальные поставки в Узбекистан.", a: "43 дюйма", b: "4K", c: "3 HDMI", d: "60 Гц" },
  { slug: "xiaomi-tv-a-55", name: "Телевизор Xiaomi TV A 55", brand: "Xiaomi", category: "tvs", price: 42990, compareAtPrice: 47990, stock: 3, day: 32, note: "Диагональ 55 дюймов, 4K. В Xiaomi Store Ташкент.", a: "55 дюймов", b: "4K", c: "3 HDMI", d: "60 Гц" },

  // саундбары
  { slug: "samsung-hw-b450", name: "Саундбар Samsung HW-B450", brand: "Samsung", category: "soundbars", price: 17990, stock: 5, day: 30, note: "2.1 канала. Продаётся в Mediapark Ташкент.", a: "2.1", b: "200 Вт", c: "HDMI", d: "86 см" },
  { slug: "jbl-bar-20", name: "Саундбар JBL Bar 2.0 Deep Bass", brand: "JBL", category: "soundbars", price: 15990, stock: 6, day: 28, note: "2.0 канала. Есть в магазинах Ташкента.", a: "2.0", b: "100 Вт", c: "Bluetooth", d: "61 см" },
  { slug: "lg-s40t", name: "Саундбар LG S40T", brand: "LG", category: "soundbars", price: 19990, compareAtPrice: 22990, stock: 3, day: 26, note: "2.1 канала. Доступен в Ташкенте.", a: "2.1", b: "300 Вт", c: "HDMI", d: "89 см" },

  // холодильники
  { slug: "artel-hd-345", name: "Холодильник Artel HD 345", brand: "Artel", category: "fridges", price: 44990, stock: 0, day: 94, note: "Объём около 345 л. Artel производится и продаётся в Узбекистане.", a: "345 л", b: "186 см", c: "60 см", d: "No Frost" },
  { slug: "samsung-rb33", name: "Холодильник Samsung RB33", brand: "Samsung", category: "fridges", price: 69990, compareAtPrice: 75990, stock: 2, day: 24, note: "Объём около 328 л. Есть в Mediapark Ташкент.", a: "328 л", b: "185 см", c: "60 см", d: "No Frost" },
  { slug: "shivaki-hd-339", name: "Холодильник Shivaki HD-339FN", brand: "Shivaki", category: "fridges", price: 39990, stock: 4, day: 22, note: "Объём около 339 л. Популярный бренд на рынке Ташкента.", a: "339 л", b: "185 см", c: "60 см", d: "No Frost" },
  { slug: "lg-ga-b459", name: "Холодильник LG GA-B459", brand: "LG", category: "fridges", price: 74990, stock: 2, day: 20, note: "Объём около 341 л. Официальные поставки в Узбекистан.", a: "341 л", b: "186 см", c: "60 см", d: "No Frost" },
  { slug: "indesit-ds-320", name: "Холодильник Indesit DS 320", brand: "Indesit", category: "fridges", price: 36990, stock: 5, day: 18, note: "Объём около 320 л. Есть в Texnomart Ташкент.", a: "320 л", b: "175 см", c: "60 см", d: "капельная" },

  // стиральные
  { slug: "artel-se65", name: "Стиральная машина Artel SE65", brand: "Artel", category: "washers", price: 28990, stock: 5, day: 16, note: "Загрузка 6,5 кг. Узбекский бренд, точки по Ташкенту.", a: "6,5 кг", b: "1000 об/мин", c: "85 см", d: "60 см" },
  { slug: "lg-f2j3ns0w", name: "Стиральная машина LG F2J3NS0W", brand: "LG", category: "washers", price: 42990, compareAtPrice: 46990, stock: 3, day: 14, note: "Загрузка 7 кг. Продаётся в Mediapark и Texnomart.", a: "7 кг", b: "1200 об/мин", c: "85 см", d: "60 см" },
  { slug: "samsung-ww70", name: "Стиральная машина Samsung WW70", brand: "Samsung", category: "washers", price: 45990, stock: 4, day: 12, note: "Загрузка 7 кг. Есть в магазинах Ташкента.", a: "7 кг", b: "1200 об/мин", c: "85 см", d: "60 см" },
  { slug: "beko-wue6512", name: "Стиральная машина Beko WUE 6512", brand: "Beko", category: "washers", price: 31990, stock: 6, day: 10, note: "Загрузка 6 кг. Постоянно в продаже в Ташкенте.", a: "6 кг", b: "1000 об/мин", c: "84 см", d: "60 см" },

  // кондиционеры
  { slug: "artel-shahrisabz-12", name: "Кондиционер Artel Shahrisabz 12 Inverter", brand: "Artel", category: "conditioners", price: 32990, compareAtPrice: 37990, stock: 4, day: 90, note: "На комнату до 35 м². Акция Mediapark Ташкент.", a: "до 35 м²", b: "3,5 кВт", c: "инвертор", d: "28 дБ" },
  { slug: "gree-fairy-12", name: "Кондиционер Gree Fairy 12 Inverter", brand: "Gree", category: "conditioners", price: 44990, stock: 3, day: 8, note: "На комнату до 35 м². Есть в каталоге Mediapark.", a: "до 35 м²", b: "3,5 кВт", c: "инвертор", d: "26 дБ" },
  { slug: "lg-wz12awn", name: "Кондиционер LG WZ12AWN Inverter Pro", brand: "LG", category: "conditioners", price: 40990, compareAtPrice: 46990, stock: 3, day: 6, note: "На комнату до 35 м². Акция витрин Ташкента.", a: "до 35 м²", b: "3,5 кВт", c: "инвертор", d: "25 дБ" },
  { slug: "avalon-brugge-12", name: "Кондиционер Avalon Brugge 12 Inverter", brand: "Avalon", category: "conditioners", price: 47990, stock: 2, day: 4, note: "На комнату до 35 м². Модель из каталога Mediapark.", a: "до 35 м²", b: "3,5 кВт", c: "инвертор", d: "27 дБ" },
  { slug: "samsung-ar09", name: "Кондиционер Samsung AR09", brand: "Samsung", category: "conditioners", price: 38990, stock: 4, day: 2, note: "На комнату до 25 м². Есть в магазинах Ташкента.", a: "до 25 м²", b: "2,5 кВт", c: "инвертор", d: "26 дБ" },

  // пылесосы
  { slug: "xiaomi-robot-s10", name: "Робот-пылесос Xiaomi Robot Vacuum S10", brand: "Xiaomi", category: "vacuums", price: 24990, stock: 0, day: 91, note: "Сухая и влажная уборка. Xiaomi Store Ташкент.", a: "0,45 л", b: "130 мин", c: "робот", d: "3,6 кг" },
  { slug: "samsung-jet-60", name: "Пылесос Samsung Jet 60", brand: "Samsung", category: "vacuums", price: 28990, stock: 5, day: 45, note: "Беспроводной. Продаётся в Mediapark Ташкент.", a: "0,8 л", b: "40 мин", c: "беспроводной", d: "2,3 кг" },
  { slug: "artel-vcc-0220", name: "Пылесос Artel VCC 0220", brand: "Artel", category: "vacuums", price: 14990, stock: 7, day: 43, note: "С мешком. Узбекский бренд, точки по Ташкенту.", a: "3 л", b: "сетевой", c: "мешковый", d: "4,5 кг" },
  { slug: "xiaomi-vacuum-g20", name: "Пылесос Xiaomi Vacuum Cleaner G20", brand: "Xiaomi", category: "vacuums", price: 19990, compareAtPrice: 22990, stock: 6, day: 41, note: "Беспроводной. Есть в Xiaomi Store Ташкент.", a: "0,6 л", b: "45 мин", c: "беспроводной", d: "1,5 кг" },

  // чайники
  { slug: "xiaomi-kettle-2", name: "Чайник Xiaomi Electric Kettle 2", brand: "Xiaomi", category: "kettles", price: 3490, stock: 12, day: 39, note: "Объём 1,7 л. Xiaomi Store и Mediapark Ташкент.", a: "1,7 л", b: "1800 Вт", c: "металл", d: "скрытый нагрев" },
  { slug: "artel-ke-1700", name: "Чайник Artel KE-1700", brand: "Artel", category: "kettles", price: 2490, compareAtPrice: 2990, stock: 11, day: 37, note: "Объём 1,7 л. Узбекский бренд.", a: "1,7 л", b: "2200 Вт", c: "металл", d: "скрытый нагрев" },
  { slug: "philips-hd9306", name: "Чайник Philips HD9306", brand: "Philips", category: "kettles", price: 3990, stock: 9, day: 35, note: "Объём 1,5 л. Есть в Texnomart Ташкент.", a: "1,5 л", b: "2200 Вт", c: "металл", d: "скрытый нагрев" },

  // аэрогрили
  { slug: "xiaomi-dual-zone-12", name: "Аэрогриль Xiaomi Dual Zone Air Fryer 12L", brand: "Xiaomi", category: "airfryers", price: 19990, stock: 5, day: 96, note: "Две зоны, 12 л. Новинка витрин Mediapark Ташкент.", a: "12 л", b: "1700 Вт", c: "2 чаши", d: "сенсор" },
  { slug: "xiaomi-air-fryer-65", name: "Аэрогриль Xiaomi Smart Air Fryer 6.5L", brand: "Xiaomi", category: "airfryers", price: 12990, compareAtPrice: 14990, stock: 7, day: 33, note: "Чаша 6,5 л. Xiaomi Store Ташкент.", a: "6,5 л", b: "1800 Вт", c: "1 чаша", d: "приложение" },
  { slug: "artel-af-450", name: "Аэрогриль Artel AF-450", brand: "Artel", category: "airfryers", price: 8990, stock: 8, day: 31, note: "Чаша 4,5 л. Узбекский бренд, точки по Ташкенту.", a: "4,5 л", b: "1500 Вт", c: "1 чаша", d: "механическое" },
];

function createdAt(day: number) {
  const date = new Date(Date.UTC(2026, 0, 1));
  date.setUTCDate(date.getUTCDate() + day);
  return date.toISOString();
}

function productImages(slug: string) {
  const base = `/products/${slug}.jpg`;
  return [base, base, base];
}

function specRows(item: Draft): [string, string, string][] {
  const common: [string, string, string][] = [
    ["Основное", "Бренд", item.brand],
    ["Основное", "Гарантия", "12 месяцев"],
  ];
  if (item.category === "smartphones" || item.category === "tablets") {
    return [
      ...common,
      ["Память и экран", "Экран", item.a],
      ["Память и экран", "Память", item.b],
      ["Память и экран", "Камера", item.c],
      ["Основное", "Вес", item.d],
    ];
  }
  if (item.category === "watches") {
    return [
      ...common,
      ["Основное", "Корпус", item.a],
      ["Основное", "Ремешок", item.b],
      ["Основное", "Батарея", item.c],
      ["Основное", "Вес", item.d],
    ];
  }
  if (item.category === "headphones") {
    return [
      ...common,
      ["Основное", "Тип", item.a],
      ["Основное", "Автономность", item.b],
      ["Основное", "Подключение", item.c],
      ["Габариты", "Вес", item.d],
    ];
  }
  if (item.category === "soundbars") {
    return [
      ...common,
      ["Основное", "Каналы", item.a],
      ["Основное", "Мощность", item.b],
      ["Основное", "Подключение", item.c],
      ["Габариты", "Длина", item.d],
    ];
  }
  if (item.category === "laptops") {
    return [
      ...common,
      ["Память и экран", "Экран", item.a],
      ["Память и экран", "Память", item.b],
      ["Память и экран", "Накопитель", item.c],
      ["Основное", "Вес", item.d],
    ];
  }
  if (item.category === "monitors") {
    return [
      ...common,
      ["Память и экран", "Экран", item.a],
      ["Память и экран", "Матрица", item.b],
      ["Память и экран", "Разрешение", item.c],
      ["Основное", "Частота", item.d],
    ];
  }
  if (item.category === "tvs") {
    return [
      ...common,
      ["Память и экран", "Экран", item.a],
      ["Память и экран", "Разрешение", item.b],
      ["Основное", "Порты", item.c],
      ["Основное", "Частота", item.d],
    ];
  }
  const sizeLabels: Record<string, [string, string, string, string]> = {
    fridges: ["Объём", "Высота", "Ширина", "Охлаждение"],
    washers: ["Загрузка", "Отжим", "Высота", "Ширина"],
    conditioners: ["Площадь", "Мощность", "Тип", "Шум"],
    vacuums: ["Контейнер", "Время работы", "Тип", "Вес"],
    kettles: ["Объём", "Мощность", "Колба", "Нагрев"],
    airfryers: ["Чаша", "Мощность", "Чаши", "Управление"],
  };
  const labels = sizeLabels[item.category] ?? ["Параметр", "Параметр", "Тип", "Дополнительно"];
  return [
    ...common,
    ["Габариты", labels[0], item.a],
    ["Габариты", labels[1], item.b],
    ["Основное", labels[2], item.c],
    ["Основное", labels[3], item.d],
  ];
}

export const seedCategories = categories;
export const seedProductSlugs = drafts.map((item) => item.slug);

export function createSeed(passwordHash: string): Omit<ShopData, "guestId"> {
  const products: Product[] = drafts.map((item) => {
    const category = categories.find((entry) => entry.slug === item.category);
    if (!category) throw new Error(`Нет категории ${item.category}`);
    return {
      id: `p-${item.slug}`,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      description: item.note,
      price: item.price,
      compareAtPrice: item.compareAtPrice ?? null,
      stock: item.stock,
      categoryId: category.id,
      published: true,
      createdAt: createdAt(item.day),
      images: productImages(item.slug),
    };
  });

  const specs: ProductSpec[] = drafts.flatMap((item) =>
    specRows(item).map((row, sort) => ({
      id: `p-${item.slug}-spec-${sort}`,
      productId: `p-${item.slug}`,
      group: row[0],
      name: row[1],
      value: row[2],
      sort,
    })),
  );

  const banners: Banner[] = [
    {
      id: "banner-hero",
      slot: "hero",
      title: "Техника из Ташкента",
      subtitle: "Samsung, Xiaomi, Artel и Honor. Модели с витрин Mediapark.",
      href: "/catalog",
      imageUrl: "/banners/hero.jpg",
      enabled: true,
    },
    {
      id: "banner-side-top",
      slot: "side-top",
      title: "Смартфоны",
      subtitle: "Galaxy A18, Redmi Note 17, Honor X8e.",
      href: "/catalog/smartphones",
      imageUrl: "/banners/side-top.jpg",
      enabled: true,
    },
    {
      id: "banner-side-bottom",
      slot: "side-bottom",
      title: "Крупная техника",
      subtitle: "Artel, Samsung и кондиционеры Gree.",
      href: "/catalog/appliances",
      imageUrl: "/banners/side-bottom.jpg",
      enabled: true,
    },
  ];

  return {
    users: [
      {
        id: "user-admin",
        email: demoAdminEmail,
        name: "Администратор",
        passwordHash,
        image: null,
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    categories,
    products,
    specs,
    banners,
    carts: [],
    cartItems: [],
    orders: [],
    orderItems: [],
    loginAttempts: [],
    compareIds: [],
  };
}
