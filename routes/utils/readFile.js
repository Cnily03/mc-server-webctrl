const path = require("path");
const fs = require("fs");
async function readFile(file_path) {
    file_path = path.resolve(__dirname, file_path);
    return await new Promise((resolve) => {
        fs.readFile(file_path, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            resolve(data);
        })
    })
}
module.exports = readFile;