// dotenv setup first
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDb from "./src/config/database.js";
import app from "./app.js";

// variables...
const port = process.env.PORT || 5100;
const uri = process.env.MONGO_URL;

connectDb(uri)
  .then(() => {
    app.listen(port, () => {
      console.log("Server is running on Port :", port);
    });
  })
  .catch((err) => {
    console.log("Server connection failed :", err);
  });
