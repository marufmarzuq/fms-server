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

exports.getDailyData = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();
  let { filters, page_size, page_number, sort_params } = req.query;
  let sort_key = "ORDER BY b.id DESC";
  let limit = `LIMIT ${page_size}`;
  let filter_key = [];
  let offset = `OFFSET ${(page_number - 1) * page_size}`;
  filters = JSON.parse(filters);

  for (key in filters) {
    filter_key.push(`${key} = '${filters[key]}'`);
  }
  filter_key = filter_key.join(" AND ");
  filter_key ? (filter_key = "WHERE " + `${filter_key}`) : (filter_key = "");
  if (sort_params) {
    sort_params = JSON.parse(sort_params);
    for (key in sort_params) {
      sort_key = `ORDER BY ${key} ${sort_params[key]}`;
    }
  }
  let get_daily_data_query = `SELECT b.id,
  (SELECT name FROM farm.intg_satellite_farms WHERE id = b.satellite_farm_id) AS satellite_farm_name,
  (SELECT address FROM farm.intg_satellite_farms WHERE id = b.satellite_farm_id) AS address,
  (SELECT name FROM farm.intg_farmers  WHERE id = b.farmer_id) AS farmer_name,
  (SELECT phone FROM farm.intg_farmers  WHERE id = b.farmer_id) AS farmer_phone,
  (SELECT name FROM farm.intg_admins  WHERE id = b.supervisor_id) AS supervisor_name,
  (SELECT phone FROM farm.intg_admins  WHERE id = b.supervisor_id) AS supervisor_phone,
  (SELECT COUNT(b.id) FROM farm.intg_batches b WHERE b.id NOT IN(SELECT dd.batch_id FROM farm.intg_daily_data dd WHERE date = CURRENT_DATE)) AS total_entries
  FROM farm.intg_batches b WHERE b.id NOT IN(SELECT dd.batch_id FROM farm.intg_daily_data dd WHERE date = CURRENT_DATE) ${sort_key} ${limit} ${offset}`;

  console.log(get_daily_data_query);
  const result = await client
    .query(get_daily_data_query)
    .catch((err) => console.log(err));
  let daily_data = result.rows;
  let totalPages = Math.ceil(result.rows[0].total_entries / page_size);
  let totalEntries = result.rows[0].total_entries;
  daily_data.forEach((element) => {
    delete element["total_entries"];
  });
  console.log(daily_data);
  res.status(200).send({
    data: {
      totalPages: totalPages,
      daily_data: daily_data,
      totalEntries: totalEntries,
    },
  });
};

exports.addDailyData = async (req, res) => {
  let client = new Client(DB_CONFIG);
  client.connect();
  let {
    batch_id,
    feed_bag_type,
    feed_bag_used,
    idea_farm_id,
    mortality_count,
    mortality_reason,
    satellite_farm_id,
    supervisor_comments,
    unit,
    daily_date,
    vaccination,
    vaccination_type,
    weight,
  } = req.body;
  console.log(req.body);
  mortality_reason = mortality_reason ? `'${mortality_reason}'` : null;
  let daily_data_insert_query = `INSERT INTO farm.intg_daily_data (batch_id,feed_bags_type,feed_bags_used,date,
    mortality,mortality_reason,supervisor_feedback,vaccination,avg_weight) VALUES (${batch_id},'${feed_bag_type}',${feed_bag_used},'${daily_date}',${mortality_count},${mortality_reason},'${supervisor_comments}',${vaccination},${weight}) returning id`;
  console.log(daily_data_insert_query);
  let daily_data_insert_result = await client.query(daily_data_insert_query);
  !daily_data_insert_result &&
    res.status(500).send({status:false, msg: "Something Went wrong" });
  daily_data_insert_result &&
    res.status(200).send({status:true, msg:"Data has been inserted successfully"});
  console.log(daily_data_insert_result);
};

exports.getCategory = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();
const {batch_id} = req.query
  let query = `Select sub_category from farm.intg_stock where category = 'feed_bag' and product_id = (Select product_id::text from farm.intg_batches where id=${batch_id})`;
  console.log(query)
  let result = await client.query(query);
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "product list", data: result.rows });
};
