import rp = require('request-promise-native');
import {maxSatisfying} from 'semver';

/**
 * @param url like https://registry.npmjs.org/@yarnpkg/lockfile/-/lockfile-1.0.0.tgz
 * @returns the size in bytes of the resource
 */
async function fetchSize(url: string): Promise<number> {
    const headers = await rp({
        url,
        method: 'HEAD',
        timeout: 2000,
    });
    return Number(headers['content-length']);
}

export async function calcSize(pkgName: string, version = 'latest', recurseDepth = 0, deps = new Set<string>()): Promise<number> {
    const metadata = await rp({
        url: `https://registry.yarnpkg.com/${pkgName}`, 
        json: true,
        timeout: 2000,
    });

    // If the version was a tag, it will match something in dist-tags
    // In this case, resolve the reference to the real version
    if (Object.keys(metadata['dist-tags']).some(tag => tag === version)) {
        version = metadata['dist-tags'][version];
    }

    const possibleVersions = Object.keys(metadata['versions']);
    // TODO: does maxSatisifying match what users would download?
    const matchedVersion = maxSatisfying(possibleVersions, version);
    if (!matchedVersion) {
        throw new Error(`No version of ${pkgName} (${possibleVersions}) matches ${version}`);
    }

    const pkg = metadata['versions'][matchedVersion];
    if (deps.has(pkg['_id'])) {
        return 0;
    }
    deps.add(pkg['_id']);

    let pkgSize = await fetchSize(pkg['dist']['tarball']);
    
    if (pkg['dependencies']) {
        const depSizes = Object.keys(pkg['dependencies']).map(async d => { 
            return calcSize(d, pkg['dependencies'][d], recurseDepth + 1, deps); 
        });
        (await Promise.all(depSizes)).filter(s=>!!s).forEach(size => {
            pkgSize += size;
        });
    }

    console.error('    '.repeat(recurseDepth), pkg['_id'], pkgSize);
    return pkgSize;
}
