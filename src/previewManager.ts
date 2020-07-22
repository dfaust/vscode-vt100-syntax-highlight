import * as vscode from 'vscode';

import { randomBytes } from 'crypto';
import { escape } from 'lodash';

import { ConfigurationManager } from './configurationManager';
import { VT100Parser } from './vt100Parser';


export class PreviewManager implements vscode.Disposable {

	private _configuration: ConfigurationManager;
	private _contentProvider: VT100ContentProvider;

	private _previews: VT100Preview[] = [];
	private _disposables: vscode.Disposable[] = [];

	constructor(configuration: ConfigurationManager) {
		this._configuration = configuration;
		this._contentProvider = new VT100ContentProvider(configuration);

		this._configuration.onReload(() => {
			this._contentProvider.reloadConfiguration();
			for (let preview of this._previews) {
				preview.refresh();
			}
		}, null, this._disposables);
	}

	public dispose(): void {
		for (let disposable of this._disposables) {
			disposable.dispose();
		}
		this._disposables = [];

		for (let preview of this._previews) {
			preview.dispose();
		}
		this._previews = [];
	}

	public showPreview(): void {
		return this._showPreviewImpl(false);
	}
	
	public showPreviewToSide(): void {
		return this._showPreviewImpl(true);
	}

	private _showPreviewImpl(sideBySide: boolean): void {
		const uri = vscode.window.activeTextEditor?.document?.uri;
		if (!(uri instanceof vscode.Uri)) {
			return;
		}

		const resourceColumn = (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) || vscode.ViewColumn.One;
		const previewColumn = sideBySide ? resourceColumn + 1 : resourceColumn;

		let preview = this._findPreview(uri, previewColumn);
		if (preview != null) {
			preview.reveal(previewColumn);
		} else {
			preview = this._createPreview(uri, previewColumn);
		}

		preview.update(uri);
	}

	private _createPreview(uri: vscode.Uri, previewColumn: vscode.ViewColumn): VT100Preview {
		const newPreview: VT100Preview = new VT100Preview(uri, previewColumn, this._contentProvider);

		newPreview.onDispose(() => {
			const existing = this._previews.indexOf(newPreview);
			if (existing === -1) {
				return;
			}

			this._previews.splice(existing, 1);
		});

		this._previews.push(newPreview);
		return newPreview;
	}

	private _findPreview(uri: vscode.Uri, previewColumn: vscode.ViewColumn): VT100Preview | undefined {
		return this._previews.find(preview => preview.matchesResource(uri, previewColumn));
	}

}

class VT100Preview {

	private _contentProvider: VT100ContentProvider;
	private _editor: vscode.WebviewPanel;
	private _uri: vscode.Uri;
	private _version?: { uri: vscode.Uri, version: number };

	private _disposables: vscode.Disposable[] = [];

	private _onDisposeEmitter = new vscode.EventEmitter<void>();
	public onDispose = this._onDisposeEmitter.event;

	private _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
	public onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

	constructor(uri: vscode.Uri, previewColumn: vscode.ViewColumn, contentProvider: VT100ContentProvider) {
		this._contentProvider = contentProvider;
		this._uri = uri;
		this._editor = vscode.window.createWebviewPanel('vt100.preview', 'VT100 Preview', previewColumn);
		this._editor.webview.options = {
			enableScripts: false,
			enableCommandUris: false,
			localResourceRoots: [],
			portMapping: []
		};

		this._editor.onDidDispose(() => {
			this.dispose();
		}, null, this._disposables);

		this._editor.onDidChangeViewState(e => {
			this._onDidChangeViewStateEmitter.fire(e);
		}, null, this._disposables);

		// Todo: Debounce
		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document.uri.fsPath == this._uri.fsPath) {
				this._update(this._uri, false);
			}
		}, null, this._disposables);
	
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor && editor.document.languageId === 'vt100') {
				this._update(editor.document.uri, true);
			}
		}, null, this._disposables);
	}

	dispose() {
		this._onDisposeEmitter.fire();

		this._onDisposeEmitter.dispose();
		this._onDidChangeViewStateEmitter.dispose();
		this._editor.dispose();

		for (let disposable of this._disposables) {
			disposable.dispose();
		}
		this._disposables = [];
	}

	public matchesResource(uri: vscode.Uri, previewColumn: vscode.ViewColumn): boolean {
		if (this._editor.viewColumn !== previewColumn) {
			return false;
		}

		// Currently there is no support for locked views
		// this._uri.fsPath === uri.fsPath
		return true;
	}

	public reveal(previewColumn: vscode.ViewColumn) {
		this._editor.reveal(previewColumn);
	}

	public refresh(): void {
		this._update(this._uri, true);
	}

	public update(uri: vscode.Uri): void {
		this._update(uri, true);
	}

	private async _update(uri: vscode.Uri, force: boolean): Promise<void> {
		const document = await vscode.workspace.openTextDocument(uri);
		const version: { uri: vscode.Uri, version: number } = { uri: uri, version: document.version };
		if (!force && version === this._version) {
			return;
		}

		this._uri = uri;
		this._version = version;

		const content: string = this._contentProvider.provideTextDocumentContent(document);

		// Check for concurrency
		if (this._uri === uri) {
			this._editor.webview.html = content;
		}
	}
}

class VT100ContentProvider {

	private _configuration: ConfigurationManager;
	private _styles: Map<string, any>;

	constructor(configuration: ConfigurationManager) {
		this._configuration = configuration;

		this._styles = new Map();
		this.reloadConfiguration();
	}

	public reloadConfiguration(): void {
		this._styles.clear();
		for (let [key, value] of this._configuration.getSettings()) {
			this._styles.set(key, value.previewStyle);
		}
	}

	public provideTextDocumentContent(document: vscode.TextDocument): string {
		const parser = new VT100Parser();
		const nonce = this._generateNonce();

		let html = '<html><head>';

		// Try to add at least a little bit of security
		html += `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'"></meta>"`;

		html += `<style type="text/css" nonce="${nonce}">`;
		for (let [key, value] of this._styles) {
			html += `.${key} {\n`;
			for (let [propertyKey, propertyValue] of Object.entries(value)) {
				html += `\t${propertyKey}: ${propertyValue};\n`;
			}
			html += '}';
		}
		html += '</style>';

		html += `<style type="text/css" nonce="${nonce}">`;
		html += this._configuration.getCustomPreviewCss();
		html += '</style>';

		html += '</head>';

		html += '<body>';
		parser.parse(document, (range, modifiers, lineEnd) => {
			// Just ignore escape sequences and don't render them
			if (modifiers.get('type') === 'escape-sequence') {
				return;
			}

			const [foregroundColor, backgroundColor] = this._getColors(modifiers);
			const classList: string[] = [];

			classList.push(modifiers.get('type')!);
			classList.push('foreground');
			classList.push(`foreground-color-${foregroundColor}`);

			for (let attribute of ['bold', 'dim', 'underlined', 'blink', 'inverted', 'hidden']) {
				if (modifiers.get(attribute) === 'yes') {
					classList.push('attribute-' + attribute);
				}
			}

			html += `<span class="background background-color-${backgroundColor}">`;
			html += `<span class="">`;
			html += `<span class="${classList.join(' ')}">`;
			html += escape(document.getText(range));
			html += '</span>';
			html += '</span></span>';

			if (lineEnd) {
				html += '<br>';
			}
		});
		html += '</body>';
		html += '</html>';
		return html;
	}

	private _generateNonce(): string {
		const buffer: Buffer = randomBytes(64);
		return buffer.toString('base64');
	}

	private _getColors(modifiers: Map<string, string>): [string, string] {
		let foregroundColor: string;
		let backgroundColor: string;

		if (modifiers.get('inverted') === 'yes') {
			foregroundColor = modifiers.get('background-color')!;
			backgroundColor = modifiers.get('foreground-color')!;

			if (foregroundColor === 'default') {
				foregroundColor = 'inverted';
			}
			if (backgroundColor === 'default') {
				backgroundColor = 'inverted';
			}
		} else {
			foregroundColor = modifiers.get('foreground-color')!;
			backgroundColor = modifiers.get('background-color')!;
		}

		return [foregroundColor, backgroundColor];
	}

}