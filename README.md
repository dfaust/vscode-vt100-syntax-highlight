Terminal Color and Style Highlighting for VS Code
=================================================

This extension provides highlighting for **terminal color** escape sequences in the editor.
The colors and styles can be customized via the configuration and light / dark theming is supported.
The included preview feature can be used to view the source file like it would be shown in a terminal.
With the export features the source file can be converted to text or to HTML.

Features
--------

- **Editor**: Color and styling support
- **Editor**: Snippets for escape sequences
- **Preview**: Terminal-like preview of the file
- **Export**: Text export with removed escape sequences
- **Export**: HTML export with rendered escape sequences

Below is a screenshot how the highlighted sample file might look by applying this plugin.
Select the file type "VT100 Terminal" on the lower right corner to enable highlighting of a file.

![Example Result](sample/ExampleResult.gif)

Extension Settings
------------------

Edit the global or workspace configuration and apply your custom colors.
The configuration values shown below are the default values set by the plugin.
All `foreground-color`, `background-color` and `attribute` settings support defining two styling variants.
The variant defined in the `editor` sub-configuration is used for the editor view, while the `preview` sub-configuration is used for the HTML preview.
If no sub-configurations are defined the style is used for both views.

```jsonc
{
    // Associate the VT100 extension with *.log files if you want to.
    // "files.associations": {
    //     "*.log": "vt100"
    // },

    // Default foreground color and inverted default foreground color
    "vt100.foreground-color-default": {
        "dark": { "color": "#FFFFFF" },
        "light": { "color": "#000000" }
    },
    "vt100.foreground-color-inverted": {
        "dark": { "color": "#000000" },
        "light": { "color": "#FFFFFF" }
    },

    // Standard foreground colors
    "vt100.foreground-color-black": { "color":  "#555555" },
    "vt100.foreground-color-red": { "color":  "#FF0000" },
    "vt100.foreground-color-green": { "color":  "#00FF00" },
    "vt100.foreground-color-yellow": { "color":  "#FFFF00" },
    "vt100.foreground-color-blue": { "color":  "#0000FF" },
    "vt100.foreground-color-magenta": { "color":  "#FF00FF" },
    "vt100.foreground-color-cyan": { "color":  "#00FFFF" },
    "vt100.foreground-color-light-gray": { "color":  "#BBBBBB" },
    "vt100.foreground-color-dark-gray": { "color":  "#777777" },
    "vt100.foreground-color-light-red": { "color":  "#FF7777" },
    "vt100.foreground-color-light-green": { "color":  "#77FF77" },
    "vt100.foreground-color-light-yellow": { "color":  "#FFFF77" },
    "vt100.foreground-color-light-blue": { "color":  "#7777FF" },
    "vt100.foreground-color-light-magenta": { "color":  "#FF77FF" },
    "vt100.foreground-color-light-cyan": { "color":  "#77FFFF" },
    "vt100.foreground-color-white": { "color":  "#FFFFFF" },

    // Default background color and inverted default background color
    "vt100.background-color-default": {},
    "vt100.background-color-inverted": {},

    // Standard background colors
    "vt100.background-color-black": { "background-color":  "#000000" },
    "vt100.background-color-red": { "background-color":  "#770000" },
    "vt100.background-color-green": { "background-color":  "#007700" },
    "vt100.background-color-yellow": { "background-color":  "#777700" },
    "vt100.background-color-blue": { "background-color":  "#000077" },
    "vt100.background-color-magenta": { "background-color":  "#770077" },
    "vt100.background-color-cyan": { "background-color":  "#007777" },
    "vt100.background-color-light-gray": { "background-color":  "#666666" },
    "vt100.background-color-dark-gray": { "background-color":  "#222222" },
    "vt100.background-color-light-red": { "background-color":  "#773333" },
    "vt100.background-color-light-green": { "background-color":  "#337733" },
    "vt100.background-color-light-yellow": { "background-color":  "#777733" },
    "vt100.background-color-light-blue": { "background-color":  "#333377" },
    "vt100.background-color-light-magenta": { "background-color":  "#773377" },
    "vt100.background-color-light-cyan": { "background-color":  "#337777" },
    "vt100.background-color-white": { "background-color":  "#AAAAAA" },

    // VT100 attributes
    "vt100.attribute-bold": { "font-weight": "bold" },
    "vt100.attribute-dim": { "opacity": "0.7", "font-weight": "lighter" },
    "vt100.attribute-underlined": { "text-decoration": "underline solid" },
    "vt100.attribute-blink": {
        // The configuration for the editor and the preview is different,
        // because the editor does not support all CSS options.
        "editor": {
            "border": "1px dotted #FFFFFF77"
        },
        "preview": {
            // The animation is defined in the default custom CSS setting
            // for the preview.
            "animation": "blink-animation 1s step-start 0s infinite"
        }
    },
    "vt100.attribute-inverted": { },
    "vt100.attribute-hidden": { "opacity": "0.3" },

    // VT100 escape sequences
    // Do not apply additional styling to escape sequences (default).
    "vt100.escape-sequence": { },

    // Style for all text which is not an escape sequence.
    "vt100.text": { },

    // Make escape sequences white and fully visible in the editor.
    // Escape sequences are never rendered in the preview.
    // "vt100.escape-sequence": { "color": "#FFFFFF !important", "opacity": "1.0 !important"  },

    // Make escape sequences invisible in the editor.
    // "vt100.escape-sequence": { "opacity": "0.0 !important" },

    // Use the default editor font settings.
    "vt100.font-family": null,
    "vt100.font-size": null,
    "vt100.font-weight": null,

    // Use a different font for the preview.
    // Be sure to surround names with spaces in quotes.
    // "vt100.font-family": "'Lucida Console', monospace",

    // Additional custom CSS which is required for the preview.
    // The keyframes are required when animating the blinking style.
    // Use the classes .vscode-light, .vscode-dark and .vscode-high-contrast
    // to create theme dependent styles.
    "vt100.custom-css": {
        "*": {
            "padding": "0px",
            "margin": "0px"
        },
        ".bg": {
            "display": "inline-block",
            "padding": "0.1em"
        },
        "@keyframes blink-animation": {
            "50%": {
                "opacity": "0.0"
            }
        }
        // Example for dark theme only definition, which uses white text
        // when viewing in dark mode.
        // The same effect can be created by using the "dark" and "light"
        // settings of the other configuration options.
        //".vscode-dark .bg": {
        //  "color": "white"
        //}
    }
}
```

The HTML preview allows all [CSS properties](https://www.w3schools.com/cssref/default.asp) which can be set for a `span` element.
The [common properties](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions) listed below are supported by the editor view.
The HTML property names are automatically converted to the VS Code internal format which allows one value to be used for both configurations variants.
Even though the color configuration settings are called `foreground-color-*` and `background-color-*`, all properties below can be specified in the editor, if desired.

- **text-decoration**
- **outline-width**
- **outline-style**
- **outline-color**
- **outline**
- **opacity**
- **letter-spacing**
- **font-weight**
- **font-style**
- **cursor**
- **color**
- **border-width**
- **border-style**
- **border-spacing**
- **border-radius**
- **border-color**
- **border**
- **before**
- **background-color**
- **after**

The HTML preview uses the HTML class names in abbreviated form to reduce the memory consumption of the generated HTML code.
Below is the list with all class names and the abbreviations which are used in the HTML code.

- **foreground**: fg
- **foreground-color-default**: fg-de
- **foreground-color-inverted**: fg-in
- **foreground-color-black**: fg-bl
- **foreground-color-red**: fg-re
- **foreground-color-green**: fg-gr
- **foreground-color-yellow**: fg-yl
- **foreground-color-blue**: fg-blu
- **foreground-color-magenta**: fg-mg
- **foreground-color-cyan**: fg-cy
- **foreground-color-light-gray**: fg-lg
- **foreground-color-dark-gray**: fg-dg
- **foreground-color-light-red**: fg-lr
- **foreground-color-light-green**: fg-lgr
- **foreground-color-light-yellow**: fg-ly
- **foreground-color-light-blue**: fg-lb
- **foreground-color-light-magenta**: fg-lm
- **foreground-color-light-cyan**: fg-lc
- **foreground-color-white**: fg-wh
- **background**: bg
- **background-color-default**: bg-de
- **background-color-inverted**: bg-in
- **background-color-black**: bg-bl
- **background-color-red**: bg-re
- **background-color-green**: bg-gr
- **background-color-yellow**: bg-yl
- **background-color-blue**: bg-blu
- **background-color-magenta**: bg-mg
- **background-color-cyan**: bg-cy
- **background-color-light-gray**: bg-lg
- **background-color-dark-gray**: bg-dg
- **background-color-light-red**: bg-lr
- **background-color-light-green**: bg-lgr
- **background-color-light-yellow**: bg-ly
- **background-color-light-blue**: bg-lb
- **background-color-light-magenta**: bg-lm
- **background-color-light-cyan**: bg-lc
- **background-color-white**: bg-wh
- **attribute-bold**: at-bo
- **attribute-dim**: at-di
- **attribute-underlined**: at-ul
- **attribute-blink**: at-bl
- **attribute-inverted**: at-in
- **attribute-hidden**: at-hi
- **text**: te
- **escape-sequence**: es

Test the Extension with an Example
----------------------------------

Use the python program below to generate a sample file which contains VT100 escape sequences.

```python
#!/bin/env python3

FGCOLORS = [
    39,
    30, 31, 32, 33, 34, 35, 36, 37,
    90, 91, 92, 93, 94, 95, 96, 97
]
BGCOLORS = [
    49,
    40, 41, 42, 43, 44, 45, 46, 47,
    100, 101, 102, 103, 104, 105, 106, 107
]
ATTRIBUTES = [ 0, 1, 2, 4, 5, 7, 8 ]

for bgColor in BGCOLORS:
    for fgColor in FGCOLORS:
        line = ""
        for attribute in ATTRIBUTES:
            style = f"{attribute};{fgColor};{bgColor}"
            line += f"\x1b[0;{style}m {style}"
        line += "\x1b[0m"
        print(line)
    print()
```

Run the program with `python3 generate_sample.py > sample.vt100`.
The output looks similar to the image shown below on a terminal.

![Example Result on a Terminal](sample/ExampleSource.png)

Requirements for Build
----------------------

Typescript for plugin development.
This extension does not need any other dependencies.

```bash
#!/bin/bash

# Install dependencies
npm install

# Build plugin
vsce package
```
