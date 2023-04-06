const https = require("https");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

const options = {
    key: fs.readFileSync("key"),
    cert: fs.readFileSync("cert")
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({ message: "Hello world" });
});

https.createServer(options, app).listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});