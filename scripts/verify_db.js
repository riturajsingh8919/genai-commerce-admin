require('dotenv').config({ path: '.env.local' });
const { getAllProducts } = require('./src/lib/db/products.js');

async function verify() {
  try {
    const products = await getAllProducts();
    console.log(`Successfully fetched ${products.length} products from the new tables!`);
    console.log('Sample product:', products[0] ? products[0].id : 'None');
  } catch(e) {
    console.error('Verification failed:', e);
  }
}
verify();
