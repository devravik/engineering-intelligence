import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface DetectedStack {
  languages: string[];
  framework?: string;
  dataPersistence?: string;
  testRunner?: string;
  linter?: string;
  directoryTopology: string[];
  summary: string;
}

export function detectProjectStack(repoRoot: string): DetectedStack {
  const languages: string[] = [];
  let framework: string | undefined;
  let dataPersistence: string | undefined;
  let testRunner: string | undefined;
  let linter: string | undefined;
  const directoryTopology: string[] = [];

  // Check Node.js ecosystem
  const pkgPath = join(repoRoot, 'package.json');
  if (existsSync(pkgPath)) {
    languages.push(existsSync(join(repoRoot, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript');
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Frameworks
      if (deps['next']) framework = `Next.js ${deps['next']}`;
      else if (deps['@nestjs/core']) framework = 'NestJS';
      else if (deps['express']) framework = 'Express';
      else if (deps['fastify']) framework = 'Fastify';
      else if (deps['react']) framework = 'React';
      else if (deps['vue']) framework = 'Vue';

      // Persistence / ORMs
      if (deps['@prisma/client'] || deps['prisma']) dataPersistence = 'Prisma ORM';
      else if (deps['drizzle-orm']) dataPersistence = 'Drizzle ORM';
      else if (deps['typeorm']) dataPersistence = 'TypeORM';
      else if (deps['mongoose']) dataPersistence = 'Mongoose (MongoDB)';
      else if (deps['pg']) dataPersistence = 'PostgreSQL (pg)';
      else if (deps['mysql2']) dataPersistence = 'MySQL (mysql2)';
      else if (deps['better-sqlite3']) dataPersistence = 'SQLite (better-sqlite3)';

      // Test runners
      if (deps['vitest']) testRunner = 'Vitest';
      else if (deps['jest']) testRunner = 'Jest';
      else if (deps['playwright']) testRunner = 'Playwright';
      else if (pkg.scripts?.test?.includes('node:test') || pkg.scripts?.test?.includes('--test')) {
        testRunner = 'Node.js native test runner (node:test)';
      }

      // Linters / Formatters
      if (deps['@biomejs/biome']) linter = 'Biome';
      else if (deps['eslint']) linter = 'ESLint';
      else if (deps['prettier']) linter = 'Prettier';
    } catch {
      // Ignore parse errors
    }
  }

  // Check Python ecosystem
  if (existsSync(join(repoRoot, 'pyproject.toml')) || existsSync(join(repoRoot, 'requirements.txt'))) {
    languages.push('Python');
    const reqContent = existsSync(join(repoRoot, 'requirements.txt'))
      ? readFileSync(join(repoRoot, 'requirements.txt'), 'utf-8')
      : '';
    if (reqContent.includes('fastapi') || existsSync(join(repoRoot, 'pyproject.toml'))) {
      if (reqContent.includes('fastapi')) framework = 'FastAPI';
      else if (reqContent.includes('django')) framework = 'Django';
      if (reqContent.includes('sqlalchemy')) dataPersistence = 'SQLAlchemy';
      if (reqContent.includes('pytest')) testRunner = 'PyTest';
    }
  }

  // Check Go ecosystem
  if (existsSync(join(repoRoot, 'go.mod'))) {
    languages.push('Go');
    const goMod = readFileSync(join(repoRoot, 'go.mod'), 'utf-8');
    if (goMod.includes('github.com/gin-gonic/gin')) framework = 'Gin';
    if (goMod.includes('gorm.io/gorm')) dataPersistence = 'GORM';
    testRunner = 'Go test';
  }

  // Check PHP ecosystem
  if (existsSync(join(repoRoot, 'composer.json'))) {
    languages.push('PHP');
    const composer = readFileSync(join(repoRoot, 'composer.json'), 'utf-8');
    if (composer.includes('laravel/framework')) framework = 'Laravel';
    if (composer.includes('phpunit/phpunit')) testRunner = 'PHPUnit';
    else if (composer.includes('pestphp/pest')) testRunner = 'Pest';
  }

  // Check directory topology
  const checkDirs = ['src', 'app', 'routes', 'api', 'services', 'components', 'models', 'migrations', 'tests'];
  for (const dir of checkDirs) {
    if (existsSync(join(repoRoot, dir))) {
      directoryTopology.push(dir);
    }
  }

  const langStr = languages.length > 0 ? languages.join(', ') : 'Unknown';
  const summary = [
    `Language(s): ${langStr}`,
    framework ? `Framework: ${framework}` : null,
    dataPersistence ? `Persistence: ${dataPersistence}` : null,
    testRunner ? `Test Runner: ${testRunner}` : null,
    linter ? `Linter: ${linter}` : null,
    directoryTopology.length > 0 ? `Key Directories: ${directoryTopology.join(', ')}` : null
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    languages,
    framework,
    dataPersistence,
    testRunner,
    linter,
    directoryTopology,
    summary
  };
}
