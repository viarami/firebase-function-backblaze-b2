// Import dependencies
const functions = require("firebase-functions");
const b2CloudStorage = require("b2-cloud-storage");
const BusBoy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Initiate B2 with auth keys
const b2 = new b2CloudStorage({
  auth: {
    accountId: "<accountId>", // NOTE: This is the keyID unique to the key
    applicationKey: "<applicationKey>",
  },
});
const B2bucketId = "";

// Store in Environment Variables
// const b2 = new B2({
//   auth: {
//     accountId: functions.config().b2.accountid,
//     applicationKey: functions.config().b2.appkey,
//   },
// });
// const B2bucketId = functions.config().b2.bucketid;

// Export Cloud Functions

// Uploading a file to Backblaze B2
exports.uploadFile = functions.https.onRequest((req, res) => {
  // Initiate Busboy
  const busboy = new BusBoy({ headers: req.headers });
  // Storing data of the temp file
  let tempFile = {};

  // Process file
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    // Get file extension
    const fileExtension = filename.split(".")[filename.split(".").length - 1];

    // Select filename / Random number with file extension
    newFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${fileExtension}`;

    // Write to temporary directory
    const filepath = path.join(os.tmpdir(), `${newFileName}`);

    tempFile = {
      filepath,
      mimetype,
      newFileName,
    };

    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    b2.authorize(async function (err) {
      if (err) {
        throw err;
      }

      await b2.uploadFile(
        tempFile.filepath,
        {
          bucketId: B2bucketId,
          fileName: tempFile.newFileName,
          // Upload to a directory
          //   fileName: "userfiles/" + thumbFileName,
          contentType: tempFile.mimetype,
        },
        function (err, results) {
          if (err) return res.status(500).json({ error: err });

          return res.status(201).json({ message: "File uploaded!" });
        }
      );
    });
  });

  // END
  busboy.end(req.rawBody);
});

// Uploading images to Backblaze B2
exports.uploadImage = functions.https.onRequest((req, res) => {
  // Initiate Busboy
  const busboy = new BusBoy({ headers: req.headers });
  // Storing data of the temp file
  let tempFile = {};

  // Process image
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    // Check if it is an image
    if (
      mimetype !== "image/jpeg" &&
      mimetype !== "image/png" &&
      mimetype !== "image/gif"
    ) {
      return res.status(400).json({
        error: "Wrong file type",
      });
    }

    // Get image extension
    const fileExtension = filename.split(".")[filename.split(".").length - 1];

    // Select filename / Random number with file extension
    newFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${fileExtension}`;

    // Write to temporary directory
    const filepath = path.join(os.tmpdir(), `${newFileName}`);

    tempFile = {
      filepath,
      mimetype,
      newFileName,
    };

    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    b2.authorize(async function (err) {
      if (err) {
        throw err;
      }

      await b2.uploadFile(
        tempFile.filepath,
        {
          bucketId: B2bucketId,
          fileName: tempFile.newFileName,
          // Upload to a directory
          //   fileName: "images/" + thumbFileName,
          contentType: tempFile.mimetype,
        },
        function (err, results) {
          if (err) return res.status(500).json({ error: err });

          return res.status(201).json({ message: "Image uploaded!" });
        }
      );
    });
  });

  // END
  busboy.end(req.rawBody);
});
