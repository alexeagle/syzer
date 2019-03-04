const rp = require('request-promise-native');
import {maxSatisfying} from 'semver';

async function retryRequest(request: {}) {
    async function doRequest(request: {}) {
        return await rp(request);
    }
    try {
        return await doRequest(request);
    } catch (e) {
        try {
            return await doRequest(request);
        } catch (e) {
            try {
                return await doRequest(request);
            } catch (e) {
                throw new Error('tried three times; giving up' + e);
            }

        }
    }
}
/**
 * @param url like https://registry.npmjs.org/@yarnpkg/lockfile/-/lockfile-1.0.0.tgz
 * @returns the size in bytes of the resource
 */
async function fetchSize(url: string): Promise<number> {
    const headers = await retryRequest({
        url,
        method: 'HEAD',
        timeout: 2000,
    });
    return Number(headers['content-length']);    
}
    
export interface SizeInfo {
    pkg: string,
    version: string,
    dependencies: SizeInfo[],
    bytes?: number
}

export async function calcSize(pkgName: string, version = 'latest', deps = new Set<string>()): Promise<SizeInfo|undefined> {
    const metadata = await retryRequest({
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
    const result: SizeInfo = {
        pkg: pkgName,
        version: matchedVersion,
        dependencies: [],
    }
    if (deps.has(pkg['_id'])) {
        return;
    }
    deps.add(pkg['_id']);

    result.bytes = await fetchSize(pkg['dist']['tarball']);
    
    if (pkg['dependencies']) {
        const depSizes = Object.keys(pkg['dependencies']).map(async d => { 
            return calcSize(d, pkg['dependencies'][d], deps); 
        });
        (await Promise.all(depSizes)).filter(s=>!!s).forEach(size => {
            result.dependencies.push(size!);
        });
    }

    return result;
}
