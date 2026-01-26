import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";

const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("PORT is not defined");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
