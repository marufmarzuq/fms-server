const pkg = require("pg");
const { Client } = pkg;


const dotenv = require("dotenv");
const client = require("pg");
// const multer  = require('multer')
const dayjs = require("dayjs")
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

const hatcheries = require("../hatch.json")

exports.uploadHatchery = async (req,res) => {
    let query = []
  hatcheries.forEach(hatchery => {
       let  query_part = `('${hatchery["Hatchery Name"]}','${hatchery["Address"]}','${hatchery["Pincode"]}','${hatchery["Conatct person"]}','${hatchery["Number"]}')`
       query.push(query_part)
  })
  query = query.join(",")
  let final = `INSERT INTO farm.intg_hatcheries (name,address,pincode,poc,phone) VALUES ${query}`

  res.send(final)
}










