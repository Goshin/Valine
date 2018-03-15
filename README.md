<img src='./src/assets/valine.png' width='200' align="right" />

# Valine-Kinvey

> A comment system for Kinvey BaaS. 

## Features
- Kinvey BaaS Backend.
- More Secure Rendering.
- Async loader.
- Code Highlight in Comments.
- Style Tweaks.

## Usage

```html
<div class="comment"></div>
<script>
    window.VALINECONFIG = {
        el: '.comment',
        app_secret: 'your app secret',
        app_key: 'your app key',
        path: window.location.pathname,
    }

</script>
<script src="//cdn.jsdelivr.net/gh/Goshin/Valine-Kinvey@k-1.0.2/dist/Valine-loader.min.js"></script>
```

## License
GPL-2.0
