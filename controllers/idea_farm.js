const pkg = require("pg");
const { Client } = pkg;
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const dayjs = require('dayjs')
const uploadImage = require("../helpers/image_upload");
const dotenv = require("dotenv");
// const multer  = require('multer')

dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.addIdeaFarm = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();
  const {
    name,
    category,
    product,
    stock_sub_category,
    stock_quantity,
    stock_unit,
    address,
    pincode,
    latitude,
    longitude,
    hatcheries,
    Supervisors,
    phone,
  } = req.body;
console.log("hatcheries",hatcheries)
console.log("Supervisors",Supervisors)

  let feed_available = [];
  let obj = {
    product: "",
    category: "",

    stock_sub_category: "",

    stock_quantity: "",

    stock_unit: "",
  };

  if (!Array.isArray(category)) {
    obj.product = product;
    obj.category = category;

    obj.stock_sub_category = stock_sub_category;

    obj.stock_quantity = stock_quantity;

    obj.stock_unit = stock_unit;
    feed_available.push(obj);
  } else {
    for (let i = 0; i < category.length; i++) {
      obj.product = product[i];
      obj.category = category[i];

      obj.stock_sub_category = stock_sub_category[i];

      obj.stock_quantity = stock_quantity[i];

      obj.stock_unit = stock_unit[i];
      feed_available.push(obj);
      obj = {};
    }
  }
  const bucketName = "aqai-farm-idea-farm";
  const GOOGLE_CLOUD_PROJECT_ID = "aqai-farm-media";
  const GOOGLE_CLOUD_KEYFILE = "aqai-farm-media-a8239c8a668c.json";
  const storage = new Storage({
    projectId: GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: GOOGLE_CLOUD_KEYFILE,
  });

  let image_url = "https://storage.googleapis.com/aqai-farm-idea-farm/";

  let image_url_db = [];

  let image_name;
  let count = 0;
  let hatchery = [];
  let supervisor = [];

  if (!Array.isArray(hatcheries)) {
    console.log(hatcheries)
    hatchery.push(hatcheries);
    console.log(hatchery)
  }else {

  for (let i = 0; i < hatcheries.length; i++) {
  
    hatchery[i] = `${hatcheries[i]}`;
  }}

  if (!Array.isArray(Supervisors)) {
    console.log(Supervisors);
    supervisor.push(Supervisors);
  } else {

  for (let i = 0; i < Supervisors.length; i++) {
    supervisor[i] = `${Supervisors[i]}`;
  }}

   
  let idea_image_url = null
  let idea_video_url = null

  if (req.body.idea_image) {
    let image_bucket_name = "aqai-farm-satellite-farms";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.idea_image;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let idea_image = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_satellite-image_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      idea_image.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_satellite-image_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        idea_image.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    idea_image_url = idea_image;
  }

  if (req.body.idea_video) {
    let image_bucket_name = "aqai-farm-satellite-farms";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.idea_video;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let idea_video = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_satellite-video_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      idea_video.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_satellite-video_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        idea_video.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    idea_video_url = idea_video;
  }

  let result;
  feed_available = JSON.stringify(feed_available);
  // let keys = Object.keys(obj)
  // let values = Object.values(obj)

  // for(let i = 0; i < keys.length - 1; i++) {
  let query = `insert into farm.intg_idea_farms (name, address,pincode, latitude, longitude, feed_available, hatcheries, supervisors, phone, name_en, photos, videos) values ('${name}', (E'${address}') , ${pincode}, '${latitude}', '${longitude}', '${feed_available}', ARRAY[${hatchery}], ARRAY[${supervisor}], ${phone}, '${name}', ARRAY[${idea_image_url}], ARRAY[${idea_video_url}]) returning id`;
  console.log("query is", query);

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res.status(200).send({
      status: true,
      msg: "idea farm has been added",
      data: result.rows,
    });
  // }
};

exports.showAllSupervisors = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let query = `select id As value,name As label from farm.intg_admins where role = 'supervisor'`;
  result = await client.query(query).catch((err) => console.log(err));

  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res.status(200).send({
      status: true,
      msg: "list of available supervisors",
      data: result.rows,
    });
};

exports.showAllHatcheries = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let query = `select id as value,name as label from farm.intg_hatcheries`;

  result = await client.query(query).catch((err) => console.log(err));

  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "list of hatcheries", data: result.rows });
};

exports.getIdeaFarms = async (req, res) => {
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
  let get_idea_farms_query = `select id, name, phone,address,pincode,(SELECT COUNT(id) FROM farm.intg_satellite_farms WHERE idea_farm_id = id) AS satellite_farms_count,(SELECT COUNT(id) FROM farm.intg_idea_farms ${filter_key}) AS total_entries FROM farm.intg_idea_farms ${filter_key}  ${sort_key} ${limit} ${offset}`;
  console.log(get_idea_farms_query);
  const result = await client
    .query(get_idea_farms_query)
    .catch((err) => console.log(err));
  let idea_farms = result.rows;
  let totalPages = Math.ceil(result.rows[0].total_entries / page_size);
  let totalEntries = result.rows[0].total_entries
  console.log(totalPages)
  idea_farms.forEach((element) => {
    delete element["total_entries"];
  });
  console.log(idea_farms);
  res
    .status(200)
    .send({ data: { totalPages: totalPages, idea_farms: idea_farms, totalEntries : totalEntries } });
};