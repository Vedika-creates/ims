import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();

app.use(cors(
    {
        origin: ["https://ims-1-z7dk.onrender.com", "https://ims-0i8n.onrender.com", /^http:\/\/localhost:\d+$/]
    }
));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("IMS Backend running 🚀");
});

app.use("/api", routes);

export default app;
