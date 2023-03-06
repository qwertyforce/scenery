const fs = require("fs")
const path = require("path")
console.log(__dirname)
const root_path = path.join(__dirname, "..", "..")
const dirs = ["public", "temp", "import", path.join("import", "images"), path.join("public", "thumbnails"), path.join("public", "images")]

for (const dir of dirs) {
  const dir_path = path.join(root_path, dir)
  if (!fs.existsSync(dir_path)) {
    fs.mkdirSync(dir_path);
  }
}