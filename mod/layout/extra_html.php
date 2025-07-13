<?php
/**
 * ZnetDK, Starter Web Application for rapid & easy development
 * See official website https://mobile.znetdk.fr
 * Copyright (C) 2025 Pascal MARTINEZ (contact@znetdk.fr)
 * License GNU GPL https://www.gnu.org/licenses/gpl-3.0.html GNU GPL
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
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 * --------------------------------------------------------------------
 * ZnetDK 4 Mobile dynamic library loading module extra HTML code
 * 
 * File version: 1.0
 * Last update: 07/11/2025
 */
use \z4m_dynlibloading\mod\Dependencies;
$libraries = Dependencies::getLibraries();
$jsExt = Dependencies::getConfiguredJSExtension();
$cssExt = Dependencies::getConfiguredCSSExtension();
?>
        <script>
            var z4m_dynlibloading_extensions = {
                css: '<?php echo $cssExt; ?>',
                js: '<?php echo $jsExt; ?>'
            };
            var z4m_dynlibloading_timestamps = {
<?php foreach ($libraries as $path => $timestamp) : ?>
                "<?php echo $path; ?>": '<?php echo $timestamp; ?>',
<?php endforeach; ?>
            };
        </script>
