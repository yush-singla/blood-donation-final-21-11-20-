// const express = require('express');
// const bodyParser = require('body-parser');
// const app = express();
// const ejs = require('ejs');
// const mongoose = require("mongoose");
// const alert = require('alert');
// mongoose.connect("mongodb://localhost:27017/donorsDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
//
//
// console.log(process.env.TWILIO_ACCOUNT_SID);
// console.log(process.env.TWILIO_AUTH_TOKEN);
//
// // app.set("view engine", "ejs");
// //
// // app.use(express.static("public"));
// //
// // app.use(bodyParser.urlencoded({
// //   extended: true
// // }));
// //
// // app.get("/signin", function(req, res) {
// //   res.render("signin", {
// //     pageTitle: "Sign In Page"
// //   });
// // })
// //
// // app.post("/signin",function(req,res){
// //   const ans=req.body;
// //   console.log(ans);
// //   var email=encodeURIComponent(ans.email);
// //   var pass=encodeURIComponent(ans.password);
// //   res.redirect("/home?email="+email+"&pass="+pass);
// // });
// //
// // app.get("/home",function(req,res){
// //   var passedVariable1 = req.query.email;
// //   var passedVariable2 = req.query.pass;
// //   console.log(passedVariable1,passedVariable2);
// //   res.send("done");
// // });
// //
// app.listen(process.env.PORT || 3000, function() {
//   console.log("working on port 3000");
//   var datetime = new Date();
//
// });
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bloodforyou5@gmail.com',
    pass: 'aprsy@12345'
  }
});

var mailOptions = {
  from: 'bloodforyou5@gmail.com',
  to: 'yushsingla@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
