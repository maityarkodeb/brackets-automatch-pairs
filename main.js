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
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        Menus               = brackets.getModule("command/Menus"),
    
    // Extension variables
        AUTO_PAIRING        = 'auto.pairing.enable',
        _auto_pairing       = false,
        _pairs              = JSON.parse(require('text!pairs.json')),
        _editor             = null,
        _lastCharacter      = null,

    // Extension functions
        _alterPosition = function (position, value) {
            return {
                ch: position.ch + value,
                line: position.line
            };
        },
        _changeHandler = function (event, document, change) {
            var token = change.text[0],
                from = change.from,
                to = _alterPosition(from, 1);
            $(document).off('change', _changeHandler);
            if (_lastCharacter === token) {
                document.replaceRange('', from, to);
                document._masterEditor.setCursorPos(to);
            }
            if (_pairs.hasOwnProperty(token)) {
                document.replaceRange(_pairs[token], to);
                document._masterEditor.setCursorPos(to);
                _lastCharacter = _pairs[token];
            } else {
                _lastCharacter = null;
            }
            $(document).on('change', _changeHandler);
        },
        _addListener = function (document) {
            $(document).on('change', _changeHandler);
        },
        _removeListener = function (document) {
            $(document).off('change', _changeHandler);
        },
        _handler = function () {
            _editor = _editor || EditorManager.getCurrentFullEditor();
            _auto_pairing = !_auto_pairing;
            CommandManager.get(AUTO_PAIRING).setChecked(_auto_pairing);
            // Register listener.
            if (_auto_pairing) {
                _addListener(_editor.document);
            } else {
                _removeListener(_editor.document);
            }
        };
    // Reset the listeners when the active editor change
    $(EditorManager).on("activeEditorChange",
        function (event, current, previous) {
            _editor = current;
            if (_auto_pairing) {
                _addListener(current.document);
                _removeListener(previous.document);
            }
        });
    // Register command.
    CommandManager.register("Enable Auto-Pairing", AUTO_PAIRING, _handler);

    // Add command to View menu.
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(AUTO_PAIRING);

    // Set the state in the menu.
    CommandManager.get(AUTO_PAIRING).setChecked(_auto_pairing);
});