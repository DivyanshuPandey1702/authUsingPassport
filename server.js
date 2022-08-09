require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

const app = express();
app.set("view-engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

const users = [];

app.get("/", checkAuth, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});

app.get("/login", checkNoAuth, (req, res) => {
  res.render("login.ejs", { nomatch: "" });
});

app.post(
  "/login",
  checkNoAuth,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNoAuth, (req, res) => {
  res.render("register.ejs", { nomatch: "" });
});

app.post("/register", checkNoAuth, async (req, res) => {
  try {
    let password = req.body.password;
    let confirmpassword = req.body.confirmpassword;
    if (password === confirmpassword) {
      const hashedPassword = await bcrypt.hash(password, 10);
      users.push({
        id: uuidv4(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        createdAt: Date.now().toString(),
      });
      console.log(users);
      res.redirect("/login");
    } else {
      res.render("register.ejs", {
        nomatch: "Password and Confirm Password does not match.",
      });
    }
  } catch (err) {
    console.log(err);
    res.render("register.ejs", { nomatch: err });
  }
});

app.delete("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("login");
  });
});

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkNoAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(process.env.PORT, (req, res) => {
  console.log(`Server started on port: ${process.env.PORT}`);
});
