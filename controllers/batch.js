const pkg = require("pg");
const { Client } = pkg;
const axios = require("axios");
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

exports.addBatch = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  console.log("request is", req.body);
  let {
    idea_farm_id,
    satellite_farm_id,
    hatchery_id,
    supervisor_id,
    product_id,
    po_name,
    po_description,
    po_cost,
    transport_name,
    transport_description,
    transport_cost,
    stock_id,
    product_quantity,
    po_number,
    transport_date,
    source_date,
    stock_cost,
    stock_unit,
    feed_cost,
    feed_id,
    feed_quantity,
    feed_sub_category,
    feed_unit,
    stock_sub_category,
    stock_quantity,
    category,
  } = req.body;
  po_description = po_description ? po_description : null;
  transport_description = transport_description ? transport_description : null;

  let farmer_query = `select farmer_id from farm.intg_satellite_farms where id = ${satellite_farm_id}`;
  farmer_result = await client
    .query(farmer_query)
    .catch((err) => console.log(err));

  let farmer_id = farmer_result.rows[0].farmer_id;
  let query = `select vaccine_days,age from farm.intg_products where id = ${product_id}`;
  // console.log("query is", query)
  result = await client.query(query).catch((err) => console.log(err));

  let product_price = [];

  let feed_available = [];

  let stock_price = {
    type: "stock_price ",

    category: "",
    id: "",

    quantity: "",

    unit: "",
    cost: "",
  };

  let feed_price = {
    type: "",

    category: "feed_bag",

    quantity: "",

    unit: "",
    cost: "",
  };
  if (!Array.isArray(feed_sub_category)) {
    feed_price.type = feed_sub_category;

    feed_price.quantity = feed_quantity;

    feed_price.unit = feed_unit;
    feed_price.cost = feed_cost;

    feed_available.push(feed_price);

    feed_price = {};
  } else {
    for (let i = 0; i < feed_sub_category.length; i++) {
      feed_price.type = feed_sub_category[i];
      feed_price.quantity = feed_quantity[i];
      feed_price.unit = feed_unit[i];
      feed_price.cost = feed_cost[i];
      feed_available.push(feed_price);

      feed_price = {
        type: "",
        category: "feed_bag",
        quantity: "",
        unit: "",
        cost: "",
      };
    }
  }

  if (!Array.isArray(category)) {
    stock_price.category = category;

    stock_price.id = stock_id;
    stock_price.quantity = stock_quantity;

    stock_price.unit = stock_unit;
    stock_price.cost = stock_cost;

    product_price.push(stock_price);

    stock_price = {};
  } else {
    for (let i = 0; i < category.length; i++) {
      stock_price.category = category[i];
      stock_price.id = stock_id[i];
      stock_price.quantity = stock_quantity[i];
      stock_price.unit = stock_unit[i];
      stock_price.cost = stock_cost[i];
      product_price.push(stock_price);

      stock_price = {
        type: "stock_price ",
        category: "",
        id: "",
        quantity: "",
        unit: "",
        cost: "",
      };
    }
  }

  let transport_price = {
      type: "transport_cost",
      price: transport_cost,
      transport_date: transport_date,
    },
    po_price = {
      type: "po_price",
      price: po_cost,
      po_date: transport_date,
    };

  product_price.push(transport_price);
  product_price.push(po_price);
  product_price.push();
  product_price = JSON.stringify(product_price);
  feed_available = JSON.stringify(feed_available);

  console.log(
    "transport price is",
    transport_price,
    "po price is",
    po_price,
    "stock price",
    stock_price
  );

  console.log("product price json is", product_price);

  let vaccine_days = result.rows[0].vaccine_days;
  let age = result.rows[0].age;
  console.log("result is", vaccine_days, "result2 is", age);

  let estimated_date = dayjs(transport_date);
  estimated_date = estimated_date.add(`${age}`, "day");
  estimated_date = estimated_date.format("YYYY-MM-DD");
  // source_date = dayjs(source_date).format("YYYY-MM-DD")

  let query2_ = `insert into farm.intg_batches (farmer_id, idea_farm_id, satellite_farm_id, product_id, hatchery_id,

         supervisor_id, source_date, est_harvest_date, inbound_quantity, score, input_cost,feed_bag_issued,feed_bag_available, current_quantity,status) values (${farmer_id}, ${idea_farm_id},
            ${satellite_farm_id}, ${product_id}, ${hatchery_id},  
            ${supervisor_id}, '${source_date}', '${estimated_date}', ${product_quantity}, 100, '${product_price}', '${feed_available}','${feed_available}', ${product_quantity},1) returning id`;

  console.log("second query is", query2_);

  result2 = await client.query(query2_).catch((err) => console.log(err));

  let batch_id = result2.rows[0].id;
  console.log("result 2 is", result2);

  let vaccinations = [];

  let vaccination_details = {
    date: "",
    name: "",
    status: "",
  };
  for (let i = 0; i < vaccine_days.length; i++) {
    transport_date = dayjs(transport_date);
    let vaccine_day = transport_date.add(`${vaccine_days[i].day}`, "day");
    vaccine_day = vaccine_day.format("YYYY-MM-DD");
    let query3 = `insert into farm.intg_vaccination (batch_id, name_en, scheduled_date, status)
                            values (${batch_id}, '${vaccine_days[i].vaccine}', '${vaccine_day}', 0) returning id`;
    vaccination_details.date = vaccine_day;
    vaccination_details.name = vaccine_days[i].vaccine;
    vaccination_details.status = "pending";
    vaccinations.push(vaccination_details);
    vaccination_details = {};
    console.log("query 3", query3);
    result3 = await client.query(query3).catch((err) => console.log(err));
  }

  console.log("vaccination details are", vaccinations);
  vaccinations = JSON.stringify(vaccinations);

  let query4 = `update farm.intg_batches set vaccinations = '${vaccinations}' where id = ${batch_id}`;
  result4 = await client.query(query4).catch((err) => console.log(err));

  for (let i = 0; i < stock_id.length; i++) {
    console.log(stock_id[i]);
    let query5 = `insert into farm.intg_stock_logs (stock_id, stock_type, po_name, po_description, po_cost, transport_description,transport_name,transport_cost, stock_price, stock_quantity,stock_unit, from_name,
                  to_name, po_number, transport_date) values (${stock_id[i]}, 'INBOUND', '${po_name}', (E'${po_description}'), ${po_cost}, (E'${transport_description}'),(E'${transport_name}'), ${transport_cost},${stock_cost[i]}, ${stock_quantity[i]},'${stock_unit[i]}',
                  ${idea_farm_id}, ${satellite_farm_id}, '${po_number}', '${transport_date}') returning id`;
    console.log("query5 is", query5);
    result5 = await client.query(query5).catch((err) => console.log(err));
  }

  for (let i = 0; i < feed_id.length; i++) {
    let query6 = `insert into farm.intg_stock_logs (stock_id, stock_type, po_name, po_description, po_cost, transport_description,transport_name,transport_cost, stock_price, stock_quantity,stock_unit, from_name,
                to_name, po_number, transport_date) values (${feed_id[i]}, 'INBOUND', '${po_name}', (E'${po_description}'), ${po_cost}, (E'${transport_description}'),(E'${transport_name}'), ${transport_cost},${feed_cost[i]}, ${feed_quantity[i]},'${feed_unit[i]}',
                ${idea_farm_id}, ${satellite_farm_id}, '${po_number}', '${transport_date}') returning id`;

    console.log("query6 is", query6);
    result6 = await client.query(query6).catch((err) => console.log(err));
  }
  !result6.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "batch has beed added ", data: result4.rows });
};

exports.showStockCategory = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let query = `select category from farm.intg_stock`;

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "hatchery list", data: result.rows });
};

exports.showStockSubCategory = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let { product_id, category } = req.query;
  console.log(product_id, category);

  let query = `select sub_category, id from farm.intg_stock where category = '${category}' and product_id = '${product_id}'`;
  console.log(query);
  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "hatchery list", data: result.rows });
};

exports.showHatchery = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let id = req.query.idea_farm_id;
  console.log(req.query);
  let query = `select name,id from farm.intg_hatcheries where id = ANY(ARRAY(select hatcheries from farm.intg_idea_farms where id = ${id}))`;

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "hatchery list", data: result.rows });
};

exports.transport_bill = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let { bill_number } = req.query;
  console.log("bill number is", bill_number);
  let organization_id = 60006587985;
  let refresh_token =
    "1000.640ea5fc58b55cb9cdecab7e76d941cc.c7d7a4cb4bc4517f316b5a11cb284ab5";
  let client_id = "1000.ZNQ9ZUU1FV555C8L6F6XCJQ3OBO99D";
  let client_secret = "f072691d90ecc62dd5b01ec098ecb8f380f00594ec";
  let usertoken_url = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token`;

  // creating the token for zoho authorisation ////////////////////////////////////////////ZOHO API

  let resp = await axios.post(usertoken_url);
  // console.log("user token url is", resp.data.access_token)
  let token = resp.data.access_token;

  // api to check whether a contact is present in database ////////////////////////////////ZOHO API
  let trasnport_bill_url = `https://books.zoho.in/api/v3/bills?organization_id=${organization_id}&bill_number=${bill_number}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  };
  try{
  let transport_bill_details = await axios.get(trasnport_bill_url, config);
  }catch(err){
    res.send({status:false})
  }
  if (transport_bill_details.data.bills.length === 0) {
    console.log("if hitting");
    res.send({ msg: false });
  }
  //   console.log("bill details are", transport_bill_details.data)
  else {
    let bill_id = transport_bill_details.data.bills[0].bill_id;
    // console.log("bill id is", bill_id)
    let cost = transport_bill_details.data.bills[0].total;
    // console.log("cost is", cost)

    let po_id_url = `https://books.zoho.in/api/v3/bills/${bill_id}?organization_id=${organization_id}`;
    const config1 = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    };
    let transport_bill_all_details = await axios
      .get(po_id_url, config1)
      .catch((err) => {
        console.log("error is", err);
      });

    // console.log("get po all details", transport_bill_details)

    if (transport_bill_all_details.data) {
      res.status(200).send({
        vendor_name: transport_bill_all_details.data.bill.vendor_name,
        cost: cost,
        description:
          transport_bill_all_details.data.bill.line_items[0].description,
      });
    } else {
      res.status(500).send({ msg: "data is not available for the given po" });
    }
  }
};

exports.po_number = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let { po_number } = req.query;
  let organization_id = 60006587985;
  console.log(organization_id);
  let refresh_token =
    "1000.e96282b4cc4be597aef75649f84093d2.a014ffd11e2c893f7a1c82117795c267";
  console.log(refresh_token);
  let client_id = "1000.ZNQ9ZUU1FV555C8L6F6XCJQ3OBO99D";
  let client_secret = "f072691d90ecc62dd5b01ec098ecb8f380f00594ec";
  let usertoken_url = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token`;

  // creating the token for zoho authorisation ////////////////////////////////////////////ZOHO API
  console.log("token", usertoken_url);
  let resp = await axios.post(usertoken_url);
  // console.log("user token url is", resp.data.access_token)
  let token = resp.data.access_token;

  // api to check whether a contact is present in database ////////////////////////////////ZOHO API
  let po_url = `https://books.zoho.in/api/v3/purchaseorders?organization_id=${organization_id}&purchaseorder_number=${po_number}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Zoho-oauthtoken ${token}`,
    },
  };
  console.log("po_url", po_url);
  try{
  let get_po_details = await axios.get(po_url, config);
  }catch(err) {
    res.send({status:false})
  }
  if (get_po_details.data.purchaseorders.length === 0) {
    console.log("hitting");
    res.send({ msg: false });
  }
  // console.log("po details are", get_po_details.data)
  else {
    let po_id = get_po_details.data.purchaseorders[0].purchaseorder_id;
    let cost = get_po_details.data.purchaseorders[0].total;

    let po_id_url = `https://books.zoho.in/api/v3/purchaseorders/${po_id}?organization_id=${organization_id}`;
    const config1 = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    };
    let get_po_all_details = await axios
      .get(po_id_url, config1)
      .catch((err) => {
        // console.log("error is", err);
      });

    // console.log("get po all details", get_po_all_details)

    if (get_po_details.data) {
      res.status(200).send({
        vendor_name: get_po_all_details.data.purchaseorder.vendor_name,
        cost: cost,
        description:
          get_po_all_details.data.purchaseorder.line_items[0].description,
      });
    } else {
      res.status(500).send({ msg: "data is not available for the given po" });
    }
  }
};

exports.getAllProducts = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let query = `select id, product_sub_category from farm.intg_products`;

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "products list", data: result.rows });
};

exports.getBatches = async (req, res) => {
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
  filter_key = "WHERE " + `${filter_key}`;

  if (sort_params) {
    sort_params = JSON.parse(sort_params);
    for (key in sort_params) {
      sort_key = `ORDER BY ${key} ${sort_params[key]}`;
    }
  }
  let get_batches_query = `SELECT b.id,(SELECT sf.name FROM farm.intg_satellite_farms sf WHERE sf.id = b.satellite_farm_id) AS farm_name,(SELECT f.name FROM farm.intg_farmers f WHERE f.id = farmer_id) AS farm_owner, (SELECT p.name_en FROM farm.intg_products p WHERE p.id = product_id) AS product, b.inbound_quantity,b.current_quantity, b.mortality,b.est_harvest_date AS harvest_by,json_agg(json_build_object('label',dw.date,'x',dw.day,'y',dw.mortality)) AS mortality_trend,json_agg(json_build_object('label',dw.date,'x',dw.day,'y',dw.feed_bags_used)) AS feed_trend,b.status,b.score,(SELECT COUNT(ib.id) FROM farm.intg_batches ib ${filter_key}) AS total_entries FROM farm.intg_batches b LEFT JOIN farm.intg_daily_data dw ON dw.batch_id = b.id ${filter_key} GROUP BY b.id,b.satellite_farm_id,b.farmer_id,b.product_id,b.inbound_quantity,b.current_quantity, b.mortality,b.status,b.score,b.est_harvest_date ${sort_key} ${limit} ${offset}`;
  console.log(get_batches_query);
  const result = await client
    .query(get_batches_query)
    .catch((err) => console.log(err));
  let batches = result.rows;
  let totalPages = 0;
  let totalEntries;
  if (batches.length >1) {
    totalPages = Math.ceil(result.rows[0].total_entries / page_size);
    totalEntries = result.rows[0].total_entries;
  }
  batches.forEach((element) => {
    delete element["total_entries"];
    element["harvest_by"] = dayjs(element["harvest_by"]).format("DD/MM/YYYY");
  });
  res
    .status(200)
    .send({
      data: {
        totalPages: totalPages,
        batches: batches,
        totalEntries: totalEntries,
      },
    });
};