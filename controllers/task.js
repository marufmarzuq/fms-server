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

exports.addTask = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let {
    batch_id,
    assigned_by,
    supervisor_id,
    task_description,
    task_type,
    due_by,
  } = req.body;
  console.log(req.body);
  let request_query = `SELECT id FROM farm.intg_task_category WHERE task_name='${task_type}'`;

  let request_result = await client.query(request_query).catch((err) => {
    console.log(err);
  });

  // let due_by_data = request_result.rows[0].due_by;

  let task_id = request_result.rows[0].id;

  let curr_date_time = dayjs().format("YYYY-MM-DD HH:mm");

  due_by = dayjs(due_by).format("YYYY-MM-DD HH:mm");
  console.log("due",due_by)

  // let due_by = dayjs().add(due_by, "hour").format("YYYY-MM-DD HH:mm");

  assigned_by = 1;

  let query = `insert into farm.intg_admin_tasks (batch_id, task_id, assigned_on,

            assigned_by, supervisor_id, due_by, task_description,task_status) values (${batch_id}, ${task_id}, '${curr_date_time}',

                 '${assigned_by}',${supervisor_id} ,'${due_by}', '${task_description}',0) returning id`;

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "task has been added", data: result.rows });
};

exports.showIdeaFarms = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let query = `select id as value, name as label from farm.intg_idea_farms`;
  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "all idea farm", data: result.rows });
};

exports.showSatelliteFarms = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let id = req.query.id;
  console.log(id);
  let query = `select id as value, name as label from farm.intg_satellite_farms where idea_farm_id = ${id}`;
  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "all satellite farm", data: result.rows });
};

exports.showBatches = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let id = req.query.satellite_farm_id;

  let query = `select id as value,id as label,product_id from farm.intg_batches where satellite_farm_id = ${id}`;
  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({
        status: true,
        msg: "all batches from satellite farm",
        data: result.rows,
      });
};

exports.showSupervisors = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let { idea_farm_id, satellite_farm_id } = req.query;

  let query = `select supervisor_id, name from farm.intg_batches inner join farm.intg_admins on intg_batches.supervisor_id = intg_admins.id where idea_farm_id = ${idea_farm_id} and satellite_farm_id = ${satellite_farm_id}`;

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "all supervisors", data: result.rows });
};

exports.showTasks = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let query = `select task_name,id from farm.intg_task_category`;
  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "all supervisors", data: result.rows });
};

exports.showAllTasks = (req, res) => {};

exports.getTasks = async (req, res) => {
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
  filter_key.length ? (filter_key = "WHERE " + `t.${filter_key}`) : (filter_key = "");

  if (sort_params) {
    sort_params = JSON.parse(sort_params);
    for (key in sort_params) {
      sort_key = `ORDER BY ${key} ${sort_params[key]}`;
    }
  }
  let get_tasks_query = `SELECT t.id,t.task_description,t.due_by,
  (SELECT name FROM farm.intg_admins WHERE id = t.supervisor_id) AS supervisor_name,
  (SELECT phone FROM farm.intg_admins WHERE id = t.supervisor_id) AS supervisor_phone,
  (SELECT name FROM farm.intg_admins WHERE id = t.assigned_by) AS assignee_name,
  (SELECT name FROM farm.intg_satellite_farms WHERE id = b.satellite_farm_id) AS satellite_farm_name,
  (SELECT name FROM farm.intg_farmers WHERE id = b.farmer_id) AS farmer_name,
  (SELECT phone FROM farm.intg_farmers WHERE id = b.farmer_id) AS farmer_phone,(SELECT COUNT(id) FROM farm.intg_admin_tasks f ${filter_key}) AS total_entries FROM farm.intg_admin_tasks t LEFT JOIN farm.intg_batches b ON t.batch_id = b.id ${filter_key}  ${sort_key} ${limit} ${offset}`;
  console.log(get_tasks_query);
  const result = await client
    .query(get_tasks_query)
    .catch((err) => console.log(err));
  let tasks = result.rows;
  let totalPages =0
  let totalEntries = 0
  if(tasks.length> 0){
  totalPages = Math.ceil(result.rows[0].total_entries / page_size);
  totalEntries = result.rows[0].total_entries
  }
  tasks.forEach((element) => {
    delete element["total_entries"];
    element["due_by"] = dayjs(element["due_by"]).format("DD/MM/YYYY")
  });
  console.log(tasks);
  res.status(200).send({ data: { totalPages: totalPages, tasks: tasks,totalEntries : totalEntries } });
};
