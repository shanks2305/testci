const mongoose = require("mongoose");
const util = require("util");
const redis = require("redis");

const exec = mongoose.Query.prototype.exec;

const client = redis.createClient("redis://localhost:6379");
client.hget = util.promisify(client.hget);

mongoose.Query.prototype.cache = function (options = {}) {
  console.log("Cache Enable");
  this.useCache = true;
  this.hashkey = JSON.stringify(options.key || "");
  return this;
};

mongoose.Query.prototype.exec = async function () {
  console.log("work");
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );
  const chacedValue = await client.hget(this.hashkey, key);
  if (chacedValue) {
    const doc = JSON.parse(chacedValue);
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : this.model(doc);
  }
  const result = await exec.apply(this, arguments);
  client.hset(this.hashkey, key, JSON.stringify(result), "EX", 10);
  return result;
};

module.exports = {
  clearHash(hashkey) {
    client.del(JSON.stringify(hashkey));
  },
};
