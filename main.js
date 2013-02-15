/*
* Copyright (c) 2013 Zaidin Amiot. All rights reserved.
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    'use strict';
    
    // Brackets modules.
    var CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        Menus               = brackets.getModule("command/Menus"),

    // Extension variables.
        AUTOMATCH           = 'automatch.pairs.toggle',
        _enabled            = false,
        _pairs              = JSON.parse(require('text!pairs.json')),
        _document           = null,
        _lastCharacter      = null;

    // Extension functions.
    
    // Listener callback where all the magic happens.
    function _handler(event, document, change) {
        var token = change.text[0],
            to = {
                ch: change.from.ch + 1,
                line: change.from.line
            };

        // Remove listener while performing changes to avoid unwanted
        // infinite loop effect.
        $(document).off('change', _handler);
        
        // Cancel a change if a closing character is typed after an insertion.
        if (_lastCharacter === token) {
            document.replaceRange('', change.from, to);
            document._masterEditor.setCursorPos(to);
        }
        
        // Insert the matching closing character.
        if (_pairs.hasOwnProperty(token)) {
            document.replaceRange(_pairs[token], to);
            document._masterEditor.setCursorPos(to);
            _lastCharacter = _pairs[token];
        } else {
            _lastCharacter = null;
        }
        
        // Business time.
        $(document).on('change', _handler);
    }
    
    // Toggle the extension, set the _document and register the listener.
    function _toggle() {
        _document = _document || DocumentManager.getCurrentDocument();
        _document.addRef();
        _enabled = !_enabled;
        
        // Set the new state for the menu item.
        CommandManager.get(AUTOMATCH).setChecked(_enabled);
        
        // Register or remove listener depending on _enabled.
        if (_enabled) {
            $(_document).on('change', _handler);
        } else {
            $(_document).off('change', _handler);
            _document.releaseRef();
            _document = null;
        }
    }
    
    // Reset the listeners when the active editor change.
    $(EditorManager).on("activeEditorChange",
        function (event, current, previous) {
            if (_enabled) {
                if (previous) {
                    $(previous.document).off('change', _handler);
                    previous.document.releaseRef();
                    _document = null;
                }
                if (current) {
                    $(current.document).on('change', _handler);
                    _document = current.document;
                    _document.addRef();
                }
            }
        });

    // Register command.
    CommandManager.register("Enable Automatch Pairs", AUTOMATCH, _toggle);

    // Add command to View menu.
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(AUTOMATCH);

    // Set the starting state for the menu item.
    CommandManager.get(AUTOMATCH).setChecked(_enabled);
});