const formatProduct = (product) => {
    if (!product) return product;

    return {
        ...product,
        price: Number(product.price),
        store: product.store ? formatStore(product.store) : product.store,
    };
};

const formatStore = (store) => {
    if (!store) return store;

    return {
        ...store,
        products: store.products ? store.products.map(formatProduct) : undefined,
    };
};

module.exports = { formatProduct, formatStore };