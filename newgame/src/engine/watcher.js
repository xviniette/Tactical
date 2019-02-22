import fs from "fs";
import path from "path";

var sourcePath = "./"
var targetPath = "../../../../game/src/engine";

fs.watch(path.join(__dirname, sourcePath), {
    recursive: true
}, (event, filename) => {
    console.log(filename);
    if (filename) {
        var file = fs.readFileSync(path.join(__dirname, sourcePath, filename), {
            encoding: 'utf8'
        });

        var newFile = file.replace(/export default/gm, "export default").replace(/= require\(/gm, "from ").replace(/"\);/gm, '";').replace(/const(?=[a-zA-Z0-9 ]*from)/gm, "import";

        fs.writeFileSync(path.join(__dirname, targetPath, filename), newFile, {
            encoding: 'utf8'
        });
    }
});