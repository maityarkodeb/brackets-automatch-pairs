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
        KeyEvent            = brackets.getModule("utils/KeyEvent"),

    // Extension variables.
        AUTOMATCH           = 'automatch.pairs.toggle',
        _enabled            = true,
        _pairs              = JSON.parse(require('text!pairs.json')),
        _matchStack         = [],
        _deletedToken       = null;

    // Extension functions.
     /**
     * listener for cursor movements. This does three things: 1)clears the matchStack and the deletedToken 
     * if the arrows keys are used to move the cursor, 2) remembers the deletedToken if backspace is pressed
     * 3) clears the deletedToken in all other cases
     *
     */
    function _cursorHandler(event, editor, keyEvent) {
        if (keyEvent.type === "keydown") {
            switch (keyEvent.which) {
            case KeyEvent.DOM_VK_UP:
            case KeyEvent.DOM_VK_DOWN:
            case KeyEvent.DOM_VK_LEFT:
            case KeyEvent.DOM_VK_RIGHT:
                _matchStack = [];
                _deletedToken = null;
                break;
            //if we hit the backspace, remember what was deleted
            case KeyEvent.DOM_VK_BACK_SPACE:
                var cursorPos = editor.getCursorPos(), from = {ch: cursorPos.ch - 1, line: cursorPos.line};
                var to = { ch: from.ch + 1, line: from.line};
                _deletedToken = editor.document.getRange(from, to);
                break;
            default:
                _deletedToken = null;
                break;
            }
        }
    }
    
    // Listener callback where all the magic happens.
    function _handler(event, document, change) {
        var token = change.text[0],
            to = {
                ch: change.from.ch + 1,
                line: change.from.line
            };

        // Remove listener while performing changes to avoid unwanted
        // infinite loop effect.
        $(document).off("change", _handler);
        
        // Cancel a change if a closing character is typed after an insertion otherwise
        //Insert the matching closing character and push the token entered on the stack.
        if (_matchStack[_matchStack.length - 1] === token) {
            document.replaceRange('', change.from, to);
            document._masterEditor.setCursorPos(to);
            _matchStack.pop();
        } else if (_pairs.hasOwnProperty(token)) {
            document.replaceRange(_pairs[token], to);
            document._masterEditor.setCursorPos(to);
            _matchStack.push(_pairs[token]);
        }
        //delete matching closing character if an opening character is deleted
        if (change.origin === "+delete" && _matchStack.length &&
                _pairs[_deletedToken] === _matchStack[_matchStack.length - 1]) {
            document.replaceRange('', change.from, to);
            document._masterEditor.setCursorPos(change.from);
            _matchStack.pop();
        }
        // Business time.
        $(document).on("change", _handler);
    }
    
    //utility functions for registering and deregistering event handlers
    function _registerHandlers(editor) {
        $(editor).on("keyEvent", _cursorHandler);
        $(editor.document).on("change", _handler);
        editor.document.addRef();
    }
    
    function _deregisterHandlers(editor) {
        $(editor).off("keyEvent", _cursorHandler);
        $(editor.document).off("change", _handler);
        editor.document.releaseRef();
    }
    
    // Toggle the extension, (de)register the listener.
    function _toggle() {
        var _editor =  EditorManager.getCurrentFullEditor();
        _enabled = !_enabled;
        // Set the new state for the menu item.
        CommandManager.get(AUTOMATCH).setChecked(_enabled);
        
        // Register or remove listener depending on _enabled.
        if (_enabled) {
            _registerHandlers(_editor);
        } else {
            _deregisterHandlers(_editor);
        }
    }
    
    // Reset the listeners when the active editor change.
    $(EditorManager).on("activeEditorChange",
        function (event, current, previous) {
            if (_enabled) {
                if (previous) {
                    _deregisterHandlers(previous);
                }
                if (current) {
                    _registerHandlers(current);
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