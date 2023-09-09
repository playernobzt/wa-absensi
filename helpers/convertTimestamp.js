const moment = require("moment");
const localize = require("moment/locale/id");

function convert(time) {
  const data = {
    hari: moment(time).local("id").format("dddd"),
    tanggal: moment(time).local("id").format("LL"),
    jam: parseInt(moment(time).local("id").format("HH")),
    menit: moment(time).local("id").format("mm"),
  };

  return data;
}

module.exports = convert;
