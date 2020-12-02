const { Stream } = require("stream");

class MemoryStorageFileSystem {

    onFile;

    // Don't let them view the directory
    list() {
        return [];
    }

    // Tell them they're always "root"
    currentDirectory() {
        return "/";
    }

    // No GET, only WRITE
    get() {
        return {};
    }

    chdir(path) {
        return "./"
    }

    mkdir(path) {
        return "./"
    }

    read(filename) {
        return null;
    }

    delete(path) {

    }

    chmod(path) {

    }

    getUniqueName() {
        return "file";
    }

    async write(fileName) {

        var onFile = this.onFile;

        class MemoryWritable extends Stream.Writable {

            chunks = [];

            constructor(options) {
                super(options)
            }

            _write(chunk, encoding, callback) {
                this.chunks.push(chunk);
                callback();
            }

            _final(callback) {
                onFile(Buffer.concat(this.chunks));
                callback();
            }
        }

        var writeable = new MemoryWritable();

        return writeable;
    }
}

module.exports = MemoryStorageFileSystem;