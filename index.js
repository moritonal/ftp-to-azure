const FtpSrv = require('ftp-srv');
const express = require("express");

require("dotenv").config();

// const { BlobServiceClient } = require("@azure/storage-blob");

/*if (process.env.CONNECTION_STRING == null || process.env.CONNECTION_STRING == "") {
    throw "No connection string specified!";
}

if (process.env.CONNECTION_STRING == null || process.env.USERNAME == "") {
    throw "No username specified!";
}

if (process.env.CONNECTION_STRING == null || process.env.PASSWORD == "") {
    throw "No password specified!";
}*/

if (process.env.PORT == null || process.env.PORT == "") {
    throw "No port specified!";
}

if (process.env.PASV_URL == null || process.env.PASV_URL == "") {
    throw "No passive url specified!";
}

if (process.env.CONTENT_TYPE == null || process.env.CONTENT_TYPE == "") {
    throw "No content type specified!";
}

// const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
// var containerClient = blobServiceClient.getContainerClient("images");

const ftpServer = new FtpSrv({
    url: `ftp://0.0.0.0:${process.env.PORT}`,
    anonymous: false,
    whitelist: [
        "STOR",
        "PASV",
        "NOOP",
        "TYPE",
        "PORT",
        "AUTH",
        "USER",
        "PASS",
        "PWD",
        "CWD"
    ],
    pasv_url: process.env.PASV_URL,
    pasv_min: 30000,
    pasv_max: 30009
});

//const path = require("path");
//const fs = require("fs");
const MemoryStorageFileSystem = require('./MemoryStorageFileSystem');

//const bufferChunks = [];
var imageData;

async function Main() {

    ftpServer.on('login', (data, resolve, reject) => {

        // Check the password
        if (data.username !== process.env.USERNAME || data.password !== process.env.PASSWORD) {

            console.log(`Login rejected for "${data.username}" with password "${data.password}"`);
            reject({});
            return;
        }

        console.log(`Login accepted for "${data.username}" with password "${data.password}"`);

        //const fileSystem = new AzureStorageFileSystem(data.connection);
        const fileSystem = new MemoryStorageFileSystem(data.connection);

        fileSystem.onFile = (stream) => {

            imageData = stream;
            console.log(process.memoryUsage());
        }

        resolve({

            fs: fileSystem
        });
    });

    ftpServer.on("client-error", ({ connection, context, error }) => {
        console.log("Failed", error);
    });

    // await containerClient.createIfNotExists();

    await ftpServer.listen();

    console.log("Listening on", ftpServer.options.url);

    const app = express();

    app.get("/", (req, res) => {
        if (imageData != null) {
            res.set("Content-Type", process.env.CONTENT_TYPE)
            res.send(imageData);
        } else {
            res.send("Hello, World!");
        }
    })

    app.listen(80, "127.0.0.1", () => {
        console.log("Listening on 80");
    });
}

Main();