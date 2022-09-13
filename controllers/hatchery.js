const pkg = require("pg");
const { Client } = pkg;
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const dayjs = require("dayjs");
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
    capacity,
    longitude,
  } = req.body;
  console.log(product);
  /////// DB connection///////
  const client = new Client(DB_CONFIG);
  client.connect();
  console.log(address);
  let obj = {};
  let available_products = [];

  if (!Array.isArray(product)) {
    obj[product] = capacity;
    available_products.push(obj);
  } else {
    for (let i = 0; i < product.length; i++) {
      obj[product[i]] = capacity[i];
      available_products.push(obj);
      obj = {};
    }
  }
  /////////Image upload/////////////////

  available_products = JSON.stringify(available_products);
  let result;

  let hatchery_image_url = null;
  let hatchery_video_url = null;

  if (req.body.hatchery_image) {
    let image_bucket_name = "aqai-farm-satellite-farms";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.hatchery_image;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let hatchery_image = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_satellite-image_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      hatchery_image.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_satellite-image_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        hatchery_image.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    hatchery_image_url = hatchery_image;
  }

  if (req.body.hatchery_video) {
    let image_bucket_name = "aqai-farm-satellite-farms";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.hatchery_video;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let hatchery_video = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_satellite-video_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      hatchery_video.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_satellite-video_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        hatchery_video.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    hatchery_video_url = hatchery_video;
  }
  // let keys = Object.keys(obj)
  // let values = Object.values(obj)

  // for(let i = 0; i < keys.length - 1; i++) {
  let query = `insert into farm.intg_hatcheries (name,  phone, poc, pincode, address, latitude, longitude, available_products, photos, videos, score) values ('${name}', ${phone}, '${poc}', ${pincode},(E'${address}'), ${latitude}, ${longitude},'${available_products}',ARRAY[${hatchery_image_url}], ARRAY[${hatchery_video_url}] ,100) returning id`;
  console.log("query is", query);

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res.status(200).send({
      status: true,
      msg: "hatchery has been added",
      data: result.rows,
    });
  // }
};

exports.updateHatcheryImage = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let { id } = req.body;

  const bucketName = "aqai-farm-hatcheries";
  const GOOGLE_CLOUD_PROJECT_ID = "aqai-farm-media";
  const GOOGLE_CLOUD_KEYFILE = "aqai-farm-media-a8239c8a668c.json";

  const storage = new Storage({
    projectId: GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: GOOGLE_CLOUD_KEYFILE,
  });

  let query = `select photo from farm.intg_hatcheries where id = ${id}`;

  try {
    result = await client.query(query).catch((err) => console.log(err));
    res.send({
      status: 200,
      msg: "hatcheries images are",
      result: result.rows[0].photo,
    });

    console.log("result is", result.rows[0].photo);
  } catch (e) {
    res.send({ status: 500, msg: "images not available" });
  }
};

exports.getHatcheries = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();
  let { filters, page_size, page_number, sort_params } = req.query;
  let sort_key = "ORDER BY id DESC";
  let limit = `LIMIT ${page_size}`;
  let filter_key = [];
  let offset = `OFFSET ${(page_number - 1) * page_size}`;
  filters = JSON.parse(filters);

  for (key in filters) {
    filter_key.push(`${key} = '${filters[key]}'`);
  }
  filter_key = filter_key.join(" AND ");
  filter_key.length ? (filter_key = "WHERE " + filter_key) : (filter_key = "");

  if (sort_params) {
    sort_params = JSON.parse(sort_params);
    for (key in sort_params) {
      sort_key = `ORDER BY ${key} ${sort_params[key]}`;
    }
  }
  let get_hatcheries = `SELECT id,name,poc,phone,address,available_products,score,(SELECT COUNT(id) FROM farm.intg_hatcheries ${filter_key}) AS total_entries FROM farm.intg_hatcheries ${filter_key} ${sort_key} ${limit} ${offset}`;
  const result = await client
    .query(get_hatcheries)
    .catch((err) => console.log(err));
  let hatcheries = result.rows;
  let totalPages = Math.ceil(result.rows[0].total_entries / page_size);
  let totalEntries = result.rows[0].total_entries
  console.log(totalEntries)
  hatcheries.forEach((element) => {
    delete element["total_entries"];
  });

  res.status(200).send({ data: { totalPages: totalPages, hatcheries: hatcheries, totalEntries : totalEntries } });
};