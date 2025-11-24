const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  eventRequestValidation,
  eventPurchaseValidation,
} = require("../middleware/validators");

router.get("/upcoming", eventController.listUpcomingEvents);

router.use(authMiddleware);

router.post("/requests", eventRequestValidation, eventController.requestEvent);
router.get("/requests/mine", eventController.listMyRequests);
router.post("/:eventId/purchase", eventPurchaseValidation, eventController.purchaseTicket);
router.get("/my-tickets", eventController.listMyTickets);

module.exports = router;
