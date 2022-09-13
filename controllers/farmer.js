const pkg = require("pg");
const { Client } = pkg;
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const dayjs = require('dayjs')
const uploadImage = require("../helpers/image_upload");


const dotenv = require("dotenv");
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.addFarmer = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();
  console.log(req.body);
  const { lang_key, name, phone, kyc_no, kyc_document_type } = req.body;

  let profile_image_url = null;
  let kyc_proof_url = null;
  let farm_image_url = null;



  if (req.body.kyc_proof_image) {
    let image_bucket_name = "aqai-intg-farm-kyc-proof";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.kyc_proof_image;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let save_kyc = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_kycProof_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      save_kyc.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_kycProof_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        save_kyc.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    kyc_proof_url = save_kyc;
  }

  if (req.body.farm_image) {
    let image_bucket_name = "aqai-intg-farm-photos";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.farm_image;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let save_image = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      let image_name = `${curr_date}_farmPhoto_${phone}.png`;
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      save_image.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${imageName}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_farmPhoto_${phone}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        save_image.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });

      uploadImage(image_bucket_name, imageName, params);
    }
    farm_image_url = save_image;
  }

  if (req.body.profile_image) {
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let imageBucketName = "aqai-intg-farm-profile-photos";
    let params = req.body.profile_image;
    let image_name = `${curr_date}_profilePhoto_${phone}.png`;
    uploadImage(imageBucketName, image_name, params);
    profile_image_url = `https://storage.googleapis.com/${imageBucketName}/${image_name}`;
  }

  

  let query = `insert into farm.intg_farmers (lang_key, name, phone, kyc_no,kyc_document_type,approval_status,registered_status, role, kyc_images,profile_image, farm_images) values 
      ( '${lang_key}','${name}', ${phone}, '${kyc_no}', '${kyc_document_type}' ,1,0,'farmer', ARRAY[${kyc_proof_url}], '${profile_image_url}', ARRAY[${farm_image_url}]) returning id`;
  console.log("query", query);
  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res.status(200).send({
      status: true,
      msg: "farmer added successfully",
      data: result.rows,
    });
};

exports.approveFarmer = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let id = req.query.id;

  let query = `update farm.intg_farmers set approval_status = 1 where id = ${id} returning id`;

  console.log("query is", query);

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res.status(200).send({
      status: true,
      msg: "unapproved farmers list",
      data: result.rows,
    });
};

exports.searchFarmer = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let query = `select id as value, name as label from farm.intg_farmers`;

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "farmers list", data: result.rows });
};

exports.getAllFarmers = async (req, res) => {
  const client = new Client(DB_CONFIG)
  client.connect()
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
filter_key.length ? filter_key = "WHERE " + filter_key : filter_key =""

if(sort_params){
sort_params = JSON.parse(sort_params);
for (key in sort_params) {
  sort_key = `ORDER BY ${key} ${sort_params[key]}`;
}
}
let get_farmers = `SELECT f.name,(SELECT name FROM farm.intg_satellite_farms WHERE farmer_id =f.id LIMIT 1) AS farm_name,(SELECT address FROM farm.intg_satellite_farms WHERE farmer_id =f.id LIMIT 1),f.phone,(SELECT COUNT(id) FROM farm.intg_batches WHERE farmer_id = f.id) AS batch_count,(SELECT COUNT(id) FROM farm.intg_batches WHERE farmer_id = f.id AND status =0) AS completed_batch_count,(SELECT (SUM(score))/COUNT(id) FROM farm.intg_batches WHERE farmer_id = f.id  AND status =0) AS completed_batch_score,(SELECT COUNT(id) FROM farm.intg_batches WHERE farmer_id = f.id AND status =1) AS ongoing_batch_count,(SELECT (SUM(score))/COUNT(id) FROM farm.intg_batches WHERE farmer_id = f.id  AND status =1) AS ongoing_batch_score,(SELECT COUNT(id) FROM farm.intg_farmers ${filter_key}) AS total_entries FROM farm.intg_farmers f ${filter_key} ${sort_key} ${limit} ${offset}`;
console.log(get_farmers)
const result = await client.query(get_farmers).catch(err => console.log(err))
let farmers = result.rows
let totalPages = Math.ceil(result.rows[0].total_entries/page_size)
let totalEntries = result.rows[0].total_entries

function round(num) {
  var m = Number((Math.abs(num) * 100).toPrecision(2));
  return Math.round(m) / 100 * Math.sign(num);
}

farmers.forEach(element => {
     delete element["total_entries"]
     element["ongoing_batch_count"] =  round(+element["ongoing_batch_count"])
     element["completed_batch_count"] =  round(+element["completed_batch_count"])
});
console.log(farmers)
res.status(200).send({data : {totalPages : totalPages, farmers : farmers, totalEntries : totalEntries}})
};