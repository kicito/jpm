import util from 'node:util'
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import fetch from 'node-fetch'
const streamPipeline = util.promisify(pipeline)

export async function download(url: string, location: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`unexpected response ${response.statusText} when calling to ${url}`)
  await streamPipeline(response.body, fs.createWriteStream(location))
}
