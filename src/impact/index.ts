import { collectFiles } from '../detectors/index.js';

export interface ImpactGraph {
  target: string;
  dependents: {
    apiEndpoints: string[];
    services: string[];
    jobs: string[];
    frontend: string[];
    tests: string[];
    migrations: string[];
    other: string[];
  };
  riskScorecard: {
    api: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    database: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    frontend: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    tests: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    deploy: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export function analyzeImpact(repoRoot: string, targetSymbolOrFile: string): ImpactGraph {
  const files = collectFiles(repoRoot);

  const targetName = targetSymbolOrFile.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '');
  const regex = new RegExp(`\\b${targetName}\\b`);

  const dependents = {
    apiEndpoints: [] as string[],
    services: [] as string[],
    jobs: [] as string[],
    frontend: [] as string[],
    tests: [] as string[],
    migrations: [] as string[],
    other: [] as string[]
  };

  for (const file of files) {
    if (file.path.includes(targetSymbolOrFile) || file.path.endsWith(targetSymbolOrFile)) {
      continue;
    }

    if (regex.test(file.content)) {
      const p = file.path;
      if (p.includes('/api/') || p.includes('/routes/') || p.includes('Controller.')) {
        dependents.apiEndpoints.push(p);
      } else if (p.includes('/services/') || p.includes('/actions/') || p.includes('/domain/')) {
        dependents.services.push(p);
      } else if (p.includes('/jobs/') || p.includes('/queues/') || p.includes('/workers/')) {
        dependents.jobs.push(p);
      } else if (p.endsWith('.tsx') || p.endsWith('.jsx') || p.includes('/components/') || p.includes('/views/')) {
        dependents.frontend.push(p);
      } else if (p.includes('test') || p.includes('spec')) {
        dependents.tests.push(p);
      } else if (p.includes('/migrations/') || p.endsWith('.sql')) {
        dependents.migrations.push(p);
      } else {
        dependents.other.push(p);
      }
    }
  }

  // Derive risks
  const apiRisk =
    dependents.apiEndpoints.length > 5
      ? 'HIGH'
      : dependents.apiEndpoints.length > 0
      ? 'MEDIUM'
      : 'LOW';

  const dbRisk = dependents.migrations.length > 0 ? 'HIGH' : 'LOW';

  const frontendRisk =
    dependents.frontend.length > 8
      ? 'HIGH'
      : dependents.frontend.length > 0
      ? 'MEDIUM'
      : 'LOW';

  // If there are many dependents but 0 tests, test risk is CRITICAL
  const totalConsumers =
    dependents.apiEndpoints.length + dependents.services.length + dependents.frontend.length;
  const testRisk =
    totalConsumers > 5 && dependents.tests.length === 0
      ? 'CRITICAL'
      : dependents.tests.length > 0
      ? 'HIGH'
      : 'LOW';

  const deployRisk =
    dependents.migrations.length > 0 || dependents.jobs.length > 0 ? 'HIGH' : 'LOW';

  return {
    target: targetSymbolOrFile,
    dependents,
    riskScorecard: {
      api: apiRisk,
      database: dbRisk,
      frontend: frontendRisk,
      tests: testRisk,
      deploy: deployRisk
    }
  };
}

export function formatImpactGraph(graph: ImpactGraph): string {
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push(`                   IMPACT DEPENDENCY GRAPH: ${graph.target}`);
  lines.push('================================================================');
  lines.push('');
  lines.push(`${graph.target}`);
  lines.push('│');
  lines.push(`├── ${graph.dependents.apiEndpoints.length} API endpoints`);
  lines.push(`├── ${graph.dependents.services.length} services`);
  lines.push(`├── ${graph.dependents.jobs.length} jobs / queues`);
  lines.push(`├── ${graph.dependents.frontend.length} frontend consumers`);
  lines.push(`├── ${graph.dependents.tests.length} tests`);
  lines.push(`├── ${graph.dependents.migrations.length} migrations`);
  lines.push(`└── ${graph.dependents.other.length} other files`);
  lines.push('');
  lines.push('----------------------------------------------------------------');
  lines.push('CHANGE RISK:');
  lines.push(`  API:       ${graph.riskScorecard.api}`);
  lines.push(`  DATABASE:  ${graph.riskScorecard.database}`);
  lines.push(`  FRONTEND:  ${graph.riskScorecard.frontend}`);
  lines.push(`  TESTS:     ${graph.riskScorecard.tests}`);
  lines.push(`  DEPLOY:    ${graph.riskScorecard.deploy}`);
  lines.push('================================================================');

  return lines.join('\n');
}
