import Cart from "../../../DB/models/cart.model.js";
import Coupon from "../../../DB/models/coupon.model.js";
import Order from "../../../DB/models/order.model.js";
import Product from "../../../DB/models/product.model.js";
import { createInvoice } from "../../utils/createPdfInvoice.js";
import { fileURLToPath } from "url";
import path from "path";
import { unlink } from 'node:fs/promises';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cloudinary from "cloudinary";
import { clearCart, updateStock } from "./order.sevice.js";
import catchError from "../../utils/catchError.js";
import { sendEmail } from "../../utils/sendEmail.js";
import Stripe from "stripe";
const FrontUrl =  "https://next-ecommerce-five-mu.vercel.app"

export const create = async (req, res, next) => {

  let price =0 ;
  const getProducts = [];
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId });
  let fullCoupon;

  const { coupon, address, phone, payment } = req.body;
  // check coupon
  if (coupon) {
    fullCoupon = await Coupon.findOne({
      name: coupon,
      expireAt: { $gt: Date.now() },
    });
    if (!fullCoupon) return next(new Error("Coupon not available"));
  }

  // get products from cart
  if (cart.products.length < 1)
    return next(new Error("No products yet to order"));

  for (let product of cart.products) {
    const fullProduct = await Product.findById(product.productId)
    if (fullProduct.availableItems < product.quantity)
      return next(
        new Error(`there is only ${fullProduct.availableItems} avilable`)
      );
    const productObj = {
      productId: fullProduct._id,
      quantity: product.quantity,
      name: fullProduct.name,
      price: fullProduct.price,
      afterDiscount: fullProduct.finalPrice * product.quantity,
    };
    price += productObj.afterDiscount;
    getProducts.push(productObj);
  }
  // create order
  const order = await Order.create({
    address,
    price,
    phone,
    user: userId,
    products: getProducts,
    coupon: {
      name: fullCoupon?.name,
      discount: fullCoupon?.discount || 0,
      id: fullCoupon?._id,
    },
    ...(payment && {payment})
  });

  // generate invoice
  const pdfPath = path.join(
    __dirname,
    `./../../../tempInvoices/${order._id}.pdf`
  );
  console.log(pdfPath);

  const invoice = {
    shipping: {
      name: req.user.userName,
      address,
    },
    items: order.products,
    totalWithDiscount: order.price,
    invoice_nr: order._id,
    finalPrice: order.finalPrice,
  };

  // invoice upload
  createInvoice(invoice, pdfPath);
  const { secure_url, public_id } = await cloudinary.v2.uploader.upload(
    pdfPath,
    { folder: `${process.env.CLOUD_FOLDER}/order/${userId}/invoices` }
  );

  order.invoice.url = secure_url;
  order.invoice.id = public_id;
  await order.save();
  
  // delete tempinvoice
try {
  await unlink(pdfPath);
  // console.log('successfully deleted /tmp/hello');
} catch (error) {
  console.error('there was an error:', error.message);
}

catchError(updateStock(order.products, true));

//send mail
sendEmail({
  to: req.user.email,
  subject: `Order ${order._id}`,
  attachments: [{path: secure_url, contentType: 'application/pdf'}],
});
if(sendEmail) {
    catchError(clearCart(userId));

}

// payment
if(order.payment == "visa"){
  const stripe = new Stripe(process.env.STRIPE_KEY);
  let getCoupon;
  if(order.coupon.name){
    getCoupon = await stripe.coupons.create({
      percent_off: order.coupon.discount,
      duration: "once"
    })
  }
  
  const lineItems = [];
  
  for (let product of order.products) {
    const productData = await Product.findById(product.productId);
    const lineItem = {
      price_data: {
        currency: "EGP",
        product_data: {
          name: productData.name,
          images: [productData.defaultImg.url]
        },
        unit_amount: product.price * 100,
      },
      quantity: product.quantity,
    };
    
    lineItems.push(lineItem);
  }
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    metadata: {orderId: order._id.toString()},
    success_url: `${FrontUrl}/order/successfull-payment`,
    cancel_url: `${FrontUrl}/order/failed-payment`,
    line_items: lineItems,
    ...(getCoupon && {discounts: [{coupon: getCoupon.id}]})
  });
  if(session) {
    return res.json({success: true, message: "Go To checkpoint!",result: session.url})
  }
  }
  return res.json({
    success: true,
    message: "Order Created Succesfully🥳, Cash On Delivery.",
    result: order,
  });
};


export const cancelOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if(!order) return next(new Error("order not found"));
  if(! req.user.id === order.user) return next(new Error("Not authorized to cancel this order", {cause: 401}));
  if(["shipped", "delivered", "refunded", "canceled", "paid",].includes(order.status)) return next(new Error("can't cancel this order!"))
  order.status = 'canceled';
  await order.save()
  updateStock(order.products, false)
  return res.json({success: true, message:"order cancelled"})
}

export const webHook = async (request, response) => {
  const stripe = new Stripe(process.env.STRIPE_KEY)
  const sig = request.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.END_POINT_KEY);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    console.log(err)
    return;
  }

  // Handle the event
  const orderId = event.data.object.metadata.orderId;
  if (event.type == 'checkout.session.completed') {
    catchError(clearCart(userId));
    await Order.findOneAndUpdate({_id: orderId}, {status: 'paid'})
    return;
  }
  await Order.findOneAndUpdate({_id: orderId}, {status: 'paid failed'})
  return

}