const pkg = require("pg");
const { Client } = pkg;
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
// const dayjs = require('dayjs')

const dotenv = require("dotenv");
const client = require("pg");
// const multer  = require('multer')
const dayjs = require("dayjs");
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.handleImage = async (req, res) => {
  let {data} = req.body
  let data_buffer = data[0].array
  console.log(data_buffer)
    let base_code = data_buffer.toString("base64");
    var binary = data_buffer.toString("binary");
    let final = await fs.writeFileSync("test.jpg", data_buffer, "binary");
}