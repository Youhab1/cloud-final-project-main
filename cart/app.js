const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = 3700;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect('mongodb://inventory-mongodb:27017/inventorydb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to inventory MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to inventory MongoDB:', error);
    process.exit(1);
  });

// Create a Product schema
const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  category: String,
  type: String,
  price: Number,
  details: String,
  metal: String,
  grams: String,
  photo: String 
});

// Create a Product model
const Product = mongoose.model('Product', productSchema);

let cartItems = [];

// Add CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Add item to cart
app.post('/cart/addtocart', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ error: 'Invalid request. Please provide productId.' });
  }

  const item = await Product.findOne({ id: id });
  if (!item) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  cartItems.push(item.id);
  res.json({ message: 'Item added to cart successfully.' });
});

// Remove item from cart
app.post('/cart/removefromcart', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ error: 'Invalid request. Please provide productId.' });
  }

  const index = cartItems.findIndex((itemId) => itemId === id);
  if (index !== -1) {
    cartItems.splice(index, 1);
    return res.json({ message: 'Item removed from cart successfully.' });
  }

  res.json({ message: 'Item not found in the cart.' });
});

// Get cart items
app.get('/cart/cartlist', async (req, res) => {
  try {
    const items = [];
    for (const itemId of cartItems) {
      const item = await Product.findOne({ id: itemId });
      if (item) {
        items.push(item);
      }
    }
    const total = calculateTotalPrice(items);
    res.json({
      cartItems: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price
      })),
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving cart items.' });
  }
});

// Checkout endpoint
app.post('/cart/checkout', (req, res) => {
  const { cartItems } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'No items in the cart.' });
  }

  const totalPrice = calculateTotalPrice(cartItems);

  const order = {
    items: cartItems,
    totalPrice,
    paymentMethod: 'Cash on Delivery',
    orderNumber: generateOrderNumber()
  };

  res.json({ message: 'Checkout processed successfully.', order });
});

// Helper function to calculate total price
function calculateTotalPrice(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}

// Helper function to generate order number
function generateOrderNumber() {
  return Math.floor(Math.random() * 1000000);
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
