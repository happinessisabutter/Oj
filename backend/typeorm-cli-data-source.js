// CommonJS bridge so TypeORM CLI can load the compiled datasource
const dataSourceModule = require('./dist/libs/typeorm-cli-data-source.js');
const dataSource = dataSourceModule?.default || dataSourceModule;

module.exports = dataSource;

