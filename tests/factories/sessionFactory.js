const Buffer = require("buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");

const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  const id = String(user._id);
  const sessionObject = {
    passport: {
      user: id,
    },
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

  const sig = keygrip.sign("session=" + session);
  return {
    session,
    sig,
  };
};
