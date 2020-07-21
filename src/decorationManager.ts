import * as vscode from 'vscode';

import { ConfigurationManager } from './configurationManager';

export class DecorationManager implements vscode.Disposable {

	private _configuration: ConfigurationManager;
	private _disposables: vscode.Disposable[] = [];
	private _decorations: Map<string, vscode.TextEditorDecorationType>;

	constructor(configuration: ConfigurationManager) {
		this._configuration = configuration;
		this._decorations = new Map();

		this._configuration.onReload(() => {
			this._reloadDecorations();
			this._updateTextEditors(vscode.window.visibleTextEditors);
		}, null, this._disposables);

		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor != null) {
				this._updateTextEditors([ editor ]);
			}
		}, null, this._disposables);

		// Todo: Debounce since there might be a lot of small changes during writing
		vscode.workspace.onDidChangeTextDocument(event => {
			const editors = vscode.window.visibleTextEditors.filter(editor => editor.document == event.document);
			this._updateTextEditors(editors);
		}, null, this._disposables);

		this._registerDecorations();
		this._updateTextEditors(vscode.window.visibleTextEditors);
	}

	public dispose(): void {
		for (let disposable of this._disposables) {
			disposable.dispose();
		}
		this._disposables = [];
	}

	private _updateTextEditors(editors: vscode.TextEditor[]): void {
		for (let editor of editors) {
			if (editor != null && editor.document.languageId === 'vt100') {
				this._decorateEditor(editor);
			}
		}
	}

	private _registerDecorations() {
		for (let [key, value] of this._configuration.getSettings()) {
			const decoration = vscode.window.createTextEditorDecorationType(value as vscode.DecorationRenderOptions);
			this._decorations.set(key, decoration);
		}
	}

	private _reloadDecorations() {
		for (let [key, value] of this._decorations) {
			value.dispose();
		}
		this._decorations.clear();

		this._registerDecorations();
	}

	private _decorateEditor(editor: vscode.TextEditor) {
		const appliedDecorations: Map<string, vscode.Range[]> = new Map();
		for (let decorationName of this._decorations.keys()) {
			appliedDecorations.set(decorationName, []);
		}

		const tokenModifiers = new Map<string, string>();
		tokenModifiers.set('foreground-color', 'default');
		tokenModifiers.set('background-color', 'default');
		tokenModifiers.set('bold', 'no');
		tokenModifiers.set('dim', 'no');
		tokenModifiers.set('underlined', 'no');
		tokenModifiers.set('blink', 'no');
		tokenModifiers.set('inverted', 'no');
		tokenModifiers.set('hidden', 'no');

		const document = editor.document;
		const lines = document.getText().split(/\r\n|\r|\n/);
		for (let i = 0; i < lines.length; i++) {
			const escapeRegex: RegExp = /\x1B\[((?:[0-9]+;)*?[0-9]+)m/g;
			const line = lines[i];

			let lastIndex = 0;
			let match;
			while ((match = escapeRegex.exec(line)) !== null) {
				// Push last result
				if (match.index - lastIndex > 0) {
					const range = new vscode.Range(i, lastIndex, i, match.index);
					this._applyDecorations(range, tokenModifiers, appliedDecorations);
				}

				this._applyParams(match[1], tokenModifiers);
	
				const range = new vscode.Range(i, match.index, i, escapeRegex.lastIndex);
				this._applyDecorations(range, tokenModifiers, appliedDecorations);
				appliedDecorations.get('escape-sequence')!.push(range);

				lastIndex = escapeRegex.lastIndex;
			}

			if (line.length - lastIndex > 0)
			{
				const range = new vscode.Range(i, lastIndex, i, line.length);
				this._applyDecorations(range, tokenModifiers, appliedDecorations);
			}
		}

		for (let [key, value] of appliedDecorations) {
			editor.setDecorations(this._decorations.get(key)!, value);
		}
	}

	private _applyDecorations(range: vscode.Range, tokenModifiers: Map<string, string>, decorations: Map<string, vscode.Range[]>) {
		let foregroundColor;
		let backgroundColor;

		if (tokenModifiers.get('inverted') === 'yes') {
			foregroundColor = tokenModifiers.get('background-color');
			backgroundColor = tokenModifiers.get('foreground-color');

			if (foregroundColor === 'default') {
				foregroundColor = 'inverted';
			}
			if (backgroundColor === 'default') {
				backgroundColor = 'inverted';
			}
		} else {
			foregroundColor = tokenModifiers.get('foreground-color');
			backgroundColor = tokenModifiers.get('background-color');
		}

		decorations.get('foreground-color-' + foregroundColor)!.push(range);
		decorations.get('background-color-' + backgroundColor)!.push(range);

		for (let attribute of ['bold', 'dim', 'underlined', 'blink', 'hidden']) {
			if (attribute !== 'inverted') {
				if (tokenModifiers.get(attribute) === 'yes') {
					decorations.get('attribute-' + attribute)!.push(range);
				}
			}
		}
	}

	private _applyParams(params: string, tokenModifiers: Map<string, string>): void {
		// See https://misc.flogisoft.com/bash/tip_colors_and_formatting
		const splittedParams = params.split(';');

		for (var param of splittedParams) {
			if (param === "0") {
				tokenModifiers.set('foreground-color', 'default');
				tokenModifiers.set('background-color', 'default');
				tokenModifiers.set('bold', 'no');
				tokenModifiers.set('dim', 'no');
				tokenModifiers.set('underlined', 'no');
				tokenModifiers.set('blink', 'no');
				tokenModifiers.set('inverted', 'no');
				tokenModifiers.set('hidden', 'no');

			} else if (param === "1") {
				tokenModifiers.set('bold', 'yes');
			} else if (param === "2") {
				tokenModifiers.set('dim', 'yes');
			} else if (param === "4") {
				tokenModifiers.set('underlined', 'yes');
			} else if (param === "5") {
				tokenModifiers.set('blink', 'yes');
			} else if (param === "7") {
				tokenModifiers.set('inverted', 'yes');
			} else if (param === "8") {
				tokenModifiers.set('hidden', 'yes');

			} else if (param === "21") {
				tokenModifiers.set('bold', 'no');
			} else if (param === "22") {
				tokenModifiers.set('dim', 'no');
			} else if (param === "24") {
				tokenModifiers.set('underlined', 'no');
			} else if (param === "25") {
				tokenModifiers.set('blink', 'no');
			} else if (param === "27") {
				tokenModifiers.set('inverted', 'no');
			} else if (param === "28") {
				tokenModifiers.set('hidden', 'no');

			} else if (param === "39") {
				tokenModifiers.set('foreground-color', 'default');
			} else if (param === "30") {
				tokenModifiers.set('foreground-color', 'black');
			} else if (param === "31") {
				tokenModifiers.set('foreground-color', 'red');
			} else if (param === "32") {
				tokenModifiers.set('foreground-color', 'green');
			} else if (param === "33") {
				tokenModifiers.set('foreground-color', 'yellow');
			} else if (param === "34") {
				tokenModifiers.set('foreground-color', 'blue');
			} else if (param === "35") {
				tokenModifiers.set('foreground-color', 'magenta');
			} else if (param === "36") {
				tokenModifiers.set('foreground-color', 'cyan');
			} else if (param === "37") {
				tokenModifiers.set('foreground-color', 'light-gray');
			} else if (param === "90") {
				tokenModifiers.set('foreground-color', 'dark-gray');
			} else if (param === "91") {
				tokenModifiers.set('foreground-color', 'light-red');
			} else if (param === "92") {
				tokenModifiers.set('foreground-color', 'light-green');
			} else if (param === "93") {
				tokenModifiers.set('foreground-color', 'light-yellow');
			} else if (param === "94") {
				tokenModifiers.set('foreground-color', 'light-blue');
			} else if (param === "95") {
				tokenModifiers.set('foreground-color', 'light-magenta');
			} else if (param === "96") {
				tokenModifiers.set('foreground-color', 'light-cyan');
			} else if (param === "97") {
				tokenModifiers.set('foreground-color', 'white');

			} else if (param === "49") {
				tokenModifiers.set('background-color', 'default');
			} else if (param === "40") {
				tokenModifiers.set('background-color', 'black');
			} else if (param === "41") {
				tokenModifiers.set('background-color', 'red');
			} else if (param === "42") {
				tokenModifiers.set('background-color', 'green');
			} else if (param === "43") {
				tokenModifiers.set('background-color', 'yellow');
			} else if (param === "44") {
				tokenModifiers.set('background-color', 'blue');
			} else if (param === "45") {
				tokenModifiers.set('background-color', 'magenta');
			} else if (param === "46") {
				tokenModifiers.set('background-color', 'cyan');
			} else if (param === "47") {
				tokenModifiers.set('background-color', 'light-gray');
			} else if (param === "100") {
				tokenModifiers.set('background-color', 'dark-gray');
			} else if (param === "101") {
				tokenModifiers.set('background-color', 'light-red');
			} else if (param === "102") {
				tokenModifiers.set('background-color', 'light-green');
			} else if (param === "103") {
				tokenModifiers.set('background-color', 'light-yellow');
			} else if (param === "104") {
				tokenModifiers.set('background-color', 'light-blue');
			} else if (param === "105") {
				tokenModifiers.set('background-color', 'light-magenta');
			} else if (param === "106") {
				tokenModifiers.set('background-color', 'light-cyan');
			} else if (param === "107") {
				tokenModifiers.set('background-color', 'white');
			}
		}
	}
}