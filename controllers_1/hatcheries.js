const pkg = require("pg");
const { Client } = pkg;
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const dayjs = require('dayjs')
const uploadImage = require("../helpers/image_upload");

const dotenv = require("dotenv");
dotenv.config();

let DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.addHatchery = async (req, res) => {
  let {
    name,
    phone,
    pincode,
    poc,
    address,
    latitude,
    product,
    Capacity,
    longitude,
    hatchery_image,
    hatchery_video
  } = req.body;



  const client = new Client(DB_CONFIG);
  client.connect();
  let obj = {};
  let available_products = [];


  // creating key value pair of available products //////////////////////////////////////////////////
  if (!Array.isArray(product)) {
    obj[product] = Capacity;
    available_products.push(obj);
  } else {
    for (let i = 0; i < product.length; i++) {
      obj[product[i]] = Capacity[i];
      available_products.push(obj);
      obj = {};
    }
  }
/////////////////////////////////////////////////////////////////////////////////////

// image upload of hatcheries from helper ///////////////////////////////////////////////////////////////////////////////////////
let image_bucket_name = "aqai-farm-satellite-farms"
if (req.body.hatchery_image){

}
console.log("The image module comes here")
////////////////////////////////////////////////////////////////////////////





}