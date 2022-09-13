const pkg = require("pg");
const { Client } = pkg;
const dayjs = require('dayjs')

const dotenv = require("dotenv");
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.createSale = async(req, res) => {

    const client = new Client(DB_CONFIG);
    client.connect();

    let {batch_id, product_id, idea_farm_id, satellite_farm_id, so_number, sale_quantity,sale_date, sale_price} = req.body
console.log(product_id)
    let sale_array = []

    let sale_object = {
        "so_number" : so_number,
        "sale_quantity":sale_quantity,
        "sale_price" : sale_price,
        "product_id" : product_id,
        "sales_date" : sale_date
    }
    sale_array.push(sale_object)
    sale_array = JSON.stringify(sale_array)

    console.log("sale array is", sale_array)

    let query = `update farm.intg_batches set sales_data = '${sale_array}', current_quantity = current_quantity - ${sale_quantity} where id = ${batch_id} and idea_farm_id = ${idea_farm_id} and satellite_farm_id = ${satellite_farm_id} returning id`
    console.log("query is", query)

    result = await client.query(query).catch((err) => console.log(err));

    let query2 = `insert into farm.intg_sales (batch_id, product_id, sales_order_no, quantity, amount, sale_date) values (${batch_id}, 
        ${product_id}, '${so_number}', ${sale_quantity}, ${sale_price}, '${sale_date}') returning id`
        result2 = await client.query(query2).catch((err) => console.log(err));
console.log("q2",query2)
    !result2.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
    result2.rows.length &&
    res
        .status(200)
        .send({ status: true, msg: "all supervisors", data: result.rows });


}
exports.showProduct_Quantity = async (req, res) => {

    const client = new Client(DB_CONFIG);
    client.connect();

    let id = req.query.batch_id

    let query = `select product_sub_category, current_quantity,ip.id from farm.intg_batches ib inner join farm.intg_products ip on ib.product_id = ip.id where ib.id = ${id} limit 1`
    console.log("query is", query)

    result = await client.query(query).catch((err) => console.log(err));
    !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
    result.rows.length &&
    res
        .status(200)
        .send({ status: true, msg: "all supervisors", data: result.rows });

}
