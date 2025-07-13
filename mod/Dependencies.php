<?php

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
 * ZnetDK 4 Mobile dynamic library loading module tool class
 *
 * File version: 1.0
 * Last update: 07/11/2025
 */

namespace z4m_dynlibloading\mod;

/**
 * Get paths and timestamps of JS and CSS libraries.
 * This class is called by the 'layout/extra_html.php' script.
 * The timestamp set for each library is used to force the dynamic loading of
 * the most recent version.
 * - JS libraries are returned in their minified version if CFG_DEV_JS_ENABLED
 * is FALSE. Otherwise the not minified version is returned.
 * - CSS libraries are returned in their minified version if CFG_ZNETDK_CSS is
 * the minified stylesheet (ends by '-min.css'). Otherwise the non minified
 * version is returned.
 * -  If the library in its minified version is expected and it is not found,
 * then the non minified version is returned if exists. And it's the same if the
 * non minified version is expected and it is not found, then the minified
 * version of the library is loaded if exists.
 */
class Dependencies {

    static protected $relativeLibPaths = ['js/dynamic/', 'css/dynamic/'];

    /**
     * Returns the expected JS libraries extension according to the
     * configuration of ZnetDK 4 Mobile.
     * @return string Returns '.min.js' if CFG_DEV_JS_ENABLED is FALSE,
     * otherwise returns '.js'.
     */
    static public function getConfiguredJSExtension() {
        return self::isJSMinifedConfigured() ? '.min.js' : '.js';
    }

    /**
     * Returns the expected CSS libraries extension according to the
     * configuration of ZnetDK 4 Mobile.
     * @return string Returns '.min.css' if CFG_ZNETDK_CSS is the minified
     * version of the ZnetDK 4 Mobile stylesheet (ends by '-min.css'),
     * otherwise returns '.css'.
     */
    static public function getConfiguredCSSExtension() {
        return self::isCSSMinifedConfigured() ? '.min.css' : '.css';
    }
    
    /**
     * Returns the JS and CSS libraries found within the application (path
     * 'applications/default/public/') or within modules (path 'engine/modules/
     * [MODULE_NAME]/public/').
     * @return array Associative array where key is the relative of the library
     * and the value is the file time.
     */
    static public function getLibraries() {
        return array_merge(
            self::getAppLibraries(),
            self::getModuleLibraries()
        );
    }

    static protected function isJSMinifedConfigured() {
        return CFG_DEV_JS_ENABLED === FALSE;
    }

    static protected function isCSSMinifedConfigured() {
        return strpos(CFG_ZNETDK_CSS, '-min.') !== FALSE;
    }

    static protected function isMinifiedLibrary($basename) {
        $filename = pathinfo($basename, PATHINFO_FILENAME);
        return substr($filename, -4) === '.min';
    }

    static protected function isValidLibrary($basename) {
        $fileExtension = pathinfo($basename, PATHINFO_EXTENSION);
        return in_array($fileExtension, ['js', 'css']);
    }

    static protected function isExpectedLibrary($basename) {
        $fileExtension = pathinfo($basename, PATHINFO_EXTENSION);
        $isMinifiedConfigured = $fileExtension === 'js'
                ? self::isJSMinifedConfigured() : self::isCSSMinifedConfigured();
        if (self::isMinifiedLibrary($basename) && $isMinifiedConfigured) {
            return TRUE;
        }
        return !$isMinifiedConfigured && !self::isMinifiedLibrary($basename);
    }
    
    static protected function getExpectedLibraryPath($libPath) {
        $libPathWithoutExt = self::getLibPathWithoutExt($libPath);
        $fileExtension = pathinfo($libPath, PATHINFO_EXTENSION);
        $expectedExt = $fileExtension === 'js' 
                ? self::getConfiguredJSExtension() : self::getConfiguredCSSExtension();
        return $libPathWithoutExt . $expectedExt;
    }

    static protected function getLibPathWithoutExt($libPath) {        
        $fileExt = pathinfo($libPath, PATHINFO_EXTENSION);
        $extSep = self::isMinifiedLibrary($libPath) ? '.min.' : '.';
        return substr($libPath, 0, - strlen($extSep . $fileExt));
    }
    
    static protected function removeDuplicateLibs($libraries) {
        $keptLibs = [];
        foreach ($libraries as $relativePath => $fileTime) {
            if (self::isExpectedLibrary($relativePath) 
                    || !key_exists(self::getExpectedLibraryPath($relativePath), $libraries)) {
                $keptLibs[$relativePath] = $fileTime;
            }
        }
        return $keptLibs;
    }
    
    static protected function getFolderLibraries($absoluteBasePath, $relativeLibPath) {
        $libsFound = [];
        $extraDir = array('..', '.');
        if (!is_dir($absoluteBasePath . $relativeLibPath)) {
            return [];
        }
        $filesFound = array_diff(scandir($absoluteBasePath . $relativeLibPath,
                SCANDIR_SORT_ASCENDING), $extraDir);
        foreach ($filesFound as $basename) {
            if (self::isValidLibrary($basename)) {
                $libsFound[$relativeLibPath . $basename] = filemtime(
                    $absoluteBasePath . $relativeLibPath . $basename);
            }            
        }
        return self::removeDuplicateLibs($libsFound);
    }

    static protected function getAppLibraries() {
        $libsFound = [];
        $absoluteBasePath =  ZNETDK_APP_ROOT . '/';
        $relativeModulePublicPath = 'public/';
        foreach (self::$relativeLibPaths as $relativeLibPath) {
            $libsFound = array_merge($libsFound,
                self::getFolderLibraries($absoluteBasePath,
                        $relativeModulePublicPath . $relativeLibPath));
        }
        return $libsFound;
    }

    static protected function getModuleLibraries() {
        $libsFound = [];
        $modules = \General::getModules();
        if ($modules === FALSE) {
            return [];
        }
        $absoluteBasePath =  ZNETDK_MOD_ROOT . '/';
        foreach ($modules as $moduleName) {
            $relativeModulePublicPath = $moduleName . '/public/';
            foreach (self::$relativeLibPaths as $relativeLibPath) {
                $libsFound = array_merge($libsFound,
                    self::getFolderLibraries($absoluteBasePath,
                            $relativeModulePublicPath . $relativeLibPath));
            }
        }
        return $libsFound;
    }

}
