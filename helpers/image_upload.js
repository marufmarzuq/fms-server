const res = require("express/lib/response");

let uploadImage = (image_bucket_name, image_name, params) => {
  var axios = require("axios");
  var FormData = require("form-data");
  var fs = require("fs");
  var data = new FormData();

  if (Array.isArray(params)) {
    params.forEach((param) => {
      data.append("files", param);
    });
    data.append("image_names", `${image_name}`);
  } else {
    data.append("files", params);
    data.append("image_names", `${image_name}`);
  }

  var config = {
    method: "post",
    url: `https://farm-media-node-prod-33ua6pirea-uc.a.run.app/api/v1/images-upload?bucket_name=${image_bucket_name}`,
    headers: {
      Authorization: "Basic YXFncm9tYWxpbjphcWFpLWludGctZmFybQ==",
      ...data.getHeaders(),
    },
    data: data,
  };

  axios(config).catch(function (error) {
    console.log(error);
  });
};

module.exports = uploadImage;


// code to get file directly and upload data in gcp ///////////////////
let uploadImageGcp = (
  image_bucket_name,
  phone,
  hatchery_image,
  hatchery_video,
  format
) => {
  let curr_date = dayjs().format("YYYYMMDDHHmm");
  
  const createMediaData = (media) => {
    mediaOutput = {name : [], file : []}
    for(let i =0; i <media.length;i++) {
      mediaName = `${curr_date}_satellite_image_${phone}_${i+1}.${format}`;
      mediaUrl = `https://storage.googleapis.com/${image_bucket_name}/${mediaName}`
      mediaOutput["name"].push(mediaName)
      mediaOutput["file"].push(mediaUrl)
    }
    return mediaOutput
  }
let photoUploadData =  createMediaData(hatchery_image)
let videoUploadData =  createMediaData(hatchery_video)

uploadImage(image_bucket_name,photoUploadData["name"],photoUploadData["file"])
uploadImage(image_bucket_name,videoUploadData["name"],videoUploadData["file"])
};
