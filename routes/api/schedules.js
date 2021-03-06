const express = require("express");
const router = express.Router();
const AlarmSchedule = require("./../../models/AlarmSchedule");
const isEmpty = require("./../../validators/is-empty");
const filterId = require("./../../utils/filterId");
const validateInput = require("./../../validators/schedules");
const moment = require("moment-timezone");
const Model = AlarmSchedule;

router.get("/:id", (req, res) => {
  Model.findById(req.params.id)
    .then(record => res.json(record))
    .catch(err => console.log(err));
});

router.get("/", (req, res) => {
  const form_data = isEmpty(req.query)
    ? {}
    : {
        label: {
          $regex: new RegExp("^" + req.query.s, "i")
        }
      };

  Model.find(form_data)
    .sort({ _id: -1 })
    .then(records => {
      return res.json(records);
    })
    .catch(err => console.log(err));
});

router.put("/", (req, res) => {
  const { isValid, errors } = validateInput(req.body);

  if (!isValid) {
    return res.status(401).json(errors);
  }
  const body = filterId(req);

  Model.findOne({
    label: req.body.label
  }).then(record => {
    if (record) {
      errors["label"] = "Label already exists";
      return res.status(401).json(errors);
    } else {
      const datetime = moment.tz(moment(), process.env.TIMEZONE);
      const log = `Added by ${req.body.user.name} on ${datetime.format("LLL")}`;

      const logs = [
        {
          user: req.body.user,
          datetime,
          log
        }
      ];

      const newRecord = new Model({
        ...body,
        logs
      });
      newRecord
        .save()
        .then(record => {
          addToSchedule(record);
          return res.json(record);
        })
        .catch(err => console.log(err));
    }
  });
});

router.post("/:id", (req, res) => {
  const { isValid, errors } = validateInput(req.body);

  if (!isValid) {
    return res.status(401).json(errors);
  }

  const body = filterId(req);

  Model.findById(req.params.id).then(record => {
    if (record) {
      const datetime = moment.tz(moment(), process.env.TIMEZONE);
      const log = `Modified by ${req.body.user.name} on ${datetime.format(
        "LLL"
      )}`;

      const logs = [
        ...record.logs,
        {
          user: req.body.user,
          datetime,
          log
        }
      ];

      record.set({
        ...body,
        logs
      });

      record
        .save()
        .then(record => {
          deleteJobs();
          loadSchedules();
          return res.json(record);
        })
        .catch(err => console.log(err));
    } else {
      console.log("ID not found");
    }
  });
});

router.delete("/:id", (req, res) => {
  Model.findByIdAndRemove(req.params.id)
    .then(response => res.json({ success: 1 }))
    .catch(err => console.log(err));
});

module.exports = router;
