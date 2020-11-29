// jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const alert = require("alert");
const _ = require('lodash');
// twilio info in 3 lines from here
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

// nodemailer info is here
var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bloodforyou5@gmail.com",
    pass: "aprsy@12345",
  },
});
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/NewDb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
//*******************donor list schema is here below*********************************
const userSchema = {
  name: String,
  bloodGroup: String,
  gender: String,
  dateOfBirth: Date,
  username: String,
  emailAddress: String,
  password: String,
  contactNumber: Number,
  state: String,
  city: String,
  pin: Number,
};
const User = mongoose.model("User", userSchema);
const donorSchema = {
  details: userSchema,
  shareContact: Boolean,
};
const Donor = mongoose.model("Donor", donorSchema);
const receiverSchema = {
  details: userSchema,
  bloodGroup: String,
};
const Receiver = mongoose.model("Receiver", receiverSchema);
const otpSchema = {
  phoneNo: Number,
  otpPhone: Number,
  email: String,
  otpEmail: Number,
};
const Otp = mongoose.model("otp", otpSchema);

function getAge(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
//you can donate to these
var bldGrpChartForDonor={
  "A+":["A+","AB+"],
  "A-":["A+","AB+","AB-","A-"],
  "AB+":["AB+"],
  "AB-":["AB+","AB-"],
  "B+":["B+","AB+"],
  "B-":["B+","AB+","B-","AB-"],
  "O+":["B+","AB+","A+","O+"],
  "O-":["B+","AB+","B-","AB-","A+","O+","O-","A-"],
}

var bldGrpChartForRec={
  "A+":["A+","A-","O+","O-"],
  "A-":["O-","A-"],
  "AB+":["B+","AB+","B-","AB-","A+","O+","O-","A-"],
  "AB-":["B-","AB-","O-","A-"],
  "B+":["B+","O+","B-","O-"],
  "B-":["B-","O-"],
  "O+":["O+","O-"],
  "O-":["O-"],
}

//**********************************************************************

var signedIntoAccount = false;

// GET Request
// Home
app.get("/", function(req, res) {
  currentUser=null;
  res.render("home", {
    pageTitle: "home page",
    signedIntoAccount: signedIntoAccount,
  });
});

// Sign-in
app.get("/signin", function(req, res) {
  res.render("signin", {
    pageTitle: "Sign In Page",

  });
});

// ??
/*
app.get("/delete/:email", function (req, res) {
  const email = req.params.email;
  Person.findOneAndRemove({ email: email }, function (err) {
    Donor.findOneAndRemove({ emailAdress: email }, function (err) {
      Otp.findOneAndRemove({ email: email }, function (err) {
        res.send("wiped out everything");
      });
    });
  });
});
*/

// sign-up page
app.get("/signup", function(req, res) {
  res.render("signup");
});

// Successfull Sign-up page
app.get("/successfulSignUp", function(req, res) {
  // if (currentUser == null) {
  //   alert("Sign In to Continue");
  //   res.redirect("/signin");
  // }
  res.render("signinAfterSignupPage", {
    pageTitle: "Sign In Page",
  });
});

// ??
/*
app.get("/donorreceiverpage", function(req, res) {
  // if (currentUser == null) {
  //   alert("Sign In to Continue");
  //   res.redirect("/signin");
  // }
  Otp.deleteMany({}, function(err) {
    res.render("donorReceiverPage", {
      pageTitle: "welcome",
    });
  });
});
*/
// about US
app.get("/aboutus", function(req, res) {
  res.render("AboutTeam", {
    pageTitle: "about us",
    signedIntoAccount: signedIntoAccount,
    username: "",
  });
});
app.get("/homeAfterSignIn", function(req, res) {
  if (currentUser == null) {
    alert("Sign In to Continue");
    res.redirect("/signin");
  }
  res.render("home", {
    pageTitle: "home page",
    signedIntoAccount: signedIntoAccount,
    username:currentUser.username
  });
});
app.get("/becomeADonor", (req, res) => {
  if (currentUser == null) {
    alert("Sign In to Continue");
    res.redirect("/signin");
  }
  Donor.findOne({
      "details.username": currentUser.username
    },
    (err, results) => {
      if (!results) {
        res.render("becomeADonor", {
          username: currentUser.username,
          pageTitle: "Become A Donor",
        });
      } else {
        res.redirect("/receiverListThaknkYou");
      }
    }
  );
});

app.get("/receiverListThaknkYou", function(req, res) {
  if (currentUser == null) {
    alert("Sign In to Continue");
    res.redirect("/signin");
  }
  res.render("receiverListThaknkYou", {
    pageTitle: "Thank You!",
    username: currentUser.username,
  });
});

app.get("/becomeAReceiver", (req, res) => {
  if (currentUser == null) {
    alert("Sign In to Continue");
    res.redirect("/signin");
  }

  res.render("search", {
    username: currentUser.username,
    pageTitle: "Become A Receiver",
  });
});
var receiverBloodGroup = null;
// donor list
app.get("/donorList", function(req, res) {
  if (currentUser == null) {
    alert("Sign In to Continue");
    res.redirect("/signin");
  }
  Donor.find({
     "details.bloodGroup":{$in:bldGrpChartForRec[receiverBloodGroup]},
      // "details.bloodGroup": receiverBloodGroup,
      "details.state": currentUser.state,
    },
    function(err, results) {
      if (!err) {
        var age = [];
        for (let i = 0; i < results.length; i++) {
          age.push(getAge(results[i].details.dateOfBirth));
        }
        res.render("List", {
          pageTitle: "donor list",
          results: results,
          username: currentUser.username,
          age: age,
          text1: "We Are Sure you will find a donor",
          text2: "Wishing you a Speedy Recovery !!!!!!!!"
        });
      }
    }
  );
  receiverBloodGroup = null;
});
app.get("/receiverList", (req, res) => {
  if (currentUser == null) {
    alert("Sign In to Continue");
    res.redirect("/signin");
  }
  Receiver.find({
    "details.bloodGroup":{$in:bldGrpChartForDonor[currentUser.bloodGroup]},
      "details.bloodGroup": currentUser.bloodGroup,
      "details.state": currentUser.state,
    },
    function(err, results) {
      if (!err) {
        var age = [];
        for (let i = 0; i < results.length; i++) {
          age.push(getAge(results[i].details.dateOfBirth));
        }
        res.render("list2", {
          pageTitle: "Receiver's List",
          results: results,
          username: currentUser.username,
          age: age,
          text1: "You are doing a fabulous job. Here are some people you can help",
          text2: "The Blessings you are about to receive are Priceless !!!!!"
        });
      }
    }
  );
});
app.get("/logMeOut", function(req, res) {
  signedIntoAccount = false;
  res.redirect("/");
});

app.get("/eligible", function(req, res) {
  res.render("eligible2", {
    pageTitle: "check your eligiblity",
    username: "???",
    signedIntoAccount: signedIntoAccount,
  });
});

app.get("/firstTime", function(req, res) {
  res.render("firstTime2", {
    pageTitle: "check your eligiblity",
    username: "???",
    signedIntoAccount: signedIntoAccount,
  });
});

// post requests
// Sign In
var currentUser = null;
app.post("/signin", function(req, res) {
  const ans = req.body;
  console.log(ans);
  User.findOne({
    emailAddress: ans.email
  }, function(err, results) {
    if (!results) {
      alert("E-Mail not Found");
      res.redirect("/signin");
    } else if (results.password != ans.password) {
      alert("Incorrect Password");
      res.redirect("/signin");
    } else {
      currentUser = results;
      console.log(currentUser);
      signedIntoAccount = true;
      res.redirect("/homeAfterSignIn");
    }
  });
});

// Sign up
app.post("/signup", function(req, res) {
  const ans = req.body;
  console.log(ans);
  //********verifying data for duplicacy and genuinity****************
  var valid = 1;

  if (valid == 1) {
    User.findOne({
      username: ans.user_name
    }, function(err, results) {
      if (results) {
        valid = 0;
        alert(
          "the username is already taken by someone else try something else",
          valid
        );
        res.redirect("/signup");
      } else if (valid === 1) {
        User.findOne({
          emailAddress: ans.email
        }, function(err, result) {
          if (result) {
            valid = 0;
            alert("email is already in use", valid);
            res.redirect("/signup");
          } else {
            User.findOne({
                contactNumber: ans.contact_no
              },
              function(err, result) {
                if (result) {
                  valid = 0;
                  alert("phone no is already in use", valid);
                  res.redirect("/signup");
                } else if (valid === 1 && getAge(ans.dob) <= 12) {
                  valid = 0;
                  alert("you must be older than 12 sorry");
                  res.redirect("/signup");
                } else if (
                  valid === 1 &&
                  ans.user_password != ans.confirm_password
                ) {
                  valid = 0;
                  alert("passwords dont match");
                  res.redirect("/signup");
                } else {
                  //**********getting all the info from the user to be fed to the database after verifying*****
                  // _.upperFirst(_.toLower(str))
                  const newUser = new User({
                    name: _.upperFirst(_.toLower(ans.first_name)) + " " + _.upperFirst(_.toLower(ans.last_name)),
                    bloodGroup: ans.bloodGroup,
                    gender: ans.gender,
                    dateOfBirth: ans.dob,
                    username: _.upperFirst(_.toLower(ans.user_name)),
                    emailAddress: ans.email,
                    password: ans.user_password,
                    contactNumber: ans.contact_no,
                    city: ans.city,
                    state: ans.state,
                    pin: ans.pin,
                  });
                  newUser.save();
                  const randOtp1 = Math.floor(1000 + Math.random() * 9000);
                  console.log(randOtp1);
                  console.log(ans.contact_no);
                  client.messages
                    .create({
                      body: "your otp is " + randOtp1,
                      from: "+19378216745",
                      to: "+91" + ans.contact_no,
                    })
                    .then((message) => console.log(message.sid));

                  const randotp2 = Math.floor(1000 + Math.random() * 9000);
                  console.log(randotp2);
                  var mailOptions = {
                    from: "bloodforyou5@gmail.com",
                    to: ans.email,
                    subject: "We have your otp for verification",
                    text: "your Otp is " + randotp2,
                  };

                  transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                      console.log(error);
                    } else {
                      console.log("Email sent: " + info.response);
                    }
                  });

                  const newOtp = new Otp({
                    phoneNo: ans.contact_no,
                    otpPhone: randOtp1,
                    email: ans.email,
                    otpEmail: randotp2,
                  });
                  newOtp.save();

                  res.redirect("/otp");
                }
              }
            );
          }
        });
      }
    });
  }
});

app.get("/otp", function(req, res) {
  res.render("otp", {
    pageTitle: "Otp verification"
  });
});
/*
app.post("/otp", function(req, res) {
  const ans = req.body;
  const mobileNo = ans.mobileNo;
  const email = ans.email;
  console.log(ans.mobotp, ans.emailotp);
  Otp.findOne({
    phoneNo: mobileNo,
    email: email
  }, function(err, result) {
    if (result) {
      console.log(result.otpEmail, result.otpPhone);
      if (ans.mobotp == result.otpPhone && ans.emailotp == result.otpEmail) {
        Otp.findOneAndRemove({
          phoneNo: mobileNo
        }, function(err) {
          console.log(err);
          res.redirect("/successfulSignUp");
        });
      } else {
        Person.findOneAndRemove({
          email: email
        }, function(err) {
          if (!err) {
            Donor.findOneAndRemove({
              contactNo: mobileNo
            }, function(err) {
              if (!err) {
                res.send("otp is not valid");
              }
            });
          }
        });
      }
    }
  });
});
*/
app.post("/otp", function(req, res) {
  const ans = req.body;
  const mobileNo = ans.mobileNo%10000000000;
  const email = ans.email;
  console.log(ans.mobotp, ans.emailotp);
  Otp.findOne({
    phoneNo: mobileNo,
    email: email
  }, function(err, result) {
    if (result) {
      console.log(result.otpEmail, result.otpPhone);
      // if (ans.emailotp == result.otpEmail) {
      if(1){
        Otp.findOneAndRemove({
          phoneNo: mobileNo
        }, function(err) {
          console.log(err);
          res.redirect("/successfulSignUp");
        });
      } else {
        Person.findOneAndRemove({
          email: email
        }, function(err) {
          if (!err) {
            Donor.findOneAndRemove({
              contactNo: mobileNo
            }, function(err) {
              if (!err) {
                res.send("otp is not valid");
              }
            });
          }
        });
      }
    }
  });
});

app.get("/aa", function(req, res) {
  res.render("search", {
    pageTitle: "welcome",
  });
});
app.post("/becomeADonor", (req, res) => {
  const newDonor = new Donor({
    details: currentUser,
    shareContact: req.body.shareNumber,
  });
  newDonor.save();
  alert("Congratulations on Becoming A Donor !!!");
  res.redirect("/homeAfterSignIn");
});

app.post("/becomeAReceiver", (req, res) => {
  Receiver.findOneAndDelete({
      "details.username": currentUser.username
    },
    (err, results) => {
      console.log(err);
    }
  );
  receiverBloodGroup = req.body.bloodGroup;
  const newReceiver = new Receiver({
    details: currentUser,
    bloodGroup: req.body.bloodGroup,
  });
  newReceiver.save();
  res.redirect("/donorList");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("working on port 3000");
})
