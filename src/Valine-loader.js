(() => {
    console.log("start loading Valine and Kinvey SDK");
    const config = window["VALINECONFIG"];
    if (!config) return;

    const el = ({}).toString.call(config.el) === "[object HTMLDivElement]" ? config.el : document.querySelectorAll(config.el)[0];
    el.innerHTML = `<div class="loading-valine">Loading Comments</div>`;

    /* https://github.com/xCss/Valine/issues/49 */
    const urls = [
        `//cdn.jsdelivr.net/gh/Kinvey/html5-sdk@3.10.0/kinvey-html5-sdk.min.js`,
        `//cdn.jsdelivr.net/gh/Goshin/Valine-Kinvey@k-1.0.2/dist/Valine.min.js`
    ];
    const asyncLoader = url =>
        new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.addEventListener("load", _ => resolve(), false);
            script.addEventListener("error", _ => reject(), false);
            document.body.appendChild(script);
        });
    window.addEventListener('load', () => {
        Promise.all(urls.map(asyncLoader))
            .then(() => new window["Valine"](config))
            .catch(e => console.log("load Valine Failed,", e));
    });
})();
