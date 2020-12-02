// const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
// var containerClient = blobServiceClient.getContainerClient("images");

export default class AzureStorageFileSystem {

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
            });

        return passThru;
    }
}