# 🛒 NextShop - Backend API

A robust, scalable, and secure RESTful API built with Node.js, Express.js, and MongoDB, serving as the backend for the NextShop e-commerce platform. Designed with performance, security, and maintainability in mind.

🔗 **Frontend Repository:** [NextShop-Fullstack](https://github.com/zeiadkh/NextShop-Fullstack)  
🌐 **Live API:** *(Add your Render/Vercel backend URL here if deployed, otherwise remove this line)*

## ✨ Key Features
- **Secure Authentication:** JWT-based authentication with Role-Based Access Control (RBAC) for users and admins.
- **Payment Processing:** Secure Stripe integration for handling checkout sessions, webhooks, and order finalization.
- **Database Optimization:** Advanced MongoDB schema design with strategic indexing and URL-based pagination for fast catalog retrieval, even at scale.
- **Order & Cart Management:** Comprehensive API endpoints for cart operations, coupon validation, and order lifecycle tracking.
- **Media Handling:** Secure file uploads integrated with Cloudinary for product images.

## 🛠️ Tech Stack
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcryptjs
- **Integrations:** Stripe API, Cloudinary, Nodemailer
- **Tools:** Postman, dotenv, cors, helmet

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zeiadkh/NextShop-Backend.git
   cd NextShop-Backend
2. **Install dependencies:**
   ```bash
   npm install
3. **Set up environment variables**
   Create a .env file in the root directory and add the following (replace with your actual keys):
   ```bash
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
4. **Run the development server:**
   ```bash
   npm run dev
  The API will be available at http://localhost:5000. 

📂 API Documentation
  View API Documentation on Postman using the .postman_collection.json file added

🤝 Contributing
   This is a portfolio project, but the code is structured to reflect production best practices, including error-handling middleware,    controller/service separation, and input validation.


