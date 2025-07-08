import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { changelog } from '@/data/changelog';

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
  // Read version from package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let version = '1.0.0';
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    version = packageJson.version;
  } catch {
    console.warn('Could not read package.json, using default version');
  }

  // Try to get git info, but don't fail if not available
  let gitHash = 'production-build';
  let branch = 'main';
  let commits: CommitInfo[] = [];

  try {
    // Try git commands (works locally)
    const { stdout: gitHashResult } = await execAsync('git rev-parse HEAD');
    const { stdout: branchResult } = await execAsync('git rev-parse --abbrev-ref HEAD');
    const { stdout: gitLog } = await execAsync(
      'git log --oneline --pretty=format:"%H|%h|%s|%ai|%an" -20'
    );
    
    gitHash = gitHashResult.trim();
    branch = branchResult.trim();
    
    commits = gitLog.trim().split('\n').map(line => {
      const [hash, shortHash, message, date, author] = line.split('|');
      return {
        hash: hash.trim(),
        shortHash: shortHash.trim(),
        message: message.trim(),
        date: date.trim(),
        author: author.trim()
      };
    });
  } catch {
    console.log('Git commands not available, using static changelog data');
    
    // Use static changelog data as fallback (for Vercel)
    commits = changelog.map((entry, index) => ({
      hash: `static-${index}`,
      shortHash: `v${entry.version}`,
      message: `Release v${entry.version}: ${entry.changes[0]}`,
      date: entry.date,
      author: 'DOIT Team'
    }));
  }

  // Use Vercel environment variables if available
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    gitHash = process.env.VERCEL_GIT_COMMIT_SHA;
  }
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    branch = process.env.VERCEL_GIT_COMMIT_REF;
  }

  const versionInfo: VersionInfo = {
    version,
    buildTime: new Date().toISOString(),
    gitHash: gitHash.slice(0, 40), // Ensure max 40 chars
    branch,
    commits
  };

  return NextResponse.json(versionInfo);
}