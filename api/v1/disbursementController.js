const fs = require("fs");
const csv = require("fast-csv");
const { Parser } = require("json2csv");
const formidable = require("formidable");
const csvParser = require("csv-parser");
const rp = require("request-promise");
const BASE_CURRENCY_URL = "https://api.exchangeratesapi.io/latest";
const OPEN_EXCHANGE =
  "https://openexchangerates.org/api/latest.json?app_id=686b6ab396494adb8dded6c4eae48853";

  var jsonexport = require('jsonexport');

exports.currencyList = async (req, res, next) => {
  try {
    let data = await rp(BASE_CURRENCY_URL);

    res.status(200).send(Object.keys(JSON.parse(data).rates));
  } catch (e) {
    return res.status(422).send({ message: e, status: "failed" });
  }
};

const groupBy = (array, key) => {
  let keyGroup = {};
  // Return the end result
  return array.reduce((result, currentValue) => {
    // If an array already present for key, push it to the array. Else create an array and push the object
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    );
    // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
    return result;
  }, {}); // empty object is the initial value for result object
};

const validateInput = (res, validate_format ) => {
  
  if (validate_format.length < 6) {
    return res.status(403).send({
      message: "please fill all header rows",
      status: "failed"
    });
  }

  // if(validate_format[0] != '﻿Date'){ return res.status(403).send({message : "first header should be date", status : "failed"})};
  if (validate_format[0] != "Date") {
    return res.status(403).send({
      message: "first header should be date",
      status: "failed"
    });
  }

  if (validate_format[1] != "Order Id") {
    return res.status(403).send({
      message: "Second column header should be the Order Id",
      status: "failed"
    });
  }

  if (validate_format[2] != "Nonprofit") {
    return res.status(403).send({
      message: "Third column header should be the Non profit",
      status: "failed"
    });
  }

  if (validate_format[3] != "Donation Currency") {
    return res.status(403).send({
      message: "Second column header should be Donation Currency",
      status: "failed"
    });
  }

  if (validate_format[4] != "Donation Amount") {
    return res.status(403).send({
      message: "Second column header should be the Donation",
      status: "failed"
    });
  }

  if (validate_format[5] != "Fee") {
    return res.status(403).send({
      message: "Second column header should be the Fee",
      status: "failed"
    });
  }

}


exports.handleUploads = async (req, res, next) => {
  let currencyList = await rp(BASE_CURRENCY_URL);

  let currencyCode = Object.keys(JSON.parse(currencyList).rates);
  let array = [];
  let i = Number(1);

  var form = new formidable.IncomingForm();

  form.parse(req, async function(err, fields, files) {
    const { baseCurrency } = fields;

    if (!baseCurrency) {
      return res
        .status(403)
        .send({ message: "please select a base currency", status: "failed" });
    }

    if (currencyCode.includes(fields.baseCurrency) === false) {
      return res.status(403).send({
        message: "please select only allowed currency",
        status: "failed"
      });
    }

    let conversion = await rp(BASE_CURRENCY_URL + `/?base=${baseCurrency}`, {
      headers: {
        Connection: "keep-alive",
        "Accept-Encoding": "",
        "Accept-Language": "en-US,en;q=0.8"
      }
    });

    let OpenXchange = await rp(OPEN_EXCHANGE);

    var oldpath = files.file.path;
    var newpath = process.cwd() + "/uploads/" + files.file.name;

    fs.rename(oldpath, newpath, async function(err) {
      if (err) throw err;

      console.log("file moved successfully");

      let csvstream = csv
        .fromPath(newpath, { headers: true })
        .on("data", async function(row) {
          
          let validate_format = Object.keys(row);

          //validate csv headers
          validateInput(res, validate_format);

          if (conversion) {
            let conversion_rate = JSON.parse(conversion).rates;
            let Donation_currency = row["Donation Currency"];
            
            

            if (conversion_rate[Donation_currency]) {
                           
              let converted_rate = conversion_rate[Donation_currency];
              let Donation_amount = Number(row["Donation Amount"]) || Number(parseInt(row["Donation Amount"].replace(/\,/g, ""), 10));
              let fee             = Number(row["Fee"]) || Number(parseInt(row["Fee"].replace(/\,/g, ""), 10));

              let converted_Donation_amount = Donation_amount / Number(converted_rate);
              
              
            
            let Donated_fee = fee/Number(converted_rate);
              
              row["Fee"] = Donated_fee;
              row["Donation Amount"] = converted_Donation_amount;
              row["BaseCurrency"] = baseCurrency;

              array.push(row);
            } else {
        
              let Xchange_converted_rate = JSON.parse(OpenXchange).rates;
              
              let Donation_currency_to_dollars_rate = Xchange_converted_rate[Donation_currency];
              
              let Donation_amount_in_dollars = Number(row["Donation Amount"]) / Number(Donation_currency_to_dollars_rate) || (Number(parseInt(row["Donation Amount"].replace(/\,/g, ""), 10)) / Number(Donation_currency_to_dollars_rate));
              
              let Donation_fee_in_dollars = Number(row["Fee"]) / Number(Donation_currency_to_dollars_rate);

              let baseCurrency_to_dollarRate = Xchange_converted_rate[baseCurrency];
              let converted_baseCurrency = (Number(Donation_amount_in_dollars)) * (Number(baseCurrency_to_dollarRate));
              let converted_fee = Number(Donation_fee_in_dollars) * Number(baseCurrency_to_dollarRate);

              row["Fee"] = converted_fee;
              row["Donation Amount"] = converted_baseCurrency;

              array.push(row);
            }
          }
        })
        .on("end", async function() {
          try {
            let new_arr = [];

            let grouped = groupBy(array, "Nonprofit");
            let entries = Object.entries(grouped);

            for (const [donor, donation] of entries) {
              var totalDonation = donation.reduce(
                (accum, item) =>
                  Number(accum) + Number(item["Donation Amount"]),
                0
              );

              var totalFee = donation.reduce(
                (accum, item) => accum + item.Fee,
                0
              );

              new_arr.push({
                Nonprofit: donor,
                "Total amount": totalDonation,
                "Total Fee": totalFee,
                "Number of Donations": donation.length
              });
            }
            jsonexport(new_arr,function(err, csv){
              if(err) return console.log(err);
              res.send(csv);
          });

          } catch (e) {
            console.log(e);
          }
        })
        .on("error", function(error) {
          return res.status(422).send({message : "something went wrong", status: "failed"});
        });
    });
  });
};
