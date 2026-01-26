import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";

const PORT = 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
