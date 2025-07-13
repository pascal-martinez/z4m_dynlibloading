class Z4MDynLibLoading{#moduleRelativePath='engine/modules/[MODULE_NAME]/public/'
#appRelativePath='applications/default/public/'
#defaultLibSubdir='dynamic/'
#loadInSequence
#areLogShownInConsole
#libraries
#successCallback
#failedCallback
constructor(loadInSequence=!0,areLogShownInConsole=!1){if(typeof z4m_dynlibloading_extensions==='undefined'){throw new Error("Variable 'z4m_dynlibloading_extensions' not set.")}
if(typeof z4m_dynlibloading_timestamps==='undefined'){throw new Error("Variable 'z4m_dynlibloading_timestamps' not set.")}
this.#libraries=[];this.#loadInSequence=loadInSequence;this.#areLogShownInConsole=areLogShownInConsole;this.#successCallback=null;this.#failedCallback=null}
#getLibURL(libObj,addVersionToURL=!0){const fileExt=libObj.ext===null?z4m_dynlibloading_extensions[libObj.type]:'.'+libObj.ext,subdir=libObj.subDir===null?this.#defaultLibSubdir:libObj.subDir,subPath=libObj.type+'/'+subdir+libObj.baseName+fileExt,url=(typeof libObj.module==='string'?this.#moduleRelativePath.replace('[MODULE_NAME]',libObj.module):this.#appRelativePath)+subPath;if(addVersionToURL){let version='0';for(const[key,timestamp]of Object.entries(z4m_dynlibloading_timestamps)){if(url.indexOf(key)>-1){version=timestamp;break}}
return url+'?v='+version}
return url}
#displayLogInConsole(message,other){if(this.#areLogShownInConsole){const msg='Z4MDynLibLoading - '+message;if(other===undefined){console.log(msg)}else{console.log(msg,other)}}}
addJSLibrary(libBaseName,moduleName=null,libExtension=null,subDirectory=null){this.#libraries.push({type:'js',baseName:libBaseName,module:moduleName,ext:libExtension,subDir:subDirectory})}
addCSSStyleSheet(libBaseName,moduleName=null,libExtension=null,subDirectory=null){this.#libraries.push({type:'css',baseName:libBaseName,module:moduleName,ext:libExtension,subDir:subDirectory})}
setSuccessLoadingCallback(callback){this.#successCallback=callback}
#callbackOnSuccess(infos){if(typeof this.#successCallback==='function'){this.#successCallback(infos);return!0}
return!1}
setFailedLoadingCallback(callback){this.#failedCallback=callback}
#callbackOnFailure(error){if(typeof this.#failedCallback==='function'){this.#failedCallback(error);return!0}
return!1}
loadAll(){if(this.#libraries.length===0){throw new Error("No libraries added for loading.")}
const $this=this,linkUrls=[],scriptUrls=[];for(let i=0;i<this.#libraries.length;i++){const source=this.#libraries[i];const sourceUrl=this.#getLibURL(source);if(source.type==='js'){if(!isScriptLoaded(sourceUrl)){scriptUrls.push(sourceUrl)}else{this.#displayLogInConsole('JS library already loaded: '+sourceUrl)}}else{if(!isLinkLoaded(sourceUrl)){linkUrls.push(sourceUrl)}else{this.#displayLogInConsole('CSS library already loaded: '+sourceUrl)}}}
this.#displayLogInConsole('Libraries to load: ',[linkUrls,scriptUrls]);return this.#loadInSequence?loadAllInSequence():loadAllInParallel();async function loadAllInSequence(){const elements=[];try{for(const url of linkUrls){elements.push(await loadLink(url))}
for(const url of scriptUrls){elements.push(await loadScript(url))}
$this.#displayLogInConsole('All libraries loaded.');$this.#callbackOnSuccess(elements);return!0}catch(failedUrl){const errorMsg='Library loading failed for URL='+failedUrl;$this.#displayLogInConsole(errorMsg);if(!$this.#callbackOnFailure(failedUrl)){throw new Error(errorMsg)}
return!1}}
function loadAllInParallel(){const linkLoadings=linkUrls.map(function(url){return loadLink(url)});const scriptLoadings=scriptUrls.map(function(url){return loadScript(url)});const loadings=linkLoadings.concat(scriptLoadings);return Promise.all(loadings).then(function(elements){$this.#displayLogInConsole('All libraries loaded.');$this.#callbackOnSuccess(elements);return!0}).catch(function(url){const errorMsg='Library loading failed for URL='+url;$this.#displayLogInConsole(errorMsg);if(!$this.#callbackOnFailure(url)){throw new Error(errorMsg)}
return!1})}
function isScriptLoaded(url){return document.querySelector('script[src="'+url+'"]')!==null}
function loadScript(url){return new Promise((resolve,reject)=>{const scriptEl=document.createElement('script');scriptEl.onload=function(){$this.#displayLogInConsole("Loading succeeded for JS library '"+url+"'.");resolve(scriptEl)};scriptEl.onerror=function(error){$this.#displayLogInConsole("Loading failed for JS library: '"+url+"'.",error.message);reject(url)};scriptEl.src=url;document.head.append(scriptEl)})}
function isLinkLoaded(url){return document.querySelector('link[rel="stylesheet"][type="text/css"][href="'+url+'"]')!==null}
function loadLink(url){return new Promise((resolve,reject)=>{const linkEl=document.createElement('link');linkEl.rel='stylesheet';linkEl.type='text/css';linkEl.onload=function(){$this.#displayLogInConsole("Loading succeeded for CSS library '"+url+"'.");resolve(linkEl)};linkEl.onerror=function(error){$this.#displayLogInConsole("Loading failed for CSS library: '"+url+"'.",error.message);reject(url)};linkEl.href=url;document.head.append(linkEl)})}}
importJSLib(libBaseName,moduleName=null,libExtension=null,subDirectory=null,libVersion=null){const pathname=z4m.ajax.getParamsFromAjaxURL(),libPath=this.#getLibURL({type:'js',baseName:libBaseName,module:moduleName,ext:libExtension,subDir:subDirectory},libVersion===null);let url=pathname.url.replace('/index.php','')+'/'+libPath;if(libVersion!==null){url+='?v='+libVersion}
const $this=this;return import(url).then(function(module){$this.#displayLogInConsole("Import succeeded for JS library '"+url+"'.");$this.#callbackOnSuccess(module);return module}).catch(function(error){const errorMsg="Import failed for JS library: '"+url+"'.";$this.#displayLogInConsole(errorMsg,error.message);if(!$this.#callbackOnFailure(errorMsg+' '+error.message)){throw new Error(errorMsg+' '+error.message)}
return!1})}}