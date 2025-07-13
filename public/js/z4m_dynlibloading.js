/*
 * ZnetDK, Starter Web Application for rapid & easy development
 * See official website https://mobile.znetdk.fr
 * Copyright (C) 2025 Pascal MARTINEZ (contact@znetdk.fr)
 * License GNU GPL http://www.gnu.org/licenses/gpl-3.0.html GNU GPL
 * --------------------------------------------------------------------
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * --------------------------------------------------------------------
 * ZnetDK 4 Mobile dynamic library loading module JS library
 *
 * File version: 1.0
 * Last update: 07/12/2025
 */

/* global z4m, Promise, z4m_dynlibloading_timestamps, z4m_dynlibloading_extensions, import */

/**
 * Loads dynamically JS libraries and CSS style sheets.
 * FEATURES:
 * 1) No need to specify the relative URL of the JS library or CSS style sheet to
 * load.
 * 2) A version number is added to the URL to force the resource to be reloaded
 * when its content has changed (useful during App development).
 * 3) the minified or not minified version of the resource to load is choosen
 * according to the ZnetDK 4 Mobile settings (CFG_DEV_JS_ENABLED and
 * CFG_ZNETDK_CSS PHP constants).
 *
 * Accepted libraries and style sheets can be located in the following
 * directories:
 * - 'applications/default/public/js/dynamic/'
 * - 'applications/default/public/css/dynamic/'
 * - 'engine/modules/[MODULE_NAME]/public/js/dynamic/'
 * - 'engine/modules/[MODULE_NAME]/public/css/dynamic/'
 * EXAMPLES:
 * To add to the document one or more JS and CSS resources:
 * const libLoading = new Z4MDynLibLoading();
 * libLoading.addJSLibrary('myjslib', 'mymodule'); // Located in 'mymodule'
 * libLoading.addCSSStyleSheet('mystylesheet'); // Located in 'app'
 * libLoading.loadAll();
 *
 * To import a JS Module script:
 * const libLoading = new Z4MDynLibLoading();
 * libLoading.importJSLib('myjsmodulelib', 'mymodule');
 */
class Z4MDynLibLoading {

    #moduleRelativePath = 'engine/modules/[MODULE_NAME]/public/'
    #appRelativePath = 'applications/default/public/'
    #defaultLibSubdir = 'dynamic/'
    #loadInSequence
    #areLogShownInConsole
    #libraries
    #successCallback
    #failedCallback

    /**
     * Constructs a new Z4MDynLibLoading object
     * @param {boolean} loadInSequence If is true (default value), libraries and
     * stylesheets are loaded in sequence in the order where they were added. If
     * is FALSE, resources are loaded in parallel (the loading order does not
     * matter).
     * @param {boolean} areLogShownInConsole If is true (fale by default), log
     * entries are displayed in the browser's console for debug purpose.
     * @returns {Z4MDynLibLoading}
     */
    constructor(loadInSequence = true, areLogShownInConsole = false) {
        if(typeof z4m_dynlibloading_extensions === 'undefined') {
            throw new Error("Variable 'z4m_dynlibloading_extensions' not set.");
        }
        if(typeof z4m_dynlibloading_timestamps === 'undefined') {
            throw new Error("Variable 'z4m_dynlibloading_timestamps' not set.");
        }
        this.#libraries = [];
        this.#loadInSequence = loadInSequence;
        this.#areLogShownInConsole = areLogShownInConsole;
        this.#successCallback = null;
        this.#failedCallback = null;
    }

    /**
     * Returns the library URL
     * @param {Object} libObj Library infos
     * @param {boolean} addVersionToURL If true, file time is added to the URL
     * as version.
     * @returns {String} Libray URL
     */
    #getLibURL(libObj, addVersionToURL = true) {
        const fileExt = libObj.ext === null ? z4m_dynlibloading_extensions[libObj.type]
            : '.' + libObj.ext,
            subdir = libObj.subDir === null ? this.#defaultLibSubdir : libObj.subDir,
            subPath = libObj.type + '/' + subdir + libObj.baseName + fileExt,
            url = (typeof libObj.module === 'string' ?
                this.#moduleRelativePath.replace('[MODULE_NAME]', libObj.module)
                : this.#appRelativePath) + subPath;
        if (addVersionToURL) {
            let version = '0';
            for (const [key, timestamp] of Object.entries(z4m_dynlibloading_timestamps)) {
                if (url.indexOf(key) > -1) {
                    version = timestamp;
                    break;
                }
            }
            return url + '?v=' + version;
        }
        return url;
    }
    
    #displayLogInConsole(message, other) {
        if (this.#areLogShownInConsole) {
            const msg = 'Z4MDynLibLoading - ' + message;
            if (other === undefined) {                    
                console.log(msg);
            } else {
                console.log(msg, other);
            }
        }
    }

    /**
     * Add a JS library to load from the application or from a module
     * @param {string} libBaseName Base name of the file to load (without file
     * extension).
     * @param {string} moduleName Optional, name of the module where the library
     * is located. If is null, the library is located within public/js/dynamic
     * subfolder of the application.
     * @param {string} libExtension Optional, the file extension of the library.
     * If is null, the file extension is 'min.js' when CFG_DEV_JS_ENABLED is
     * FALSE and 'js' when CFG_DEV_JS_ENABLED is TRUE.
     * @param {string} subDirectory Optional, the subdirectory where the library
     * is located. If is null, the subdirectory is 'dynamic/'.
     */
    addJSLibrary(libBaseName, moduleName = null, libExtension = null, subDirectory = null) {
        this.#libraries.push({type: 'js', baseName: libBaseName, module: moduleName,
            ext: libExtension, subDir: subDirectory});
    }

    /**
     * Add a CSS style sheet to load from the application or from a module
     * @param {string} libBaseName Base name of the file to load (without file
     * extension).
     * @param {string} moduleName Optional, name of the module where the library
     * is located. If is null, the library is located within public/js/dynamic
     * subfolder of the application.
     * @param {string} libExtension Optional, the file extension of the library.
     * If is null, the file extension is 'min.css' when CFG_ZNETDK_CSS is
     * configured to load the minified version of ZnetDK 4 Mobile's style sheet.
     * Otherwise is 'css'.
     * @param {string} subDirectory Optional, the subdirectory where the library
     * is located. If is null, the subdirectory is 'dynamic/'.
     */
    addCSSStyleSheet(libBaseName, moduleName = null, libExtension = null, subDirectory = null) {
        this.#libraries.push({type: 'css', baseName: libBaseName, module: moduleName,
            ext: libExtension, subDir: subDirectory});
    }

    /*
     * Sets the function to call back once the libraries are loaded successfully
     * or when a JS module library is imported.
     * @param {function} callback Function to call back.
     */
    setSuccessLoadingCallback(callback) {
        this.#successCallback = callback;
    }
    
    #callbackOnSuccess(infos) {
        if (typeof this.#successCallback === 'function') {
            this.#successCallback(infos);
            return true;
        }
        return false;
    }

    /**
     * Sets the function to call back if the library loading or import has
     * failed.
     * @param {function} callback Function to call back.
     */
    setFailedLoadingCallback(callback) {
        this.#failedCallback = callback;
    }
    
    #callbackOnFailure(error) {
        if (typeof this.#failedCallback === 'function') {
            this.#failedCallback(error);
            return true;
        }
        return false;
    }

    /**
     * Loads the JS libraries and CSS style sheets added by calling the
     * addJSLibrary() and addCSSStyleSheet() methods.
     * If a callback function is set via the setSuccessLoadingCallback() and
     * setFailedLoadingCallback() methods, it is called back on success and on
     * error.
     * @returns {Promise} A promise resolved after loading succeeded or when an
     * error is thrown.
     */
    loadAll() {
        if (this.#libraries.length === 0) {
            throw new Error("No libraries added for loading.");
        }
        const $this = this, linkUrls = [], scriptUrls = [];
        for (let i = 0; i < this.#libraries.length; i++) {
            const source = this.#libraries[i];
            const sourceUrl = this.#getLibURL(source);
            if (source.type === 'js') {
                if (!isScriptLoaded(sourceUrl)) {
                    scriptUrls.push(sourceUrl);
                } else {
                    this.#displayLogInConsole('JS library already loaded: ' + sourceUrl);
                }
            } else {
                if (!isLinkLoaded(sourceUrl)) {
                    linkUrls.push(sourceUrl);
                } else {
                    this.#displayLogInConsole('CSS library already loaded: ' + sourceUrl);
                }
            }
        }
        this.#displayLogInConsole('Libraries to load: ', [linkUrls, scriptUrls]);
        return this.#loadInSequence ? loadAllInSequence() : loadAllInParallel();
        async function loadAllInSequence() {
            const elements = [];
            try {
                for (const url of linkUrls) {
                    elements.push(await loadLink(url));
                }
                for (const url of scriptUrls) {
                    elements.push(await loadScript(url));
                }
                $this.#displayLogInConsole('All libraries loaded.');
                $this.#callbackOnSuccess(elements);
                return true;
            } catch (failedUrl) {
                const errorMsg = 'Library loading failed for URL=' + failedUrl;
                $this.#displayLogInConsole(errorMsg);
                if (!$this.#callbackOnFailure(failedUrl)) {
                    throw new Error(errorMsg);
                }
                return false;
            }
        }
        function loadAllInParallel() {
            const linkLoadings = linkUrls.map(function(url){
                return loadLink(url);
            });
            const scriptLoadings = scriptUrls.map(function(url){
                return loadScript(url);
            });
            const loadings = linkLoadings.concat(scriptLoadings);
            return Promise.all(loadings).then(function(elements){
                $this.#displayLogInConsole('All libraries loaded.');
                $this.#callbackOnSuccess(elements);
                return true;
            }).catch(function(url) {
                const errorMsg = 'Library loading failed for URL=' + url;
                $this.#displayLogInConsole(errorMsg);
                if (!$this.#callbackOnFailure(url)) {
                    throw new Error(errorMsg);
                }
                return false;
            });
        }
        function isScriptLoaded(url) {
            return document.querySelector('script[src="' + url + '"]') !== null;
        }
        function loadScript(url) {
            return new Promise((resolve, reject) => {
                const scriptEl = document.createElement('script');
                scriptEl.onload = function(){
                    $this.#displayLogInConsole("Loading succeeded for JS library '" + url + "'.");
                    resolve(scriptEl);
                };
                scriptEl.onerror = function(error){
                    $this.#displayLogInConsole("Loading failed for JS library: '" + url + "'.", error.message);
                    reject(url);
                };
                scriptEl.src = url;
                document.head.append(scriptEl);
            });
        }
        function isLinkLoaded(url) {
            return document.querySelector('link[rel="stylesheet"][type="text/css"][href="'
                    + url + '"]') !== null;
        }
        function loadLink(url) {
            return new Promise((resolve, reject) => {
                const linkEl = document.createElement('link');
                linkEl.rel = 'stylesheet';
                linkEl.type = 'text/css';
                linkEl.onload = function(){
                    $this.#displayLogInConsole("Loading succeeded for CSS library '" + url + "'.");
                    resolve(linkEl);
                };
                linkEl.onerror = function(error){
                    $this.#displayLogInConsole("Loading failed for CSS library: '" + url + "'.", error.message);
                    reject(url);
                };
                linkEl.href = url;
                document.head.append(linkEl);
            });
        }        
    }

    /**
     * Imports a JS module. The library is ./engine/modules/[moduleName]/public/
     * js/dynamic/[libBaseName][.js|.min.js] or ./applications/default/public/
     * js/dynamic/[libBaseName][.js|.min.js]
     * @param {string} libBaseName Name of the JS library without file extension
     * @param {string|null} moduleName Optional, name of the module containing
     * the library to import as JS module. Value null if the library is located
     * within the application.
     * @param {string|null} libExtension Optional, the file extension of the
     * library. If is null, the file extension is 'min.js' if CFG_DEV_JS_ENABLED
     * is FALSE and 'js' if CFG_DEV_JS_ENABLED is TRUE.
     * @param {string|null} subDirectory Optional, if is null, the subdirectory
     * is 'dynamic/' by default.
     * @param {string|null} libVersion Optional, if is null, the file time of
     * the library set for the library in the JS global variable named
     * 'z4m_dynlibloading_timestamps'.
     * @return {Promise} The promise returned by the JS import function.
     */
    importJSLib(libBaseName, moduleName = null, libExtension = null,
            subDirectory = null, libVersion = null) {
        const pathname = z4m.ajax.getParamsFromAjaxURL(),
            libPath = this.#getLibURL({
                type: 'js',
                baseName: libBaseName,
                module: moduleName,
                ext: libExtension,
                subDir: subDirectory
            }, libVersion === null);
        let url = pathname.url.replace('/index.php', '') + '/' + libPath;
        if (libVersion !== null) {
            url += '?v=' + libVersion;
        }        
        const $this = this;
        return import(url).then(function(module){
            $this.#displayLogInConsole("Import succeeded for JS library '" + url + "'.");
            $this.#callbackOnSuccess(module);            
            return module;
        }).catch(function(error) {
            const errorMsg = "Import failed for JS library: '" + url + "'.";
            $this.#displayLogInConsole(errorMsg, error.message);
            if (!$this.#callbackOnFailure(errorMsg + ' ' + error.message)) {
                throw new Error(errorMsg + ' ' + error.message);
            }
            return false;
        });
    }
};
