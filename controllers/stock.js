const pkg = require("pg");
const { Client } = pkg;
const axios = require("axios")

const dotenv = require("dotenv");
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.createStock = async(req, res) => {
console.log(req.body)

    const client = new Client(DB_CONFIG);
    client.connect();

    let {stock_id, stock_type, po_name, po_description, po_cost, transport_description, from_name, to_name, po_number, transport_date, transport_name ,transport_cost, stock_cost,
        stock_quantity, stock_unit} = req.body
console.log(transport_date,po_number)
   let query = `insert into farm.intg_stock_logs (stock_id, stock_type, po_name, po_description, po_cost, transport_description,transport_name,transport_cost, stock_price, stock_quantity,stock_unit, from_name,
        to_name, po_number, transport_date) values (${stock_id}, '${stock_type}', '${po_name}', (E'${po_description}'), ${po_cost}, (E'${transport_description}'),(E'${transport_name}'), ${transport_cost},${stock_cost}, ${stock_quantity},'${stock_unit}',
       '${from_name}', ${to_name}, '${po_number}', '${transport_date}') returning id`

        console.log("query is", query)

        result = await client.query(query).catch((err) => console.log(err));
                    !result.rows.length &&
                    res.status(500).send({ status: false, msg: "Something went wrong" });
                    result.rows.length &&
                    res
                     .status(200)
                    .send({ status: true, msg: "stock is added", data: result.rows });
}
