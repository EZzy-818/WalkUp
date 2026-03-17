const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Local Strategy ────────────────────────────────────────────────────────────
// passport-local expects a `username` field by default; we override it to
// `email` so the client submits { email, password }.
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return done(null, false, { message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// ── Session serialization ─────────────────────────────────────────────────────
// Only the user's id is stored in the session cookie — the full record is
// re-fetched on every request via deserializeUser.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
