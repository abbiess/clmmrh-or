const express = require("express");
const router = express.Router();
const ResearchAgenda = require("./../../models/ResearchAgenda");
const isEmpty = require("./../../validators/is-empty");
const filterId = require("./../../utils/filterId");
const validateInput = require("./../../validators/research_categories");
const moment = require("moment-timezone");

const net = require("net");

const Model = ResearchAgenda;

router.get("/:id", (req, res) => {
  Model.findById(req.params.id)
    .then(record => res.json(record))
    .catch(err => console.log(err));
});

router.get("/", (req, res) => {
  const form_data = isEmpty(req.query)
    ? {}
    : {
        desc: {
          $regex: new RegExp(req.query.s, "i")
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
  const user = req.body.user;

  Model.findOne({
    desc: body.desc
  }).then(record => {
    if (record) {
      errors["desc"] = "Transaction already exists";
      return res.status(401).json(errors);
    } else {
      const datetime = moment.tz(moment(), process.env.TIMEZONE);
      const log = `Added by ${user.name} on ${datetime.format("LLL")}`;

      const logs = [
        {
          user,
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

  const filtered_body = filterId(req);
  const user = req.body.user;

  Model.findById(req.params.id).then(record => {
    if (record) {
      const datetime = moment.tz(moment(), process.env.TIMEZONE);
      const log = `Modified by ${user.name} on ${datetime.format("LLL")}`;

      const logs = [
        ...record.logs,
        {
          user,
          datetime,
          log
        }
      ];

      const body = {
        ...filtered_body,
        logs
      };

      record.set({
        ...body
      });

      record
        .save()
        .then(record => {
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
