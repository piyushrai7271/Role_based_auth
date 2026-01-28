import mongoose from "mongoose";

const connectDb = async (uri) => {
  try {
    const dbHost = await mongoose.connect(uri, {
      dbName: "RolesAuth",
    });
    console.log(
      "Mongodb connected successFully on host :",
      dbHost.connection.host,
    );
  } catch (error) {
    console.log("Database connection faild :", error);
    process.exit(1);
  }
};

export default connectDb;
