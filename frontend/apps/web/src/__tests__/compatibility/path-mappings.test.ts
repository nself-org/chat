/**
 * Path Mappings Compatibility Tests for v0.9.2 Monorepo Refactor
 *
 * These tests verify that the TypeScript path mappings for @nself-chat/*
 * packages are correctly configured and resolve properly.
 *
 * NOTE: During v0.9.2 migration, the actual package implementations are minimal
 * placeholders. These tests verify the PATH RESOLUTION works, not the actual
 * functionality (which will be migrated in phases C092-009 through C092-013).
 */

describe('Path Mappings Compatibility', () => {
  describe('@nself-chat/core package', () => {
    it('should resolve @nself-chat/core import', () => {
      expect(() => {
        // This will throw if the path mapping doesn't work
        require('@nself-chat/core')
      }).not.toThrow()
    })

    it('should export package metadata', () => {
      const core = require('@nself-chat/core')
      expect(core).toHaveProperty('PACKAGE_NAME')
      expect(core).toHaveProperty('PACKAGE_VERSION')
      expect(core.PACKAGE_NAME).toBe('@nself-chat/core')
      expect(core.PACKAGE_VERSION).toBe('0.9.2')
    })
  })

  describe('@nself-chat/api package', () => {
    it('should resolve @nself-chat/api import', () => {
      expect(() => {
        require('@nself-chat/api')
      }).not.toThrow()
    })

    it('should export package metadata', () => {
      const api = require('@nself-chat/api')
      expect(api).toHaveProperty('PACKAGE_NAME')
      expect(api).toHaveProperty('PACKAGE_VERSION')
      expect(api.PACKAGE_NAME).toBe('@nself-chat/api')
      expect(api.PACKAGE_VERSION).toBe('0.9.2')
    })
  })

  describe('@nself-chat/state package', () => {
    it('should resolve @nself-chat/state import', () => {
      expect(() => {
        require('@nself-chat/state')
      }).not.toThrow()
    })

    it('should export package metadata', () => {
      const state = require('@nself-chat/state')
      expect(state).toHaveProperty('PACKAGE_NAME')
      expect(state).toHaveProperty('PACKAGE_VERSION')
      expect(state.PACKAGE_NAME).toBe('@nself-chat/state')
      expect(state.PACKAGE_VERSION).toBe('0.9.2')
    })
  })

  describe('@nself-chat/ui package', () => {
    it('should resolve @nself-chat/ui import', () => {
      expect(() => {
        require('@nself-chat/ui')
      }).not.toThrow()
    })

    it('should export package metadata', () => {
      const ui = require('@nself-chat/ui')
      expect(ui).toHaveProperty('PACKAGE_NAME')
      expect(ui).toHaveProperty('PACKAGE_VERSION')
      expect(ui.PACKAGE_NAME).toBe('@nself-chat/ui')
      expect(ui.PACKAGE_VERSION).toBe('0.9.2')
    })
  })

  describe('@nself-chat/config package', () => {
    it('should resolve @nself-chat/config import', () => {
      expect(() => {
        require('@nself-chat/config')
      }).not.toThrow()
    })

    it('should export package metadata', () => {
      const config = require('@nself-chat/config')
      expect(config).toHaveProperty('PACKAGE_NAME')
      expect(config).toHaveProperty('PACKAGE_VERSION')
      expect(config.PACKAGE_NAME).toBe('@nself-chat/config')
      expect(config.PACKAGE_VERSION).toBe('0.9.2')
    })
  })

  describe('@nself-chat/testing package', () => {
    it('should resolve @nself-chat/testing import', () => {
      expect(() => {
        require('@nself-chat/testing')
      }).not.toThrow()
    })

    it('should export package metadata', () => {
      const testing = require('@nself-chat/testing')
      expect(testing).toHaveProperty('PACKAGE_NAME')
      expect(testing).toHaveProperty('PACKAGE_VERSION')
      expect(testing.PACKAGE_NAME).toBe('@nself-chat/testing')
      expect(testing.PACKAGE_VERSION).toBe('0.9.2')
    })
  })

  describe('TypeScript path mapping configuration', () => {
    it('should have tsconfig.json with @nself-chat/* paths', () => {
      const fs = require('fs')
      const path = require('path')

      // Read tsconfig.json as text and strip comments (JSON with comments)
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
      const tsconfigText = fs.readFileSync(tsconfigPath, 'utf8')
      // Remove // comments
      const tsconfigClean = tsconfigText.replace(/\/\/.*$/gm, '')
      const tsconfig = JSON.parse(tsconfigClean)

      expect(tsconfig.compilerOptions.paths).toHaveProperty('@nself-chat/core')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@nself-chat/api')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@nself-chat/state')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@nself-chat/ui')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@nself-chat/config')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@nself-chat/testing')
    })

    it('should still have legacy @/* paths for compatibility', () => {
      const fs = require('fs')
      const path = require('path')

      // Read tsconfig.json as text and strip comments
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
      const tsconfigText = fs.readFileSync(tsconfigPath, 'utf8')
      const tsconfigClean = tsconfigText.replace(/\/\/.*$/gm, '')
      const tsconfig = JSON.parse(tsconfigClean)

      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/lib/*')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/components/*')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/hooks/*')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/types/*')
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/config/*')
    })
  })

  describe('Package workspace configuration', () => {
    it('should have pnpm-workspace.yaml with frontend packages', () => {
      const fs = require('fs')
      const path = require('path')
      const workspaceContent = fs.readFileSync(
        path.join(process.cwd(), 'pnpm-workspace.yaml'),
        'utf8'
      )

      expect(workspaceContent).toContain('frontend/apps/*')
      expect(workspaceContent).toContain('frontend/packages/*')
      expect(workspaceContent).toContain('frontend/tooling/*')
    })
  })

  describe('Package structure', () => {
    it('should have all package.json files for packages', () => {
      const fs = require('fs')
      const path = require('path')

      const packages = ['core', 'api', 'state', 'ui', 'config', 'testing']

      for (const pkg of packages) {
        const pkgPath = path.join(
          process.cwd(),
          'frontend',
          'packages',
          pkg,
          'package.json'
        )
        expect(fs.existsSync(pkgPath)).toBe(true)

        const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        expect(pkgJson.name).toBe(`@nself-chat/${pkg}`)
        expect(pkgJson.version).toBe('0.9.2')
      }
    })

    it('should have all tsconfig.json files for packages', () => {
      const fs = require('fs')
      const path = require('path')

      const packages = ['core', 'api', 'state', 'ui', 'config', 'testing']

      for (const pkg of packages) {
        const tsconfigPath = path.join(
          process.cwd(),
          'frontend',
          'packages',
          pkg,
          'tsconfig.json'
        )
        expect(fs.existsSync(tsconfigPath)).toBe(true)

        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
        expect(tsconfig.compilerOptions).toHaveProperty('target')
        expect(tsconfig.compilerOptions).toHaveProperty('module')
      }
    })

    it('should have all src/index.ts files for packages', () => {
      const fs = require('fs')
      const path = require('path')

      const packages = ['core', 'api', 'state', 'ui', 'config', 'testing']

      for (const pkg of packages) {
        const indexPath = path.join(
          process.cwd(),
          'frontend',
          'packages',
          pkg,
          'src',
          'index.ts'
        )
        expect(fs.existsSync(indexPath)).toBe(true)
      }
    })
  })
})
