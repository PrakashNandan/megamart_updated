require('dotenv').config();
const express = require('express');
const server = express();
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const JwtStrategy = require('passport-jwt').Strategy;
const cookieParser = require('cookie-parser');
const ExtractJwt = require('passport-jwt').ExtractJwt;
const {createProduct} = require('./controller/Product')
const productsRouter = require('./routes/Product');
const categoriesRouter = require('./routes/Category');
// const brandsRouter = require('./routes/Brand');
const brandsRouter = require('./routes/Brand');
const userRouter = require('./routes/User');
const authRouter = require('./routes/Auth');
const cartRouter = require('./routes/Cart');
const orderRouter = require('./routes/Order');
const { User } = require('./model/User');
const { isAuth, sanitizeUser, cookieExtractor } = require('./services/common');
const path = require('path');

const Port = process.env.PORT || 8080;






// Webhook

// TODO : we will capture actual order after deploying out server live on public url

const endpointSecret = process.env.ENDPOINT_SECRET;

server.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log({paymentIntentSucceeded});
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});






// JWT options
const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET_KEY; // TODO: should not be in code;




// Middlewares
// const corsOptions = {
//   origin: 'http://localhost:3000',  // Allow specific origin (your frontend)
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allowed methods
//   credentials: true,                 // Allow credentials (cookies, authorization headers)
// };

// Apply CORS middleware
server.use(cors());
server.use(express.static(path.resolve(__dirname,'build')));

server.use(
    session({
      secret: process.env.SESSION_KEY,
      resave: false, // don't save session if unmodified
      saveUninitialized: false, // don't create session until something stored
    })
  );

server.use(cookieParser());

server.use(passport.authenticate('session'));


server.use(cors({
    exposedHeaders:['X-Total-Count']
}))


// server.use(express.raw({type: 'application/json'}))
server.use(express.json()); // to parse req.body


server.use('/products', isAuth(), productsRouter.router);
server.use('/categories', isAuth(),categoriesRouter.router);
server.use('/brands',isAuth(), brandsRouter.router);
server.use('/users', isAuth(),userRouter.router);
server.use('/auth', authRouter.router);
server.use('/cart', isAuth(),cartRouter.router);
server.use('/orders',isAuth(), orderRouter.router);


// this line we add to make react router work in case of other routes doesnt match
server.get('*', (req, res) =>
  res.sendFile(path.resolve('build', 'index.html'))
);



// Passport Strategies
passport.use(
    'local',
    new LocalStrategy({usernameField:'email'}, async function (email, password, done) {
      // by default passport uses username
      try {
        const user = await User.findOne({ email: email });
        console.log(email, password, user);
        if (!user) {
          return done(null, false, { message: 'no such user exist' }); // for safety  // done(error,user,info)
        }
        crypto.pbkdf2(
          password,
          user.salt,
          310000,
          32,
          'sha256',
          async function (err, hashedPassword) {
            if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
              return done(null, false, { message: 'invalid credentials' });
            }
            const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET_KEY);
            done(null, {id:user.id, role:user.role,token}); // this lines sends to serializer
          }
        );
      } catch (err) {
        done(err);
      }
    })
  );
  
  passport.use(
    'jwt',
    new JwtStrategy(opts, async function (jwt_payload, done) {
      console.log({ jwt_payload });
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
          return done(null, sanitizeUser(user)); // this calls serializer
        } else {
          return done(null, false);
        }
      } catch (err) {
        return done(err, false);
      }
    })
  );








// this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
  console.log('serialize', user);
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

// this changes session variable req.user when called from authorized request

passport.deserializeUser(function (user, cb) {
  console.log('de-serialize', user);
  process.nextTick(function () {
    return cb(null, user);
  });
});


// Payment

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

server.post("/create-payment-intent", async (req, res) => {
  const { orderId, totalAmount, address } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100,  // Convert amount to paise
      currency: "inr",
      automatic_payment_methods: {
        enabled: true,
      },
      description: 'Your description for the export transaction',
      metadata: {
        orderId
      },
      shipping: {
        name: address.name, // Ensure this is the customer's full name
        address: {
          line1: address.street,          // Street address
          line2: address.line2 || '',    // Optional
          city: address.city,
          state: address.state,
          postal_code: address.pinCode,
          country: 'IN',      // Should be 'IN' for India
        },
        phone: address.phone,             // Include if available
      },
      receipt_email: address.email,       // Customer's email
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send({ error: error.message });
  }
});






main().catch(err=> console.log(err));

// async function main(){
//     await mongoose.connect(process.env.MONGODB_URL);
//     console.log('database connected')
// }

async function main() {
  try {
      await mongoose.connect(process.env.MONGODB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB Atlas');
  } catch (error) {
      console.error('Error connecting to MongoDB Atlas', error);
  }
}



// server.post('/products', createProduct);

// testing


server.listen(Port, ()=>{
    console.log(`server started at ${Port}`);
});
