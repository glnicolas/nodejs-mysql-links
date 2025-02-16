import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import pool from "../database";
import * as helpers from "./helpers";

passport.use(
  "local.signin",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      try{
        console.log('after query');
        const rows =  pool.query("SELECT * FROM users WHERE username = ?", [
          username,
        ]);
        console.log('DB query ok');
        if (rows.length > 0) {
          const user = rows[0];
          const validPassword = await helpers.matchPassword(
            password,
            user.password
          );
          if (validPassword) {
            done(null, user, req.flash("success", "Welcome " + user.username));
          } else {
            done(null, false, req.flash("message", "Incorrect Password"));
          }
        } else {
          return done(
            null,
            false,
            req.flash("message", "The Username does not exists.")
          );
        }
      }catch(error){
        console.error(error);
        return done(
          null,
          false,
          req.flash("message", "An error ocurred: "+error)
        );
      }
      
    }
  )
);

passport.use(
  "local.signup",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      const { fullname } = req.body;

      let newUser = {
        fullname,
        username,
        password,
      };

      newUser.password = await helpers.encryptPassword(password);
      // Saving in the Database
      const result = await pool.query("INSERT INTO users SET ? ", newUser);
      newUser.id = result.insertId;
      return done(null, newUser);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  done(null, rows[0]);
});
