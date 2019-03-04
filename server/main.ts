import {calcSize, SizeInfo} from './calculate_size';

function printSize(size: SizeInfo, buffer: string[], recurseDepth = 0): number {
    let transitiveSize = size.bytes!;
    size.dependencies.forEach(d => {
        transitiveSize += printSize(d, buffer, recurseDepth + 1);
    });

    const pad = '    '.repeat(recurseDepth);
    buffer.push(`${pad}${size.pkg}@${size.version}: ${size.bytes} (transitive ${transitiveSize})`);
    return transitiveSize;
}

calcSize('@angular/cli').then(size => {
    const buffer: string[] = [];
    printSize(size!, buffer);
    // print reversed, so the top-level dep is first
    for (let i = buffer.length-1; i >= 0; i--) {
        console.error(buffer[i]);
    }
});
