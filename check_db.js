const mongoose = require('mongoose');

const uri = "mongodb+srv://priyanshgupta739_db_user:SdAQwPEadMsNRA14@cluster0.fiq83n5.mongodb.net/";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const telemetry = await db.collection('telemetries').find().sort({createdAt: -1}).limit(5).toArray();
  const devices = await db.collection('devices').find().toArray();
  
  console.log("--- DEVICES ---");
  console.log(JSON.stringify(devices, null, 2));
  
  console.log("--- TELEMETRY ---");
  console.log(JSON.stringify(telemetry, null, 2));
  
  mongoose.disconnect();
}

run().catch(console.error);
