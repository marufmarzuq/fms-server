const express = require("express");
const router = express.Router();

const {
  addHatchery,
  updateHatcheryImage,
  getHatcheries,
} = require("../controllers/hatchery");
const {
  addSatellite,
  searchSupervisor,
  getSatelliteFarms,
} = require("../controllers/satellite");
const { updateScore } = require("../controllers/score");
const { handleImage } = require("../controllers/imageHandling");
const {
  addIdeaFarm,
  showAllSupervisors,
  showAllHatcheries,
  getIdeaFarms,
} = require("../controllers/idea_farm");
const {
  approveFarmer,
  searchFarmer,
  addFarmer,
  getAllFarmers,
} = require("../controllers/farmer");
const {
  addBatch,
  showHatchery,
  po_number,
  transport_bill,
  showStockCategory,
  showStockSubCategory,
  getAllProducts,
  getBatches,
} = require("../controllers/batch");
const {
  showIdeaFarms,
  showSatelliteFarms,
  showBatches,
  showSupervisors,
  showTasks,
  addTask,
  getTasks,
} = require("../controllers/task");
const { main_overview, batch_overview } = require("../controllers/overview");
const {
  getDailyData,
  addDailyData,
  getCategory,
} = require("../controllers/daily_data");

const { showProduct_Quantity, createSale } = require("../controllers/sale");
const {
  showVaccines,
  vaccinationDate,
  createVaccination,
} = require("../controllers/vaccination");
const { createStock } = require("../controllers/stock");

router.post("/add-hatchery", addHatchery);
router.post("/add-batch", addBatch);
router.post("/add-satellite", addSatellite);
router.post("/add-idea-farm", addIdeaFarm);
router.get("/get-unapproved-farmers", approveFarmer);
router.post("/update-hatchery-image", updateHatcheryImage);
router.get("/show-idea-farms", showIdeaFarms);
router.get("/show-satellite-farms", showSatelliteFarms);
router.get("/show-batches", showBatches);
router.get("/show-supervisors", showSupervisors);
router.get("/show-all-supervisors", showAllSupervisors);
router.get("/show-tasks", showTasks);
router.get("/search-supervisor", searchSupervisor);
router.get("/show-farmer", searchFarmer);
router.post("/add-farmer", addFarmer);
router.get("/show-all-hatcheries", showAllHatcheries);
router.get("/show-hatcheries", showHatchery);
router.get("/get-po-detail", po_number);
router.get("/get-transport-bill", transport_bill);
router.get("/get-stock-category", showStockCategory);
router.get("/get-stock-sub-category", showStockSubCategory);
router.get("/get-all-products", getAllProducts);
router.get("/show-vaccines", showVaccines);
router.get("/show-vaccination-date", vaccinationDate);
router.post("/create-vaccination", createVaccination);
router.get("/get-product-quantity", showProduct_Quantity);
router.post("/add-task", addTask);
router.post("/create-sale", createSale);
router.post("/add-stock", createStock);
router.get("/overview", main_overview);
router.get("/batch-overview", batch_overview);
router.get("/get-satellite-farms", getSatelliteFarms);
router.get("/get-idea-farms", getIdeaFarms);
router.get("/get-batches", getBatches);
router.get("/get-all-farmers", getAllFarmers);
router.get("/get-hatcheries", getHatcheries);
router.get("/get-tasks", getTasks);
router.get("/get-daily-data", getDailyData);
router.get("/update-score", updateScore);
router.post("/handle-image", handleImage);
router.get("/get-category", getCategory);
router.post("/add-daily-data", addDailyData);

module.exports = router;
