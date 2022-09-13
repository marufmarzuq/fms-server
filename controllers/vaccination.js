const pkg = require("pg");
const { Client } = pkg;
const dotenv = require("dotenv");
dotenv.config();
const dayjs = require("dayjs");

const uploadImage = require("../helpers/image_upload");

const DB_CONFIG = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

exports.createVaccination = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();
  console.log(req.body);
  let { batch_id, name_en, administered_date, administered_time } = req.body;
  console.log(batch_id, name_en, administered_date, administered_time);
  let vaccination_image_url = null;
  let vaccination_video_url = null;

  if (req.body.vaccination_image) {
    console.log("image if ");
    let image_bucket_name = "aqai-intg-farm-vaccination";
    let curr_date = dayjs().format("YYYYMMDDHHmm");
    let params = req.body.vaccination_image;
    let count = 1;
    let imageName = [];
    let imageURL = [];
    let vaccination_image = [];
    let newArr = [];

    if (!Array.isArray(params)) {
      newArr.push(params);
      console.log("new array block");
      let image_name = `${curr_date}_vaccination-image_${name_en}.png`;
      console.log("image name is", image_name);
      let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
      imageURL.push(images_url);
      imageName.push(image_name);
      vaccination_image.push(
        `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
      );
      uploadImage(image_bucket_name, imageName, newArr);
    } else {
      params.forEach((param) => {
        let image_name = `${curr_date}_vaccination-image_${name_en}_${count}.png`;
        let images_url = `https://storage.googleapis.com/${image_bucket_name}/${image_name}`;
        imageURL.push(images_url);
        imageName.push(image_name);
        vaccination_image.push(
          `'https://storage.googleapis.com/${image_bucket_name}/${image_name}'`
        );
        count++;
      });
      uploadImage(image_bucket_name, imageName, params);
    }

    vaccination_image_url = vaccination_image;
  }
  console.log("vaccination image url is", vaccination_image_url);

  // if (req.body.vaccination_video) {
  //   console.log("vaccination video block");
  //   let image_bucket_name = "aqai-intg-farm-vaccination";
  //   let curr_date = dayjs().format("YYYYMMDDHHmm");
  //   let params = req.body.hatchery_video;
  //   let count = 1;
  //   let imageName = [];
  //   let imageURL = [];
  //   let vaccination_video = [];
  //   let newArr = [];

  //   if (!Array.isArray(params)) {
  //     newArr.push(params);
  //     let video_name = `${curr_date}_vaccination-video_${name_en}.png`;
  //     console.log("video name is");
  //     let video_url = `https://storage.googleapis.com/${image_bucket_name}/${video_name}`;
  //     console.log("video url is", video_url);
  //     imageURL.push(video_url);
  //     imageName.push(video_name);
  //     vaccination_video.push(
  //       `'https://storage.googleapis.com/${image_bucket_name}/${video_name}'`
  //     );
  //     console.log("vaccination video arary",vaccination_video)
  //     console.log("video is going to uploaded")

  //     uploadImage(image_bucket_name, imageName, newArr);
  //     console.log("video is uploaded")
  //   } else {
  //     params.forEach((param) => {
  //       let video_name = `${curr_date}_vaccination-video_${name_en}_${count}.png`;
  //       let video_url = `https://storage.googleapis.com/${image_bucket_name}/${video_name}`;
  //       videoURL.push(video_url);
  //       videoName.push(video_name);
  //       vaccination_video.push(
  //         `'https://storage.googleapis.com/${image_bucket_name}/${video_name}'`
  //       );
  //       count++;
  //     });
  //     uploadImage(image_bucket_name, videoName, params);
  //   }

  //   vaccination_video_url = vaccination_video;
  // }
  // console.log("vaccination video url is", vaccination_video_url);

  let query = `update farm.intg_vaccination set vaccine_administered_date = '${administered_date}', vaccine_administered_time = '${administered_time}', status = 1, images = ARRAY[${vaccination_image_url}] where batch_id= ${batch_id} and name_en = '${name_en}' returning id`;
  result = await client.query(query).catch((err) => console.log(err));

  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "hatchery list", data: result.rows });
};

exports.showVaccines = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let id = req.query.batch_id;
console.log("hi")
  let query = `select name_en from farm.intg_vaccination where batch_id = ${id}`;
console.log(query)
  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
      .status(200)
      .send({ status: true, msg: "hatchery list", data: result.rows });
};
exports.vaccinationDate = async (req, res) => {
  const client = new Client(DB_CONFIG);
  client.connect();

  let { id, name } = req.query;

  let query = `select scheduled_date from farm.intg_vaccination where batch_id = ${id} and name_en = '${name}'`;

  result = await client.query(query).catch((err) => console.log(err));
  !result.rows.length &&
    res.status(500).send({ status: false, msg: "Something went wrong" });
  result.rows.length &&
    res
     .status(200)
    .send({ status: true, msg: "hatchery list", data: result.rows });
}
