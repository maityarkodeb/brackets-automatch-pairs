*Note:  This legacy extension will no longer be maintained due to the availability of "Auto Close Braces" in the Edit menu of Brackets 1.2.*

brackets-automatch-pairs
========================

Brackets extensions to enable automatic pairs matching.

Overview
--------

This is an Extension for [Brackets](https://github.com/adobe/brackets). 

Usage
-----

Toggle the extension (`View > Enable Automatch Pairs`) to auto-complete 
opening characters such as `(`, `[`, `{`,... with their counterparts 
when typing.

The list of pairs can be modified in the `pairs.json` file.

Installation
------------

The recommended way to install this extension is to use the Extension
Manager.

Open `File > Extension Manager...` (or click on the "brick" icon in the
toolbar), then click the `Install from URL...` button at the bottom.
From there, you can install this extension by entering this url:

    https://github.com/zr0z/brackets-automatch-pairs

Legacy installation
-------------------

Download and extract, or clone, the repositery and move it to the Brackets
extensions folder (`Help > Show Extensions Folder`).

Restart Brackets.

Todo
----

- Wrap selected text in matching pairs.
- Adapt behaviour of the insertion depending on the scope (especially in
  strings, comments).
