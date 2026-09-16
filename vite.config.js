import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function generateVersionPlugin() {
  const buildTime = Date.now()
  const baseVer = '2.51'
  const buildHash = 'wm-' + buildTime.toString(36) + '-' + Math.random().toString(36).substring(2, 7)
  const buildLabel = `V${baseVer} | READY`

  const versionPayload = {
    version: baseVer,
    buildHash: buildHash,
    building: '',
    isDeploymentInProgress: false,
    buildTimestamp: buildTime,
    lastDeployedAt: new Date(buildTime).toISOString()
  }

  return {
    name: 'auto-generate-version',
    buildStart() {
      // 1. Write version.json into public directory
      const publicDir = path.resolve(__dirname, 'public')
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }
      fs.writeFileSync(
        path.join(publicDir, 'version.json'),
        JSON.stringify(versionPayload, null, 2),
        'utf-8'
      )

      // 2. Write src/config/version.js
      const configDir = path.resolve(__dirname, 'src', 'config')
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }
      const versionJsContent = `export const CURRENT_BUILD_VERSION = '${baseVer}'\nexport const CURRENT_BUILD_LABEL = '${buildLabel}'\nexport const CURRENT_BUILD_HASH = '${buildHash}'\nexport const CURRENT_BUILD_TIMESTAMP = ${buildTime}\n`
      fs.writeFileSync(path.join(configDir, 'version.js'), versionJsContent, 'utf-8')
      console.log(`[VersionPlugin] Generated Build: ${baseVer} (${buildHash}) at timestamp ${buildTime}`)
    },
    closeBundle() {
      // 3. Also ensure dist/version.json is directly placed into dist
      const distDir = path.resolve(__dirname, 'dist')
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(
          path.join(distDir, 'version.json'),
          JSON.stringify(versionPayload, null, 2),
          'utf-8'
        )
      }
    }
  }
}

export default defineConfig({
  plugins: [generateVersionPlugin(), react()],
})
