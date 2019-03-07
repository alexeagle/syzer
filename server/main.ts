import {calcSize, SizeInfo} from './calculate_size';

function printSize(size: SizeInfo, buffer: string[], path = ''): number {
    let transitiveSize = size.bytes!;
    const thisPath = path.length ? `${path}/${size.pkg}@${size.version}` : `${size.pkg}@${size.version}`;
    size.dependencies.forEach(d => {
        transitiveSize += printSize(d, buffer, thisPath);
    });

    const transitiveMsg = size.bytes === transitiveSize ? '' : `(transitive ${transitiveSize})`;
    //buffer.push(`${pad}${size.pkg}@${size.version}: ${size.bytes} ${transitiveMsg}`);
    buffer.push(`${transitiveSize} ${thisPath}`)
    return transitiveSize;
}

calcSize('@angular/cli', 'next').then(size => {
    const buffer: string[] = [];
    printSize(size!, buffer);
    // print reversed, so the top-level dep is first
    for (let i = buffer.length-1; i >= 0; i--) {
        console.log(buffer[i]);
    }
});
