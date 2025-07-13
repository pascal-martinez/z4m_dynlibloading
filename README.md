# ZnetDK 4 Mobile module: Dynamic Library Loading (z4m_dynlibloading)
The **z4m_dynlibloading** module makes JS libraries and CSS style sheets easy to load on demand.
- No need to specify the relative URL of the web resource to load. Just indicate the resource file name (without extension) and in option, the module name where the resource is located.
- A version number is added to the URL to force the resource to be reloaded when its content has changed (useful during App development).
- the minified or not minified version of the resource is loaded according to the ZnetDK 4 Mobile App settings.

## LICENCE
This module is published under the version 3 of GPL General Public Licence.

## REQUIREMENTS
- [ZnetDK 4 Mobile](/../../../znetdk4mobile) version 2.0 or higher,
- PHP version 7.4 or higher.

## INSTALLATION
1. Add a new subdirectory named `z4m_dynlibloading` within the
[`./engine/modules/`](/../../../znetdk4mobile/tree/master/engine/modules/) subdirectory of your
ZnetDK 4 Mobile starter App,
2. Copy module's code in the new `./engine/modules/z4m_dynlibloading/` subdirectory,
or from your IDE, pull the code from this module's GitHub repository,

## USAGE
To add to the document one or more JS and CSS resources:
```js
const libLoading = new Z4MDynLibLoading();
libLoading.addJSLibrary('myjslib', 'mymodule'); // Located in 'mymodule'
libLoading.addCSSStyleSheet('mystylesheet'); // Located in 'app'
libLoading.loadAll();
```

To import a JS Module script:
```js
const libLoading = new Z4MDynLibLoading();
libLoading.importJSLib('myjsmodulelib', 'mymodule');
```
## CHANGE LOG
See [CHANGELOG.md](CHANGELOG.md) file.

## CONTRIBUTING
Your contribution to the **ZnetDK 4 Mobile** project is welcome. Please refer to the [CONTRIBUTING.md](https://github.com/pascal-martinez/znetdk4mobile/blob/master/CONTRIBUTING.md) file.
