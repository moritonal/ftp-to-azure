const FtpSrv = require('ftp-srv');

require("dotenv").config();

const { BlobServiceClient } = require("@azure/storage-blob");
const { PassThrough, Writable } = require('stream');

if (process.env.CONNECTION_STRING == null || process.env.CONNECTION_STRING == "") {
    throw "No connection string specified!";
}

if (process.env.CONNECTION_STRING == null || process.env.USERNAME == "") {
    throw "No username specified!";
}

if (process.env.CONNECTION_STRING == null || process.env.PASSWORD == "") {
    throw "No password specified!";
}

if (process.env.PORT == null || process.env.PORT == "") {
    throw "No port specified!";
}

if (process.env.PASV_URL == null || process.env.PASV_URL == "") {
    throw "No passive url specified!";
}

if (process.env.CONTENT_TYPE == null || process.env.CONTENT_TYPE == "") {
    throw "No content type specified!";
}

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
var containerClient = blobServiceClient.getContainerClient("images");

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

const path = require("path");
const fs = require("fs");

class AzureStorageFileSystem { // extends FtpSrv.FileSystem {
    
    /*constructor(connection) {
        super(connection);
    }*/

    // Don't let them view the directory
    list() {
        return [];
    }

    // Tell them they're always "root"
    currentDirectory() {
        console.log("currentdirectory")
        return "/";
    }

    // No GET, only WRITE
    get() {
        console.log("get");
        return {};
    }

    chdir(path) {

        return "./"
    }

    mkdir(path) {
        console.log("mkdir");
        return "./"
    }

    read(filename) {
        console.log("read", filename);
        return null;
    }

    delete(path) {
        console.log("delete", path);
    }

    chmod(path) {

    }

    getUniqueName() {
        console.log("getUniqueName");
        return "file";
    }

    async write(fileName) {

        const onlyName = path.basename(fileName);

        const blockBlobClient = containerClient.getBlockBlobClient(onlyName);
        
        console.log(`Opening stream for "${fileName}" to "${blobServiceClient.accountName}"`);
        
        const passThru = new PassThrough({
            allowHalfOpen: false,
            autoDestroy: true,
            emitClose: true
        });

        passThru.once("close", () => {

            console.log("Closed stream");

            passThru.end();
        });

        // var writeStream = fs.createWriteStream("./test");

        blockBlobClient.uploadStream(
            passThru,
            1024 * 1024, // Buffer size
            20, // Max concurrency
            {
                blobHTTPHeaders: {
                    blobContentType: process.env.CONTENT_TYPE
                }
            }).then((response) => {
                console.log("Upload complete");
                console.log(process.memoryUsage());
            })

        // console.log(process.memoryUsage());
        

        return passThru;
    }
}

async function Main() {

    ftpServer.on('login', (data, resolve, reject) => {

        // Check the password
        if (data.username !== process.env.USERNAME || data.password !== process.env.PASSWORD) {

            console.log(`Login rejected for "${data.username}" with password "${data.password}"`);
            reject({});
            return;
        }

        console.log(`Login accepted for "${data.username}" with password "${data.password}"`);

        const fileSystem = new AzureStorageFileSystem(data.connection);

        resolve({
            fs: fileSystem
        });
    });

    ftpServer.on("client-error", ({ connection, context, error }) => {
        console.log("Failed", error);
    });

    await containerClient.createIfNotExists();

    await ftpServer.listen();

    console.log("Listening on", ftpServer.options.url);
}

Main();