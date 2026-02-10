/**
 * Deployment Commands
 */

import { spawn } from 'child_process'
import chalk from 'chalk'
import ora from 'ora'

export const deployCommands = {
  async vercel(options: any) {
    const spinner = ora('Deploying to Vercel...').start()
    const args = ['deploy', options.prod ? '--prod' : '']

    const child = spawn('vercel', args.filter(Boolean), {
      stdio: 'inherit',
      shell: true,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        spinner.succeed('Deployed to Vercel successfully')
      } else {
        spinner.fail('Deployment failed')
        process.exit(code || 1)
      }
    })
  },

  async docker(options: any) {
    const spinner = ora('Building Docker image...').start()
    const tag = options.tag || 'latest'

    const child = spawn('docker', ['build', '-t', `nchat:${tag}`, '.'], {
      stdio: 'inherit',
      shell: true,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        spinner.succeed('Docker image built successfully')
        if (options.push) {
          spinner.start('Pushing to registry...')
          // Push logic...
        }
      } else {
        spinner.fail('Docker build failed')
        process.exit(code || 1)
      }
    })
  },

  async k8s(options: any) {
    const spinner = ora('Deploying to Kubernetes...').start()
    const args = ['apply', '-f', options.file || 'deploy/k8s/', '-n', options.namespace]

    const child = spawn('kubectl', args, {
      stdio: 'inherit',
      shell: true,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        spinner.succeed('Deployed to Kubernetes successfully')
      } else {
        spinner.fail('Deployment failed')
        process.exit(code || 1)
      }
    })
  },
}
