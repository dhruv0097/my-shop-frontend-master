import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import nodemailer from 'nodemailer'; // Import nodemailer
const stripe = require('stripe')(process.env.STRIPE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.json('Should be a POST request');
    return;
  }

  const { email, name, address, city, country, zip, cartProducts } = req.body;

  await mongooseConnect();

  const productIds = cartProducts;
  const uniqueIds = [...new Set(productIds)];
  const productsInfo = await Product.find({ _id: uniqueIds });

  let line_items = [];

  for (const productId of uniqueIds) {
    const productInfo = productsInfo.find(p => p._id.toString() === productId);
    const quantity = productIds.filter(id => id === productId).length || 0;

    if (quantity > 0 && productInfo) {
      line_items.push({
        quantity,
        price_data: {
          currency: 'inr',
          product_data: { name: productInfo.title },
          unit_amount: productInfo.price * 100, // Price is multiplied by 100 to convert to smallest currency unit
        },
      });
    }
  }

  // Create the order document but set paid to false initially
  const orderDoc = await Order.create({
    line_items, email, name, address, city, country, zip, paid: false
  });

  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: 'payment',
    customer_email: email,
    success_url: process.env.SUCCESS_URL + '/cart?success=1',
    cancel_url: process.env.SUCCESS_URL + '/cart?canceled=1',
    metadata: { orderId: orderDoc._id.toString() }
  });

  // Mark order as paid (this should ideally be done after payment confirmation)
  orderDoc.paid = true;
  await orderDoc.save();

  // Build order details for the email
  let orderDetails = line_items.map(item => {
    const { price_data, quantity } = item;
    const totalItemPrice = (price_data.unit_amount / 100) * quantity; // Convert price back to currency
    return `
      <p>Product: ${price_data.product_data.name}</p>
      <p>Price: ₹${price_data.unit_amount / 100}</p>
      <p>Quantity: ${quantity}</p>
      <p>Total: ₹${totalItemPrice}</p><hr>`;
  }).join('');

  // Nodemailer email setup (sending an email after successful payment)
  let transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other email services like SendGrid, etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: email, // Receiver's email address
    subject: 'Order Confirmation', // Subject line
    html: `
      <p>Dear ${name},</p>
      <p>Thank you for your purchase! Your order has been successfully paid.</p>
      <p><strong>Order Summary:</strong></p>
      ${orderDetails}
      <p>We are processing it and will update you once it's shipped.</p>
      <p>Best regards,<br/>Your Company</p>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  res.json({
    url: session.url,
  });
}
