import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import nodemailer from "nodemailer"; // Import nodemailer
import Stripe from "stripe"; // Use ES module import
const stripe = new Stripe(process.env.STRIPE_KEY);

export default async function handler(req, res) {
  // Ensure it's a POST request
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Should be a POST request" });
  }

  // Destructure request body
  const { email, name, address, city, country, zip, cartProducts } = req.body;

  // Connect to MongoDB
  await mongooseConnect();

  // Fetch unique product IDs and product info
  const uniqueIds = [...new Set(cartProducts)];
  const productsInfo = await Product.find({ _id: uniqueIds });

  const line_items = uniqueIds.map(productId => {
    const productInfo = productsInfo.find(p => p._id.toString() === productId);
    const quantity = cartProducts.filter(id => id === productId).length;

    if (quantity > 0 && productInfo) {
      return {
        quantity,
        price_data: {
          currency: "inr",
          product_data: { name: productInfo.title },
          unit_amount: productInfo.price * 100, // Convert to smallest currency unit
        },
      };
    }
  }).filter(item => item); // Remove undefined items

  // Create the order document
  const orderDoc = await Order.create({
    line_items,
    email,
    name,
    address,
    city,
    country,
    zip,
    paid: false,
  });

  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    customer_email: email,
    success_url: `${process.env.SUCCESS_URL}/cart?success=1`,
    cancel_url: `${process.env.SUCCESS_URL}/cart?canceled=1`,
    metadata: { orderId: orderDoc._id.toString() },
  });

  // Don't mark the order as paid until payment confirmation is received
  // Order update can be done in a webhook handler after payment confirmation.

  // Build order details for the email
  const orderDetails = line_items.map(item => {
    const { price_data, quantity } = item;
    const totalItemPrice = (price_data.unit_amount / 100) * quantity; // Convert price back to currency
    return `
      <p>Product: ${price_data.product_data.name}</p>
      <p>Price: ₹${(price_data.unit_amount / 100).toFixed(2)}</p>
      <p>Quantity: ${quantity}</p>
      <p>Total: ₹${totalItemPrice.toFixed(2)}</p><hr>`;
  }).join("");

  // Setup Nodemailer transport
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Order Confirmation",
    html: `
      <p>Dear ${name},</p>
      <p>Thank you for your purchase! Your order has been successfully received.</p>
      <p><strong>Order Summary:</strong></p>
      ${orderDetails}
      <p>We are processing it and will update you once it's shipped.</p>
      <p>Best regards,<br/>Your Company</p>`,
  };

  // Send email and handle errors
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }

  // Respond with the session URL
  return res.json({ url: session.url });
}
