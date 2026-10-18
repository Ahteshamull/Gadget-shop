import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db connection");

  const res = await db.collection("phones").updateMany(
    { $or: [{ addedBy: { $exists: false } }, { addedBy: "" }, { addedBy: "Admin" }] },
    { $set: { addedBy: "mehedi" } }
  );
  console.log("Updated phones count:", res.modifiedCount);

  const phones = await db.collection("phones").find({}, { projection: { imei: 1, brand: 1, model: 1, addedBy: 1 } }).toArray();
  console.log("Current phones in DB:", JSON.stringify(phones, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
