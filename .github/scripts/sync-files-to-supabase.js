import fs from 'fs'
import path from 'path'
import axios from 'axios'

const branchName = process.argv[2]
const githubRepoName = process.env.GITHUB_REPO_NAME.split('/')[1]

// check if branch already exists
let branchID = null

const branchExists = await axios({
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.MANIFEST_DB_SYNC_SECRET}`
  },
  url: `https://api.manifest-hq.com/branches?projectID=${
    githubRepoName.split('manifest-project-')[1]
  }&branch=${branchName}`
})

if (branchExists.data.data.length === 0) {
  console.log('Branch does not exist, creating...')
  try {
    const branchData = await axios({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MANIFEST_DB_SYNC_SECRET}`
      },
      url: `https://api.manifest-hq.com/branches?projectID=${
        githubRepoName.split('manifest-project-')[1]
      }&branch=${branchName}`
    })

    branchID = branchData.data.data[0].id
  } catch (error) {
    console.error('Error creating branch:', error)
    process.exit(1)
  }
} else {
  branchID = branchExists.data.data[0].id
}

console.log('Branch ID:', branchID)
// finish branch verification

const getFiles = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach((file) => {
    try {
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        filelist = getFiles(filePath, filelist)
      } else {
        filelist.push(filePath)
      }
    } catch (e) {
      console.log(filePath)
      console.log(e)
    }
  })
  return filelist
}

if (
  process.env.GITHUB_REPO_NAME === null ||
  process.env.GITHUB_REPO_NAME === undefined
) {
  console.log('Please set the GITHUB_REPO_NAME environment variable')
  process.exit(1)
}

const syncFilesToSupabase = async (files) => {
  const fileInfos = files
    .map((filePath) => {
      try {
        const content = fs.readFileSync(filePath).toString('base64')
        return {
          project_id: githubRepoName,
          file_path: filePath,
          content,
          branch: branchName
        }
      } catch (e) {
        console.log(`Skipping file: ${filePath}`)
        console.log(e)
        return null
      }
    })
    .filter(Boolean)

  console.log(`Syncing ${fileInfos.length} files to Supabase...`)

  const projectIDSimple = githubRepoName.split('manifest-project-')[1]
  const params = `?projectID=${projectIDSimple}&branch=${branchName}`
  const response = await axios({
    headers: {
      Authorization: `Bearer ${process.env.MANIFEST_DB_SYNC_SECRET}`,
      'Content-Type': 'application/json'
    },
    url: `https://api.manifest-hq.com/files${params}`,
    method: 'POST',
    data: {
      files: fileInfos.map(({ content, file_path }) => ({
        content,
        file_path,
        branch: branchName,
        project_id: githubRepoName
      }))
    }
  })

  console.log(response.data)
}

const main = async () => {
  let gitignore = fs.readFileSync('.gitignore', 'utf8').split('\n')

  // filter out empty strings
  gitignore = gitignore.filter((ignore) => ignore.trim() !== '')
  gitignore.push(
    '.git/',
    '.lockb',
    'app/.nuxt/',
    '.nuxt/',
    'app/.output',
    '.output'
  )
  gitignore.push('.jpg', '.jpeg', '.png', '.ico', '.webp', '.mp4')
  gitignore.push('.jar')
  const allFiles = getFiles('.').filter((file) => {
    return !gitignore.some((ignore) => file.includes(ignore))
  })
  // console.log(allFiles.length)
  await syncFilesToSupabase(allFiles)
}

main().catch(console.error)
