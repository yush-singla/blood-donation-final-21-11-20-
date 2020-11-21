// jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const alert = require("alert");
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

//**********************************************************************

//***************************this is the donor collection**************
/*this is a sample object for donor list*/
/*
const donor1=new Donor({
  name:"yush",
  contactNo:1234567890,
  bloodGroup:"b+",
  gender:1,
  emailAdress:"abc@xyz.com",
  city:"new delhi",
  state:"delhi",
  pin:110087,
  dateOfBirth:'2002-12-09'

})
// donor1.save();*/

var signedIntoAccount=false;

// GET Request
// Home
app.get("/", function (req, res) {
  currentUser = null;
  res.render("home", {
    pageTitle: "home page"
  });
});

// Sign-in
app.get("/signin", function (req, res) {
  res.render("signin", {
    pageTitle: "Sign In Page",
  });
});

// ??
// app.get("/delete/:email", function (req, res) {
//   const email = req.params.email;
//   Person.findOneAndRemove({ email: email }, function (err) {
//     Donor.findOneAndRemove({ emailAdress: email }, function (err) {
//       Otp.findOneAndRemove({ email: email }, function (err) {
//         res.send("wiped out everything");
//       });
//     });
//   });
// });

// sign-up page
app.get("/signup", function (req, res) {
  res.render("signup");
});

// Successfull Sign-up page
app.get("/successfulSignUp", function (req, res) {
  res.render("signinAfterSignupPage", {
    pageTitle: "Sign In Page",
  });
});

// ??
app.get("/donorreceiverpage", function (req, res) {
  Otp.deleteMany({}, function (err) {
    res.render("donorReceiverPage", {
      pageTitle: "welcome",
    });
  });
});

// about US
app.get("/aboutus", function (req, res) {
  res.render("AboutTeam", {
    pageTitle: "about us",
    signedIntoAccount:signedIntoAccount,
    username:"???",
  });
});
app.get("/homeAfterSignIn", function (req, res) {
  if (currentUser == null) {
    alert("Please Sign In first");
    res.redirect("/signin");
  } else {
    res.render("homeAfterSignIn", {
      username: currentUser.username,
      pageTitle: "Home",
    });
  }
});
app.get("/becomeADonor", (req, res) => {
  if (currentUser == null) {
    alert("Please Sign In first");
    res.redirect("/signin");
  } else {
    res.render("becomeADonor", {
      username: currentUser.username,
      pageTitle: "Become A Donor",
    });
  }
});
app.get("/becomeAReceiver", (req, res) => {
  if (currentUser == null) {
    alert("Please Sign In first");
    res.redirect("/signin");
  } else {
    res.render("becomeAReceiver", {
      username: currentUser.username,
      pageTitle: "Become A Receiver",
    });
  }
});
var receiverBloodGroup = null;
// donor list
app.get("/donorList", function (req, res) {
  Donor.find(
    {
      "details.bloodGroup": receiverBloodGroup,
      "details.state": currentUser.state,
    },
    function (err, results) {
      if (!err) {
        console.log(results);
        res.render("List", {
          pageTitle: "donor list",
          results: results,
          username: currentUser.username,
        });
      }
    }
  );
});
app.get("/receiverList", (req, res) => {
  Receiver.find(
    {
      "details.bloodGroup": currentUser.bloodGroup,
      "details.state": currentUser.state,
    },
    function (err, results) {
      if (!err) {
        console.log(results);
        res.render("List", {
          pageTitle: "Receiver's List",
          results: results,
        });
      }
    }
  );
});
app.get("/logMeOut",function(req,res){
  signedIntoAccount=false;
  res.redirect("/");
});

app.get("/eligible",function(req,res){
  res.render("eligible", {
    pageTitle: "check your eligiblity"
  });
})

// post requests
// Sign In
var currentUser = null;
app.post("/signin", function (req, res) {
  const ans = req.body;
  console.log(ans);
  User.findOne({ emailAddress: ans.email }, function (err, results) {
    if (!results) {
      alert("E-Mail not Found");
      res.redirect("/signin");
    } else if (results.password != ans.password) {
      alert("Incorrect Password");
      res.redirect("/signin");
    } else {
      currentUser = results;
      console.log(currentUser);
      signedIntoAccount=true;
      res.redirect("/homeAfterSignIn");
    }
  });
});

// Sign up
app.post("/signup", function (req, res) {
  const ans = req.body;
  console.log(ans);
  //********verifying data for duplicacy and genuinity****************
  /*
  //1. phone no is 10 digits
  if (check===1 && (ans.contact_no / 1000000000 >= 10 || ans.contact_no / 1000000000 <1 )) {
    console.log("Invalid phone no! Plz fill it correctly");
    check = 0;
    console.log(check);
  }
  console.log(check);
  //*********************check if username is available or already used up************
  if (check==1) {
    Person.findOne({username: ans.user_name}, function(err, results) {
      if (results) {
        console.log("came here also");
        check = 0;
        console.log("set valid false and am here");
        console.log("the username is already taken by someone else try something else");

      }
    });
  }
console.log(check);
  //***************check if the phone no and the email are not already used
  if (check===1) {
    Donor.findOne({ emailAdress: ans.email }, function(err, result) {
      if (result) {
        check = 0;
        console.log("email is already in use");
      }
    });
    Donor.findOne({ contactNo: ans.contact_no }, function(err, result) {
      if(result){
        check = 0;
        console.log("phone no is already in use");
    }
    });
  }
  //**************password and confirm password are same or not**********
  if (check===1 && ans.user_password != ans.confirm_password) {
    check = 0;
    console.log("password and confirm password donot match plz try again");

  }
  if (check===0) {
    console.log("come here");
    res.redirect("/signup");
  }*/
  var valid = 1;

  if (valid == 1) {
    User.findOne({ username: ans.user_name }, function (err, results) {
      if (results) {
        valid = 0;
        alert(
          "the username is already taken by someone else try something else",
          valid
        );
        res.redirect("/signup");
      } else if (valid === 1) {
        User.findOne({ emailAddress: ans.email }, function (err, result) {
          if (result) {
            valid = 0;
            alert("email is already in use", valid);
            res.redirect("/signup");
          } else {
            User.findOne(
              { contactNumber: ans.contact_no },
              function (err, result) {
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
                  const newUser = new User({
                    name: ans.first_name + " " + ans.last_name,
                    bloodGroup: ans.bloodGroup,
                    gender: ans.gender,
                    dateOfBirth: ans.dob,
                    username: ans.user_name,
                    emailAddress: ans.email,
                    password: ans.user_password,
                    contactNumber: ans.contact_no,
                    city: ans.city,
                    state: ans.state,
                    pin: ans.pin,
                  });
                  newUser.save();
                  const randOtp1 = Math.floor(1000 + Math.random() * 9000);

                    client.messages
                      .create({
                        body: "your otp is" + randOtp1,
                        from: "+19378216745",
                        to: "+91" + ans.contact_no,
                      })
                      .then((message) => console.log(message.sid));

                    const randotp2 = Math.floor(1000 + Math.random() * 9000);

                    var mailOptions = {
                      from: "bloodforyou5@gmail.com",
                      to: ans.email,
                      subject: "We have your otp for verification",
                      text: "your Otp is " + randotp2,
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
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
                // res.redirect("/successfulSignUp");
                /*
                else {

                   let sex;
                   if (ans.department[1] === "Male") {
                     sex = true;
                   } else sex = false;

                   //**********getting all the info from the user to be fed to the database after verifying*****
                   const donorNew = new Donor({
                     name: ans.first_name + " " + ans.last_name,
                     contactNo: ans.contact_no,
                     bloodGroup: ans.department[0],
                     gender: sex,
                     dateOfBirth: ans.dob,
                     emailAdress: ans.email,
                     city: ans.city,
                     state: ans.state,
                     pin: ans.pin,
                   });
                   donorNew.save();
                   const newPerson = new Person({
                     details: donorNew,
                     email: ans.email,
                     username: ans.user_name,
                     password: ans.user_password,
                   });
                   newPerson.save();

                   res.render("signinAfterSignupPage", {
                     pageTitle: "Sign In Page"
                   });
                 }
                 */
              }
            );
          }
        });
      }
    });
  }
});

app.get("/otp", function (req, res) {
  res.render("otp", { pageTitle: "Otp verification" });
});

app.post("/otp", function (req, res) {
  const ans = req.body;
  const mobileNo = ans.mobileNo;
  const email = ans.email;
  console.log(ans.mobotp, ans.emailotp);
  Otp.findOne({ phoneNo: mobileNo, email: email }, function (err, result) {
    if (result) {
      console.log(result.otpEmail, result.otpPhone);
      if (ans.mobotp == result.otpPhone && ans.emailotp == result.otpEmail) {
        Otp.findOneAndRemove({ phoneNo: mobileNo }, function (err) {
          console.log(err);
          res.redirect("/successfulSignUp");
        });
      } else {
        Person.findOneAndRemove({ email: email }, function (err) {
          if (!err) {
            Donor.findOneAndRemove({ contactNo: mobileNo }, function (err) {
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

app.get("/aa",function(req,res){
  res.render("donorReceiverPage",{
    pageTitle:"welcome"
  });
});
app.post("/becomeADonor", (req, res) => {
  const newDonor = new Donor({
    details: currentUser,
  });
  newDonor.save();
  alert("Congratulations on Becoming A Donor !!!");
  res.redirect("/homeAfterSignIn");
});

app.post("/becomeAReceiver", (req, res) => {
  receiverBloodGroup = req.body.bloodGroup;
  const newReceiver = new Receiver({
    details: currentUser,
    bloodGroup: req.body.bloodGroup,
  });
  newReceiver.save();
  res.redirect("/donorList");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("working on port 3000");
});
