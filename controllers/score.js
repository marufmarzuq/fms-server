const pkg = require("pg");
const { Client } = pkg;
const dotenv = require("dotenv");
const client = require("pg");
const dayjs = require("dayjs");
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.updateScore = async (req, res) => {
  const { batch_id, day } = req.query;
  const client = new Client(DB_CONFIG);
  client.connect();
  let update_data_in_batch_query = `UPDATE farm.intg_batches SET mortality = mortality  + (SELECT mortality FROM farm.intg_daily_data WHERE batch_id =${batch_id} AND day = ${day}),current_quantity = current_quantity -(SELECT mortality FROM farm.intg_daily_data WHERE batch_id =${batch_id} AND day = ${day}) WHERE id =${batch_id} returning id`;
  let update_mortality_result = await client
    .query(update_data_in_batch_query)
    .catch((err) => console.log(err));
  update_mortality_result.rows && console.log(update_mortality_result.rows);
  //   scoring daily data for all parameters




  if (+day % 7 == 0) {
    // daily data summation for met conditions /////////////////////////////////////////////////////////
    let daily_data_query = `SELECT (SELECT SUM(mortality) FROM farm.intg_daily_data WHERE batch_id = ${batch_id} AND day <= ${day} AND day > ${day-7}) AS weekly_mortality,
    (SELECT SUM(feed_bags_used) FROM farm.intg_daily_data WHERE batch_id = ${batch_id} AND day <= ${day} AND day > ${day-7}) AS weekly_feedbags,
    score,current_quantity,(SELECT date FROM farm.intg_daily_data WHERE batch_id = ${batch_id} AND day = ${day}),(SELECT id FROM farm.intg_daily_data WHERE batch_id = ${batch_id} AND day =${day}) FROM farm.intg_batches dd WHERE id = ${batch_id}`;
    
    let daily_data_result = await client
      .query(daily_data_query)
      .catch((err) => console.log(err));
       let daily_data = daily_data_result.rows[0];
       daily_data["date"] = dayjs(daily_data["date"]).format("YYYY-MM-DD")
       let new_score = daily_data["score"]
       
     console.log(daily_data)

    //  scoring config for deducting /////////////////////////////////////////////////////////
    let scoring_reference_query = `SELECT * FROM farm.intg_score_config`;
    let scoring_reference_result = await client.query(scoring_reference_query);
    let scoring_reference = scoring_reference_result.rows;
    let reference = {};
    scoring_reference.forEach((ref) => {
      reference[ref.key] = ref;
    });




    // score limits from product data /////////////////////////////////////////////////////////
    let usage_limit_query = `SELECT product_limits FROM farm.intg_products WHERE id = (SELECT product_id FROM farm.intg_batches WHERE id = ${batch_id})`;
    let usage_limit_result = await client.query(usage_limit_query);
    let usage_limits = usage_limit_result.rows[0].product_limits;
    let current_week = day / 7;
    let current_week_limits = usage_limits.filter(
      (data) => (data.week = current_week)
    );
    current_week_limits = current_week_limits[0];
    let current_score = daily_data["score"];
   
  

    //   scoring for mortality ////////////////////////////////////////////////////////////////////////
    let actual_mortality = daily_data["weekly_mortality"];
    let allowed_mortality =
      current_week_limits["mortality_limit"] * daily_data["current_quantity"];
      console.log(actual_mortality,allowed_mortality)
    if (actual_mortality > allowed_mortality) {
      //   reducing score due to variation_limit
      let new_score_m =
        +new_score + +reference["high_mortality"]["score_impact"];
      
        new_score = new_score_m
       
        
      let score_log_insert_query_m = `INSERT INTO farm.intg_score_log 
            (score_towards,limit_allowed,actual_count,initial_score,final_score,deviation_date,score_reduced,data_id,reference_table,score_key)
            VALUES ('batch',${allowed_mortality},${actual_mortality},${current_score},${new_score_m},'${daily_data["date"]}',${reference["high_mortality"]["score_impact"]},${daily_data["id"]},'intg_daily_data','high_mortality') returning id`;
      let score_log_insert_result_m = await client
        .query(score_log_insert_query_m)
        .catch((err) => console.log(err));


      if (score_log_insert_result_m) {
        // Updating batch an daily data with the scores
        console.log(new_score_m)
        let update_score_query_m = `WITH daily_data_update AS (UPDATE farm.intg_daily_data SET batch_score = ${new_score_m} WHERE id = ${daily_data["id"]} AND day = ${day}) UPDATE farm.intg_batches SET score = ${new_score_m} WHERE id = ${batch_id} returning id`;
        console.log(update_score_query_m)
        let update_score_result_m = await client
          .query(update_score_query_m)
          .catch((err) => console.log(err));
        update_score_result_m &&
          console.log(
            `The data with id ${update_score_result_m.rows[0].id} is updated successfully`
          );
      }
    }



    // scoring for feedbag /////////////////////////////////////////////////////////////////////////////
    let actual_feedbag_usage = daily_data["weekly_feedbags"] * 50;
    let allowed_feedbag_usage =
      current_week_limits["feed_limit"] * daily_data["current_quantity"];
    if (actual_feedbag_usage > allowed_feedbag_usage) {
   
      let new_score_f =
        +new_score + +reference["weekly_feed_overuse"]["score_impact"];
       
        new_score = new_score_f
     
        let score_log_insert_query_f = `INSERT INTO farm.intg_score_log 
            (score_towards,limit_allowed,actual_count,initial_score,final_score,deviation_date,score_reduced,data_id,reference_table,score_key)
            VALUES ('batch',${allowed_feedbag_usage},${actual_feedbag_usage},${current_score},${new_score_f},'${daily_data["date"]}',${reference["weekly_feed_overuse"]["score_impact"]},${daily_data["id"]},'intg_daily_data','weekly_feed_overuse') returning id`;
      let score_log_insert_result_f = await client
        .query(score_log_insert_query_f)
        .catch((err) => console.log(err));
      if (score_log_insert_result_f) {
        // Updating batch and daily data with the scores
        let update_score_query_f = `with daily_data_update AS (UPDATE farm.intg_daily_data SET batch_score = ${new_score_f} WHERE id = ${daily_data["id"]}) UPDATE farm.intg_batches SET score = ${new_score_f} WHERE id = ${batch_id} returning id`;
        let update_score_result_f = client
          .query(update_score_query_f)
          .catch((err) => console.log(err));
        update_score_result_f &&
          console.log(
            `The data  is updated successfully`
          );
      }
    }
  }
};
