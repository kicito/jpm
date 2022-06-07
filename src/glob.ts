import glob from 'glob'
import { promisify } from 'node:util'

export default promisify(glob)
