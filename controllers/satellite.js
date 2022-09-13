const pkg = require("pg");
const { Client } = pkg;
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const dayjs = require('dayjs')
const uploadImage = require("../helpers/image_upload");


const dotenv = require("dotenv");
const { CONNREFUSED } = require("dns");
// const multer  = require('multer')

dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.addSatellite = async (req, res) => {
  console.log(req.body);
  let {
    name,
    idea_farm_id,
    farmer_id,
    phone,
    pincode,
    address,
    latitude,
    longitude,
    supervisor_id,
  } = req.body;
  console.log(name, farmer_id, phone, pincode, address, latitude, longitude);
  console.log(req.body)
  /////// DB connection///////
  const client = new Client(DB_CONFIG);
  client.connect();
  let result;
  let score = 100;
  
  let satellite_image_url = null
  let satellite_video_url = null

  if (req.body.satellite_image) {
    let image_bucket_name = "aqai-farm-satellite-farms";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.satellite_image;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let satellite_image = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_satellite-image_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      satellite_image.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_satellite-image_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        satellite_image.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    satellite_image_url = satellite_image;
  }

  if (req.body.satellite_video) {
    let image_bucket_name = "aqai-farm-satellite-farms";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.satellite_image;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let satellite_video = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_satellite-video_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      satellite_video.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_satellite-video_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        satellite_video.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    satellite_video_url = satellite_video;
  }
  let query = `insert into farm.intg_satellite_farms (name,idea_farm_id, farmer_id, phone, pincode, address, latitude, longitude, score,supervisor_id, name_en, photos, videos) values ('${name}', '${idea_farm_id}', '${farmer_id}' ,${phone}, ${pincode},(E'${address}'), ${latitude}, ${longitude}, ${score},${supervisor_id}, '${name}', ARRAY[${satellite_image_url}], ARRAY[${satellite_video_url}]) returning id`;
  console.log("query is", query);

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res.status(200).send({
      status: true,
      msg: "satellite farm has been added",
      data: result.rows,
    });
  // }
};

exports.searchSupervisor = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let id = req.query.id;

  let result2 = [];
  let result;

  let query = `select supervisors from farm.intg_idea_farms where id = ${id}`;
  console.log("query is", query);
  let query2;
  result = await client.query(query).catch((err) => console.log(err));

  console.log("result is", result.rows[0].supervisors);

  let supervisor_array = result.rows[0].supervisors;
  let final_res = [];

  for (let i = 0; i < supervisor_array.length; i++) {
    query2 = `select id, name from farm.intg_admins where id = ${supervisor_array[i]}`;
    console.log("query 2 is", query2);
    result2[i] = await client.query(query2).catch((err) => console.log(err));
    final_res[i] = result2[i].rows;
    console.log("result 2 is", final_res);
  }
  res.send({ data: final_res });

  // res.status(200).send({status : true, msg: result2})
};

exports.getSatelliteFarms = async (req,res) => {
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
  let get_satellite_farms_query = `SELECT id,name,address ,phone , (SELECT count(id) from farm.intg_batches ib where ib.satellite_farm_id=id) AS total_batches,score,(SELECT COUNT(id) FROM farm.intg_satellite_farms isf ${filter_key}) AS total_entries FROM farm.intg_satellite_farms ${filter_key}  ${sort_key} ${limit} ${offset}`;
  console.log(get_satellite_farms_query);
  const result = await client
    .query(get_satellite_farms_query)
    .catch((err) => console.log(err));
  let satellite_farms = result.rows;
  let totalPages = Math.ceil(result.rows[0].total_entries / page_size);
  let totalEntries = result.rows[0].total_entries
  satellite_farms.forEach((element) => {
    delete element["total_entries"];
  });
  console.log(satellite_farms);
  res
    .status(200)
    .send({ data: { totalPages: totalPages, satellite_farms: satellite_farms, totalEntries : totalEntries } });
}