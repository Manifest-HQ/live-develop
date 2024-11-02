import fs from 'fs'
import path from 'path'
import { supabaseManifestDB } from '../../supabase.js'

const branchName = process.argv[2]
const githubRepoName = process.env.GITHUB_REPO_NAME.split('/')[1]

// check if branch already exists
let branchID = null

const branchExists = await supabaseManifestDB
  .from('branches')
  .select('*')
  .eq('name', branchName)
  .eq('project', githubRepoName)

if (branchExists.data.length === 0) {
  console.log('Branch does not exist, creating...')
  const { data, error } = await supabaseManifestDB
    .from('branches')
    .insert({ name: branchName, project: githubRepoName })
    .select()

  if (error) {
    console.error('Error creating branch:', error)
    process.exit(1)
  }

  branchID = data[0].id
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
    } catch {
      // TODO
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

const syncFileToSupabase = async (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8')
  const fileInfo = {
    project_id: githubRepoName,
    file_path: filePath,
    content,
    branch: branchName // We might want to dynamically get this
  }

  console.log(`Syncing ${filePath} to Supabase...`)
  const { data, error } = await supabaseManifestDB
    .from('files')
    .upsert(fileInfo, {
      onConflict: 'project_id, file_path, branch'
    })

  if (error) {
    console.log(filePath)
    console.log(error)
  }
}

const main = () => {
  // console.log('start')
  let gitignore = fs.readFileSync('.gitignore', 'utf8').split('\n')
  gitignore = gitignore.filter((ignore) => ignore.trim() !== '') // filter out empty strings
  gitignore.push(
    '.git/',
    '.lockb',
    'app/.nuxt/',
    '.nuxt/',
    'app/.output',
    '.output'
  )
  gitignore.push('.jpg', '.jpeg', '.png', '.ico')
  const allFiles = getFiles('.').filter((file) => {
    return !gitignore.some((ignore) => file.includes(ignore))
  })
  // console.log(allFiles.length)
  allFiles.forEach((file) => {
    // console.log(file)
    syncFileToSupabase(file)
  })
}

main()
