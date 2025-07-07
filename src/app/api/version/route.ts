import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  author: string;
}

interface VersionInfo {
  version: string;
  buildTime: string;
  gitHash: string;
  branch: string;
  commits: CommitInfo[];
}

export async function GET() {
  try {
    // Read version from package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;

    // Get current git hash
    const { stdout: gitHash } = await execAsync('git rev-parse HEAD');
    
    // Get current branch
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
    
    // Get recent commits with detailed info
    const { stdout: gitLog } = await execAsync(
      'git log --oneline --pretty=format:"%H|%h|%s|%ai|%an" -20'
    );
    
    // Parse commits
    const commits: CommitInfo[] = gitLog.trim().split('\n').map(line => {
      const [hash, shortHash, message, date, author] = line.split('|');
      return {
        hash: hash.trim(),
        shortHash: shortHash.trim(),
        message: message.trim(),
        date: date.trim(),
        author: author.trim()
      };
    });

    const versionInfo: VersionInfo = {
      version,
      buildTime: new Date().toISOString(),
      gitHash: gitHash.trim(),
      branch: branch.trim(),
      commits
    };

    return NextResponse.json(versionInfo);
  } catch (error) {
    console.error('Error fetching version info:', error);
    
    // Fallback response if git commands fail
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      return NextResponse.json({
        version: packageJson.version,
        buildTime: new Date().toISOString(),
        gitHash: 'unknown',
        branch: 'unknown',
        commits: []
      });
    } catch {
      return NextResponse.json({
        version: '0.1.0',
        buildTime: new Date().toISOString(),
        gitHash: 'unknown',
        branch: 'unknown',
        commits: []
      });
    }
  }
}