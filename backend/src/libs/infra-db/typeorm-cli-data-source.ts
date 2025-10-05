import { AppDataSource } from './data-source';

// Wrapper exporting only a single DataSource instance for the TypeORM CLI
const cliDataSource = AppDataSource;
export default cliDataSource;
