import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { parse as parseEnv } from 'dotenv';

const execAsync = promisify(exec);

export interface ProcessInfo {
  pid: number;
  name: string;
  port?: number;
  command: string;
  cpu?: number;
  memory?: number;
}

export interface PortInfo {
  port: number;
  pid: number;
  process: string;
  state: string;
}

export interface EnvConfig {
  [key: string]: string;
}

export class EnvironmentService {
  async getRunningProcesses(filter?: string): Promise<ProcessInfo[]> {
    try {
      const isWindows = process.platform === 'win32';
      let command: string;
      
      if (isWindows) {
        command = 'tasklist /fo csv | findstr /i node';
      } else {
        command = 'ps aux | grep -E "node|npm|yarn|pnpm" | grep -v grep';
      }
      
      const { stdout } = await execAsync(command);
      return this.parseProcessList(stdout, isWindows);
    } catch (error) {
      console.error('Failed to get processes:', (error as Error).message);
      return [];
    }
  }
  
  private parseProcessList(output: string, isWindows: boolean): ProcessInfo[] {
    const processes: ProcessInfo[] = [];
    const lines = output.trim().split('\n');
    
    if (isWindows) {
      // Skip CSV header
      lines.slice(1).forEach(line => {
        const parts = line.split('","').map(p => p.replace(/"/g, ''));
        if (parts.length >= 5) {
          processes.push({
            pid: parseInt(parts[1]),
            name: parts[0],
            command: parts[0],
            memory: parseInt(parts[4].replace(/[^\d]/g, ''))
          });
        }
      });
    } else {
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          processes.push({
            pid: parseInt(parts[1]),
            name: parts[10],
            command: parts.slice(10).join(' '),
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3])
          });
        }
      });
    }
    
    return processes;
  }
  
  async getPortUsage(): Promise<PortInfo[]> {
    try {
      const isWindows = process.platform === 'win32';
      let command: string;
      
      if (isWindows) {
        command = 'netstat -ano | findstr LISTENING';
      } else {
        command = 'lsof -i -P -n | grep LISTEN';
      }
      
      const { stdout } = await execAsync(command);
      return this.parsePortList(stdout, isWindows);
    } catch (error) {
      console.error('Failed to get port usage:', (error as Error).message);
      return [];
    }
  }
  
  private parsePortList(output: string, isWindows: boolean): PortInfo[] {
    const ports: PortInfo[] = [];
    const lines = output.trim().split('\n');
    
    if (isWindows) {
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const addressParts = parts[1]?.split(':');
        if (addressParts && addressParts.length > 1) {
          const port = parseInt(addressParts[addressParts.length - 1]);
          if (!isNaN(port)) {
            ports.push({
              port,
              pid: parseInt(parts[parts.length - 1]),
              process: 'Unknown',
              state: 'LISTENING'
            });
          }
        }
      });
    } else {
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
          const addressParts = parts[8].split(':');
          if (addressParts.length > 1) {
            const port = parseInt(addressParts[addressParts.length - 1]);
            if (!isNaN(port)) {
              ports.push({
                port,
                pid: parseInt(parts[1]),
                process: parts[0],
                state: parts[9] || 'LISTEN'
              });
            }
          }
        }
      });
    }
    
    return ports.filter(p => p.port >= 1024 && p.port <= 65535);
  }
  
  async checkPortAvailability(port: number): Promise<boolean> {
    const ports = await this.getPortUsage();
    return !ports.some(p => p.port === port);
  }
  
  async findAvailablePort(startPort: number = 3000, range: number = 100): Promise<number> {
    for (let port = startPort; port < startPort + range; port++) {
      if (await this.checkPortAvailability(port)) {
        return port;
      }
    }
    throw new Error(`No available ports found in range ${startPort}-${startPort + range}`);
  }
  
  async loadEnvFile(filePath: string = '.env'): Promise<EnvConfig> {
    try {
      const envPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(envPath, 'utf8');
      return parseEnv(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw new Error(`Failed to load env file: ${(error as Error).message}`);
    }
  }
  
  async saveEnvFile(config: EnvConfig, filePath: string = '.env'): Promise<void> {
    try {
      const envPath = path.resolve(process.cwd(), filePath);
      const content = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      await fs.writeFile(envPath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save env file: ${(error as Error).message}`);
    }
  }
  
  async switchEnvironment(environment: string): Promise<EnvConfig> {
    const envFiles = {
      development: '.env.development',
      production: '.env.production',
      test: '.env.test',
      staging: '.env.staging'
    };
    
    const envFile = envFiles[environment as keyof typeof envFiles] || '.env';
    const baseConfig = await this.loadEnvFile('.env');
    const envConfig = await this.loadEnvFile(envFile);
    
    return { ...baseConfig, ...envConfig, NODE_ENV: environment };
  }
  
  async analyzeLogFile(logPath: string, options?: { tail?: number; grep?: string }): Promise<any> {
    try {
      const content = await fs.readFile(logPath, 'utf8');
      const lines = content.split('\n');
      
      let filteredLines = lines;
      
      if (options?.grep) {
        const regex = new RegExp(options.grep, 'i');
        filteredLines = lines.filter(line => regex.test(line));
      }
      
      if (options?.tail) {
        filteredLines = filteredLines.slice(-options.tail);
      }
      
      // Analyze log patterns
      const errorCount = filteredLines.filter(line => /error|exception/i.test(line)).length;
      const warningCount = filteredLines.filter(line => /warn|warning/i.test(line)).length;
      const infoCount = filteredLines.filter(line => /info/i.test(line)).length;
      
      return {
        totalLines: lines.length,
        filteredLines: filteredLines.length,
        errors: errorCount,
        warnings: warningCount,
        info: infoCount,
        content: filteredLines.slice(0, 100), // First 100 lines
        tail: filteredLines.slice(-20) // Last 20 lines
      };
    } catch (error) {
      throw new Error(`Failed to analyze log file: ${(error as Error).message}`);
    }
  }
  
  async getSystemInfo(): Promise<any> {
    const platform = process.platform;
    const arch = process.arch;
    const nodeVersion = process.version;
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    let systemInfo: any = {
      platform,
      arch,
      nodeVersion,
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      uptime: Math.round(uptime / 60) + ' minutes'
    };
    
    try {
      // Get npm/yarn/pnpm versions
      const { stdout: npmVersion } = await execAsync('npm --version');
      systemInfo['npmVersion'] = npmVersion.trim();
    } catch (e) {}
    
    try {
      const { stdout: yarnVersion } = await execAsync('yarn --version');
      systemInfo['yarnVersion'] = yarnVersion.trim();
    } catch (e) {}
    
    try {
      const { stdout: pnpmVersion } = await execAsync('pnpm --version');
      systemInfo['pnpmVersion'] = pnpmVersion.trim();
    } catch (e) {}
    
    return systemInfo;
  }
}