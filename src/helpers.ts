export function styleFullScreen(domElement: HTMLElement): void {
    domElement.style.height = '100vh';
    domElement.style.width = '100vw';
    domElement.style.position = 'absolute';
    domElement.style.left = '0px';
    domElement.style.top = '0px';
}