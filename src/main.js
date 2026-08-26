/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount = purchase.discount;
   const sale_price = purchase.sale_price;
   const quantity = purchase.quantity;
   let des_discount = discount / 100;
   let full_price = sale_price * quantity;
   return (full_price * (1 - des_discount));
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const profit  = seller.profit;
    if (index === 0){
        return (profit*15)/100;
    } else if (index === 1 || index === 2){
        return (profit*10)/100;
    } else if (index === total - 1){
        return (profit*0)/100;
    } else {
        return (profit*5)/100;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers) 
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные'); 
    }


    const { calculateRevenue, calculateBonus } = options;
    //const calculateRevenue = options.calculateRevenue;
    //const calculateBonus = options.calculateBonus;


    // @TODO: Проверка наличия опций
    //const { calculateRevenue, calculateBonus } = options;
    if (!(typeof calculateRevenue === "function") || !(typeof calculateBonus === "function")) {
        throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
    // Заполним начальными данными
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
         products_sold: {}
    }));
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));

    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));
    //console.log(productIndex)//

    
    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж 
        seller.sales_count += 1; //!//
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            let cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            let revenue = calculateRevenue(item);
            // Посчитать прибыль: выручка минус себестоимость
            let cash = revenue - cost;
        // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.profit += cash;
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;
        });
        
    });
  
    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => {
    if (a.profit > b.profit) {
        return -1;
    }
    if (a.profit < b.profit) {
        return 1;
    }
    return 0;
    })
    

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller)// Считаем бонус
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);// Формируем топ-10 товаров
    });


    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: Number(seller.revenue.toFixed(2)),// Число с двумя знаками после точки, выручка продавца
        profit: Number(seller.profit.toFixed(2)),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: Number(seller.bonus.toFixed(2)),// Число с двумя знаками после точки, бонус продавца
        }));
}
