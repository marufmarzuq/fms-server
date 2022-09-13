const pkg = require("pg");
const { Client } = pkg;
const dayjs = require("dayjs");
const dotenv = require("dotenv");
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.main_overview = async (req, res) => {
  const { status } = req.query;
  const client = new Client(DB_CONFIG);
  client.connect();
  ///////////queries///////////
  let batches_query = `select count(id) as batches_count from farm.intg_batches ib where status =${status}`;
  let idea_query = `select count(id) as idea_farm_count from farm.intg_idea_farms iif`;
  let satellite_query = `select count(id) as sf_farm_count from farm.intg_satellite_farms isf`;
  let hatcheries_query = `select count(id) as hatcheries_count from farm.intg_hatcheries ih`;
  let birds_query = `select ib.product_id, (select name_en from farm.intg_products ip where id= ib.product_id )as product_name ,(select photo from farm.intg_products ip where id= ib.product_id )as product_image, ib.inbound_quantity,ib.current_quantity from farm.intg_batches ib where status =${status}`;
  let mortality_query = `select ib.mortality,(select p.name_en from farm.intg_products p where id=ib.product_id)as product_name from farm.intg_batches ib where status =${status}`;
  ///////////////////////////
  ///////////////////////////////////////// 1st widget- Total farms-start//////////////////////////////////////////////////
  batches_result = await client
    .query(batches_query)
    .catch((err) => console.log(err));
  let batches = batches_result.rows[0].batches_count;

  idea_result = await client.query(idea_query).catch((err) => console.log(err));
  let idea_farms = idea_result.rows[0].idea_farm_count;

  satellite_result = await client
    .query(satellite_query)
    .catch((err) => console.log(err));
  let sf_farms = satellite_result.rows[0].sf_farm_count;

  hatcheries_result = await client
    .query(hatcheries_query)
    .catch((err) => console.log(err));
  let hatcheries = hatcheries_result.rows[0].hatcheries_count;
  ///////////////////////////////////////// 1st widget- Total farms- end//////////////////////////////////////////////////
  ///////////////////////////////////////// 2nd widget- Total Batches-start//////////////////////////////////////////////////
  ///////getting all batches from first widget

  ///////////////////////////////////////// 2nd widget- Total Batches-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 3rd widget- Stock details-start//////////////////////////////////////////////////
  let bird_final = [];
  birds_result = await client
    .query(birds_query)
    .catch((err) => console.log(err));
  let birds = birds_result.rows;

  let birds_obj = {};
  birds.forEach((bird) => {
    if (!birds_obj[bird.product_name]) {
      birds_obj[bird.product_name] = bird;
    } else {
      birds_obj[bird.product_name]["inbound_quantity"] +=
        +bird.inbound_quantity;
      birds_obj[bird.product_name]["current_quantity"] +=
        +bird.current_quantity;
    }
  });
  //////////Total Birds count//////////////
  const total_birds_growing = birds.reduce((sum, currentValue) => {
    return sum + currentValue.current_quantity;
  }, 0);

  ////////final array/////////////////
  let total_birds = {};
  let birds_array = [];
  for (key in birds_obj) {
    birds_array.push(birds_obj[key]);
  }
  total_birds["birds_array"] = [...birds_array];
  total_birds["total_growing_birds"] = total_birds_growing;

  ///////////////////////////////////////// 3rd widget- Stock details-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 4rd widget- Mortality-start//////////////////////////////////////////////////
  let mortality_final = [];
  mortality_result = await client
    .query(mortality_query)
    .catch((err) => console.log(err));
  let moratality = mortality_result.rows;

  ///////////////////////////////////////// 4rd widget- Mortality-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 5rd widget- Feed data-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 5rd widget- Feed data-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 6th widget- Sales-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 6th widget- Sales-end//////////////////////////////////////////////////
  res.status(200).send({
    success: true,
    data: {
      total_farms: {
        total: `${+idea_farms + +sf_farms}`,
        batches: batches,
        idea_farms: idea_farms,
        sf_farms: sf_farms,
        hatcheries: hatcheries,
      },
      total_batches: {
        total: batches,
        green: 100,
        amber: 90,
        red: 90,
      },
      stock_details: total_birds,
      moratality: moratality,
      feed: "hvh",
      sales: "kjhjk",
    },
  });
};

exports.batch_overview = async (req, res) => {
  const { batch_id } = req.query;
  const client = new Client(DB_CONFIG);
  client.connect();
  ///////////queries///////////

  let new_query = `SELECT b.id,b.source_date,b.est_harvest_date,b.score,b.inbound_quantity,
  b.current_quantity,b.mortality,b.feed_bag_available,  
  json_agg(json_build_object('date',d.date,'day',
  d.day,'feed_used',d.feed_bags_used,'mortality',d.mortality,'entry_date',d.entry_date,
  'vaccination',d.vaccination,'supervisor_visit',d.supervisor_visit,'supervisor_comments',
  d.supervisor_feedback,'batch_score',d.batch_score)) AS daily_data ,
  json_agg(json_build_object('name',p.name_en,'product_image',p.photo)) AS product_data,
  json_agg(json_build_object('name',f.name,'farmer_image',f.profile_image)) AS farmer_data,
  h.name as hatchery_name,
  i.name as idea_farm_name,
  s.name as satellite_farm_name
  FROM farm.intg_batches b
  LEFT JOIN farm.intg_hatcheries h ON b.hatchery_id = h.id
  LEFT JOIN farm.intg_idea_farms i ON b.idea_farm_id = i.id
  LEFT JOIN farm.intg_satellite_farms s ON b.satellite_farm_id = s.id 
  LEFT JOIN farm.intg_daily_data d ON b.id = d.batch_id 
  LEFT JOIN farm.intg_products p ON b.product_id = p.id
  LEFT JOIN farm.intg_farmers f ON b.farmer_id  = f.id
  WHERE b.id = ${batch_id} 
  GROUP BY b.source_date,b.est_harvest_date,b.score,b.inbound_quantity,
  b.current_quantity,b.mortality,b.feed_bag_available,h.name,i.name,b.id,s.name `;

  result = await client.query(new_query).catch((err) => console.log(err));
  let batch_data = result.rows[0];
  batch_data["source_date"] = dayjs(batch_data["source_date"]).format("DD/MM/YYYY");
  batch_data["est_harvest_date"] = dayjs(batch_data["est_harvest_date"]).format("DD/MM/YYYY");
  batch_data["product_data"] = batch_data["product_data"][0];
  let inbound_quantity = batch_data["inbound_quantity"];
  let current_quantity = batch_data["current_quantity"];  
  let moratality_quantity = (+batch_data["inbound_quantity"])-(+batch_data["current_quantity"])
  let mortality_percent = (moratality_quantity * 100) / inbound_quantity;
  batch_data["mortality_percent"] = mortality_percent
  
  ///////////////////////////
  ///////////////////////////////////////// 1st widget- batch basic info-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 1st widget- batch basic info- end//////////////////////////////////////////////////
  ///////////////////////////////////////// 2nd widget- stock-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 2nd widget- stock-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 3rd widget- feed-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 3rd widget- feed-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 4rd widget- feed bag trend-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 4rd widget- feed bag trend-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 5rd widget- Mortality trend-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 5rd widget- Mortality trend-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 6th widget- input cost-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 6th widget- input cost-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 7th widget- sales-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 7th widget- sales-end//////////////////////////////////////////////////
  ///////////////////////////////////////// 8th widget- daily details-start//////////////////////////////////////////////////

  ///////////////////////////////////////// 8th widget- daily details-end//////////////////////////////////////////////////
  res.status(200).send({
    success: true,
    data: batch_data,
  });
};
