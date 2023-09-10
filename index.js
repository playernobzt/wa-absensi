const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
// const { body, validationResult } = require("express-validator");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
// const fs = require("fs");
const convert = require("./helpers/convertTimestamp.js");
// const { phoneNumberFormatter } = require("./helpers/formatter.js");
const fileUpload = require("express-fileupload");
const axios = require("axios");
// const mime = require("mime-types");

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  fileUpload({
    debug: true,
  })
);

app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: __dirname,
  });
});

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});

client.on("message", async (msg) => {
  const chat = await msg.getContact();
  const namaPengirim = (chat.number = 6282347431338)
    ? "Ijal"
    : (chat.number = 6282290561992)
    ? "Rio"
    : (chat.number = 6282291930255)
    ? "Leo"
    : (chat.number = 6289529478872)
    ? "Devira"
    : (chat.number = 6282292464710)
    ? "Putri"
    : (chat.number = 6285256474235)
    ? "Stesi"
    : (chat.number = 6282353049095)
    ? "Putra"
    : (chat.number = 6282271559885)
    ? "Zeinal"
    : "";
  const noPengirim = chat.number;
  const pesan = await msg.getChat();
  const waktupesan = pesan.timestamp;

  // const attachmentData = (await msg.downloadMedia()).mimetype;

  if (pesan.isGroup && msg.hasMedia) {
    const result = convert(waktupesan * 1000);
    const keterangan = result.jam < 16 ? "Masuk" : "Pulang";
    const keterangan2 =
      result.jam >= 9 && result.jam <= 16 ? "Mar *TERLAMBAT*" : "";

    axios
      .get(
        `https://script.google.com/macros/s/AKfycbwkGMkfLFCv1LIA87kOYJdvzQ74kgr4UUHAKrNj5uX0rdYg6pS2Pw4VaoaILk-Kl00biQ/exec?action=register&keterangan=${keterangan}&tanggal=${result.tanggal}&jam=${result.jam}:${result.menit}&hari=${result.hari}&nama=${namaPengirim}&whatsapp=${noPengirim}`
      )
      .then(async (response) => {
        const { succsess, data } = response.data;
        if (succsess) {
          msg.react("👌");
          client.sendMessage(
            "6285256474235@c.us",
            `Hallo cici !!\n\n*${namaPengirim}* so ba absen *${keterangan}*`
          );
        }
      });
  }
});

client.initialize();

//-----------------------------------------------------------

//-----------------------------------------------------------

// Socket IO
io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    client.destroy();
    client.initialize();
  });

  client.on("message", async (msg) => {
    const chat = await msg.getContact();
    const namaPengirim = (chat.number = 6282347431338)
      ? "Ijal"
      : (chat.number = 6282290561992)
      ? "Rio"
      : (chat.number = 6282291930255)
      ? "Leo"
      : (chat.number = 6289529478872)
      ? "Devira"
      : (chat.number = 6282292464710)
      ? "Putri"
      : (chat.number = 6285256474235)
      ? "Stesi"
      : (chat.number = 6282353049095)
      ? "Putra"
      : (chat.number = 6282271559885)
      ? "Zeinal"
      : "";

    const pesan = await msg.getChat();
    const waktupesan = pesan.timestamp;

    const result = convert(waktupesan * 1000);
    if (msg.body === "ping" && !pesan.isGroup) {
      // msg.reply("pong");
      socket.emit(
        "message",
        `[ ${result.tanggal} Pukul ${result.jam}:${result.menit} ] => " ${namaPengirim} Baru saja melakukan test !ping "  `
      );
    }
  });
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

server.listen(port, function () {
  console.log("App running on *: " + port);
});

// // Send message
// app.post(
//   "/send-message",
//   [body("number").notEmpty(), body("message").notEmpty()],
//   async (req, res) => {
//     const errors = validationResult(req).formatWith(({ msg }) => {
//       return msg;
//     });

//     if (!errors.isEmpty()) {
//       return res.status(422).json({
//         status: false,
//         message: errors.mapped(),
//       });
//     }

//     const number = phoneNumberFormatter(req.body.number);
//     const message = req.body.message;

//     const isRegisteredNumber = await checkRegisteredNumber(number);

//     if (!isRegisteredNumber) {
//       return res.status(422).json({
//         status: false,
//         message: "The number is not registered",
//       });
//     }

//     client
//       .sendMessage(number, message)
//       .then((response) => {
//         res.status(200).json({
//           status: true,
//           response: response,
//         });
//       })
//       .catch((err) => {
//         res.status(500).json({
//           status: false,
//           response: err,
//         });
//       });
//   }
// );

// // Send media
// app.post("/send-media", async (req, res) => {
//   const number = phoneNumberFormatter(req.body.number);
//   const caption = req.body.caption;
//   const fileUrl = req.body.file;

//   // const media = MessageMedia.fromFilePath('./image-example.png');
//   // const file = req.files.file;
//   // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
//   let mimetype;
//   const attachment = await axios
//     .get(fileUrl, {
//       responseType: "arraybuffer",
//     })
//     .then((response) => {
//       mimetype = response.headers["content-type"];
//       return response.data.toString("base64");
//     });

//   const media = new MessageMedia(mimetype, attachment, "Media");

//   client
//     .sendMessage(number, media, {
//       caption: caption,
//     })
//     .then((response) => {
//       res.status(200).json({
//         status: true,
//         response: response,
//       });
//     })
//     .catch((err) => {
//       res.status(500).json({
//         status: false,
//         response: err,
//       });
//     });
// });

// const findGroupByName = async function (name) {
//   const group = await client.getChats().then((chats) => {
//     return chats.find(
//       (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
//     );
//   });
//   return group;
// };

// // Send message to group
// // You can use chatID or group name, yea!
// app.post(
//   "/send-group-message",
//   [
//     body("id").custom((value, { req }) => {
//       if (!value && !req.body.name) {
//         throw new Error("Invalid value, you can use `id` or `name`");
//       }
//       return true;
//     }),
//     body("message").notEmpty(),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req).formatWith(({ msg }) => {
//       return msg;
//     });

//     if (!errors.isEmpty()) {
//       return res.status(422).json({
//         status: false,
//         message: errors.mapped(),
//       });
//     }

//     let chatId = req.body.id;
//     const groupName = req.body.name;
//     const message = req.body.message;

//     // Find the group by name
//     if (!chatId) {
//       const group = await findGroupByName(groupName);
//       if (!group) {
//         return res.status(422).json({
//           status: false,
//           message: "No group found with name: " + groupName,
//         });
//       }
//       chatId = group.id._serialized;
//     }

//     client
//       .sendMessage(chatId, message)
//       .then((response) => {
//         res.status(200).json({
//           status: true,
//           response: response,
//         });
//       })
//       .catch((err) => {
//         res.status(500).json({
//           status: false,
//           response: err,
//         });
//       });
//   }
// );

// // Clearing message on spesific chat
// app.post("/clear-message", [body("number").notEmpty()], async (req, res) => {
//   const errors = validationResult(req).formatWith(({ msg }) => {
//     return msg;
//   });

//   if (!errors.isEmpty()) {
//     return res.status(422).json({
//       status: false,
//       message: errors.mapped(),
//     });
//   }

//   const number = phoneNumberFormatter(req.body.number);

//   const isRegisteredNumber = await checkRegisteredNumber(number);

//   if (!isRegisteredNumber) {
//     return res.status(422).json({
//       status: false,
//       message: "The number is not registered",
//     });
//   }

//   const chat = await client.getChatById(number);

//   chat
//     .clearMessages()
//     .then((status) => {
//       res.status(200).json({
//         status: true,
//         response: status,
//       });
//     })
//     .catch((err) => {
//       res.status(500).json({
//         status: false,
//         response: err,
//       });
//     });
// });
