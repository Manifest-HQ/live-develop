import fs from 'fs'
import path from 'path'
import { supabaseManifestDB } from '../../supabase.js'
import axios from 'axios'

const branchName = process.argv[2]
const githubRepoName = process.env.GITHUB_REPO_NAME.split('/')[1]

// check if branch already exists
let branchID = null

const branchExists = await axios({
  headers: {
    Authorization: `Bearer ${process.env.MANIFEST_DB_SYNC_SECRET}`
  },
  url: `https://api.manifest-hq.com/branches?projectID=${
    githubRepoName.split('manifest-project-')[1]
  }&branch=${branchName}`
})

if (branchExists.data.length === 0) {
  console.log('Branch does not exist, creating...')
  try {
    const branchData = await axios({
      headers: {
        Authorization: `Bearer ${process.env.MANIFEST_DB_SYNC_SECRET}`
      },
      url: `https://api.manifest-hq.com/branches?projectID=${
        githubRepoName.split('manifest-project-')[1]
      }&branch=${branchName}`,
      method: 'POST'
    })
  } catch (error) {
    console.error('Error creating branch:', error)
    process.exit(1)
  }

  branchID = branchData.data[0].id
} else {
  branchID = branchExists.data[0].id
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
  const fileInfos = files.map((filePath) => ({
    project_id: githubRepoName,
    file_path: filePath,
    content: fs.readFileSync(filePath, 'utf8'),
    branch: branchName
  }))

  console.log(`Syncing ${files.length} files to Supabase...`)

  const projectIDSimple = githubRepoName.split('manifest-project-')[1]
  const params = `?projectID=${projectIDSimple}&branch=${branchName}`
  await axios({
    headers: {
      Authorization: `Bearer ${process.env.MANIFEST_DB_SYNC_SECRET}`
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

  const { data, error } = await supabaseManifestDB
    .from('files')
    .upsert(fileInfos, {
      onConflict: 'project_id, file_path, branch'
    })

  if (error) {
    console.log('Error syncing files:')
    console.log(error)
  }
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
  const allFiles = getFiles('.').filter((file) => {
    return !gitignore.some((ignore) => file.includes(ignore))
  })
  // console.log(allFiles.length)
  await syncFilesToSupabase(allFiles)
}

main().catch(console.error)
